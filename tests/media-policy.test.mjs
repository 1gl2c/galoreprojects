import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaPolicy, entranceDuration } from '../assets/media-policy.js';

test('reduced motion disables autoplay and entrance animation', () => {
  assert.equal(mediaPolicy({reduced:true}).autoplay,false);
  assert.equal(entranceDuration(true),0);
});
test('data saving and constrained connections prevent automatic media requests', () => {
  for (const options of [{saveData:true},{effectiveType:'slow-2g'},{effectiveType:'2g'},{effectiveType:'3g'},{downlink:0.7}]) {
    assert.equal(mediaPolicy(options).autoplay,false);
  }
});
test('capable connections get the appropriately sized media', () => {
  assert.deepEqual(mediaPolicy({width:390,effectiveType:'4g',downlink:10}),{autoplay:true,mobile:true});
  assert.deepEqual(mediaPolicy({width:1280}),{autoplay:true,mobile:false});
  assert.equal(entranceDuration(false,false),0);
  assert.equal(entranceDuration(false,true),520);
});
