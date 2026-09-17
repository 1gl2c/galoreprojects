import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { mediaPolicy, entranceDuration } from '../assets/media-policy.js';

const source = (await readFile(new URL('../assets/site.js', import.meta.url), 'utf8'))
  .replace(/^import .*\n/, '');

function harness({ reduced = false, connection = {}, width = 390, rejectPlay = false, stalledPlay = false, hash = '' } = {}) {
  const events = () => ({ handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } });
  const state = { sources: [], animations: [], focus: 0, scroll: 0, address: '', timers: new Map() };
  let timerId = 0;
  const attributes = new Map();
  const video = Object.assign(events(), {
    dataset: { mobile: '/mobile.mp4', desktop: '/desktop.mp4' }, paused: true,
    getAttribute(name) { return attributes.get(name) || null; },
    removeAttribute(name) { attributes.delete(name); },
    load() {}, pause() { this.paused = true; },
    play() { if (rejectPlay) return Promise.reject(new Error('Autoplay declined')); if (stalledPlay) return new Promise(()=>{}); this.paused = false; return Promise.resolve(); },
  });
  Object.defineProperty(video, 'src', {
    set(value) { state.sources.push(value); attributes.set('src', value); },
    get() { return attributes.get('src') || ''; },
  });
  const labels = {};
  const toggle = Object.assign(events(), {
    hidden: true, setAttribute(name,value) { labels[name]=value; },
    querySelector(name) { return labels[name] ||= {}; },
  });
  const classes = new Set();
  const cover = {
    hidden: false, style: {}, classList: { add: value=>classes.add(value), remove: value=>classes.delete(value) },
    querySelector: name => name === '[data-cover-video]' ? video : toggle,
    getBoundingClientRect: () => ({top:108,height:662}),
    setAttribute() {}, removeAttribute() {},
    animate(frames,options) { state.animations.push(options); return {finished:Promise.resolve(),cancel(){}}; },
  };
  const entry = events();
  const main = { focus() {state.focus++;}, scrollIntoView() {state.scroll++;} };
  const document = Object.assign(events(), {
    readyState:'complete', hidden:false,
    querySelector: name => ({ '[data-cover]':cover, main, '[data-enter]':entry })[name],
  });
  const preference = Object.assign(events(), {matches:reduced});
  vm.runInNewContext(source, {
    mediaPolicy, entranceDuration, document, navigator:{connection},
    matchMedia:()=>preference, innerWidth:width,
    location:new URL('https://example.test/'+hash), URL, URLSearchParams,
    sessionStorage:{getItem(){return null;},setItem(){}},
    history:{replaceState(a,b,value){state.address=value;}},
    setTimeout(fn,delay){const id=++timerId;state.timers.set(id,{fn,delay});return id;},
    clearTimeout(id){state.timers.delete(id);},window:events(),
  });
  return {state,video,cover,toggle,entry,preference,labels};
}
const settle = async()=>{await Promise.resolve();await Promise.resolve();};

test('actual cover controller does not request video under reduced motion', async()=>{
  const h=harness({reduced:true}); await settle();
  assert.deepEqual(h.state.sources,[]);
  h.entry.handlers.click({preventDefault(){}}); await settle();
  assert.equal(h.cover.hidden,true); assert.equal(h.state.focus,1);
  assert.equal(h.state.animations.length,0);
});
test('data saver keeps poster until the user explicitly requests playback',async()=>{
  const h=harness({connection:{saveData:true}}); await settle();
  assert.deepEqual(h.state.sources,[]);
  h.toggle.handlers.click(); await settle();
  assert.deepEqual(h.state.sources,['/mobile.mp4']); assert.equal(h.video.paused,false);
});
test('autoplay rejection preserves an operable entrance and still fallback',async()=>{
  const h=harness({rejectPlay:true}); await settle();
  assert.equal(h.video.getAttribute('src'),null);
  assert.equal(h.labels['aria-label'],'Play background video');
  h.entry.handlers.click({preventDefault(){}}); await settle();
  assert.equal(h.cover.hidden,true); assert.equal(h.state.focus,1);
});
test('enter performs one transition, releases video, and transfers focus',async()=>{
  const h=harness(); await settle();
  h.entry.handlers.click({preventDefault(){}}); await settle();
  assert.equal(h.state.animations.length,1); assert.equal(h.state.animations[0].duration,520);
  assert.equal(h.cover.hidden,true); assert.equal(h.video.getAttribute('src'),null);
  assert.equal(h.state.focus,1); assert.equal(h.state.address,'/#main');
});
test('direct content links bypass cover and media loading',async()=>{
  const h=harness({hash:'#main'}); await settle();
  assert.equal(h.cover.hidden,true); assert.deepEqual(h.state.sources,[]);
});
test('switching to reduced motion releases a playing background',async()=>{
  const h=harness(); await settle();
  h.preference.matches=true; h.preference.handlers.change(); await settle();
  assert.equal(h.video.paused,true); assert.equal(h.video.getAttribute('src'),null);
});
test('stalled media abandons its request after four seconds without blocking entry',async()=>{
  const h=harness({stalledPlay:true}); await settle();
  const deadline=[...h.state.timers.values()].find(timer=>timer.delay===4000);
  assert.ok(deadline); deadline.fn(); await settle();
  assert.equal(h.video.getAttribute('src'),null);
  assert.equal(h.labels['aria-label'],'Play background video');
  h.entry.handlers.click({preventDefault(){}}); await settle();
  assert.equal(h.cover.hidden,true); assert.equal(h.state.focus,1);
});
