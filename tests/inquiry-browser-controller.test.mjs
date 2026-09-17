import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../assets/inquiry.js',import.meta.url),'utf8');
async function setup({enabled=true,code=503,result={error:'Not accepted. Please retry.'},networkFailure=false}={}) {
  const state={calls:[],reset:0,focus:0,sequence:0};
  const fields={disabled:true}; const availability={textContent:''};const status={textContent:'',focus(){state.focus++;},scrollIntoView(){}};
  const submit={textContent:'Send inquiry'};const another={hidden:true,addEventListener(name,fn){this[name]=fn;}};
  const elements={};const errors={};
  for(const name of ['name','email','organization','details']) {elements[name]={attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},focus(){}};errors[name+'-error']={textContent:''};}
  const data={name:'Jordan',email:'jordan@example.com',organization:'',details:'Please review this bid invitation.',website:''};
  const form={elements,querySelector:q=>({'fieldset':fields,'[data-form-status]':status,'[type=submit]':submit,'[data-another-inquiry]':another})[q],
    addEventListener(name,fn){this[name]=fn;},reportValidity(){return true;},setAttribute(){},removeAttribute(){},reset(){state.reset++;}};
  const document={querySelector:q=>q==='[data-inquiry-form]'?form:availability,getElementById:id=>errors[id]};
  vm.runInNewContext(source,{document,crypto:{randomUUID:()=>`test-uuid-${++state.sequence}`},AbortSignal,FormData:class {constructor(){return Object.entries(data);}},fetch:async(url,options)=>{
    if(url==='/api/inquiry-config')return {ok:true,json:async()=>({enabled})};
    state.calls.push(JSON.parse(options.body));if(networkFailure)throw new Error('Network down');
    return {status:code,json:async()=>result};
  }});
  for(let i=0;i<5;i++)await Promise.resolve();
  return {state,form,fields,status,another,data,elements,errors};
}
test('disabled launch flag prevents client submission',async()=>{
  const h=await setup({enabled:false});assert.equal(h.fields.disabled,true);
  await h.form.submit({preventDefault(){}});assert.equal(h.state.calls.length,0);
});
test('server failure and timeout retain entries and never announce acceptance',async()=>{
  for(const networkFailure of [false,true]) {
    const h=await setup({networkFailure});await h.form.submit({preventDefault(){}});
    assert.equal(h.state.reset,0);assert.equal(h.fields.disabled,false);assert.equal(h.another.hidden,true);assert.equal(h.state.focus,1);
    assert.equal(h.data.email,'jordan@example.com');assert.doesNotMatch(h.status.textContent,/Your inquiry was accepted/);
  }
});
test('retry uses same ID until edited, and server field errors are associated',async()=>{
  const h=await setup({code:422,result:{error:'Check your email.',fields:{email:'Enter a valid email address.'}}});
  await h.form.submit({preventDefault(){}});await h.form.submit({preventDefault(){}});
  assert.equal(h.state.calls[0].requestId,h.state.calls[1].requestId);
  assert.equal(h.elements.email.attributes['aria-invalid'],'true');assert.equal(h.errors['email-error'].textContent,'Enter a valid email address.');
  h.data.details='Edited project details for the inquiry.';await h.form.submit({preventDefault(){}});
  assert.notEqual(h.state.calls[1].requestId,h.state.calls[2].requestId);
});
test('only explicit 202 acceptance shows confirmation and prevents repeat sending',async()=>{
  for(const [code,result,accepted] of [[202,{accepted:true},true],[200,{accepted:true},false],[202,{success:true},false]]) {
    const h=await setup({code,result});await h.form.submit({preventDefault(){}});
    assert.equal(h.fields.disabled,accepted);assert.equal(h.another.hidden,!accepted);
    if(accepted){await h.form.submit({preventDefault(){}});assert.equal(h.state.calls.length,1);assert.match(h.status.textContent,/does not confirm inbox receipt/);}
  }
});
