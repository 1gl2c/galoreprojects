import test from 'node:test';
import assert from 'node:assert/strict';
import fengari from 'fengari';
import { LIMIT_SCRIPT } from '../lib/inquiry.js';
const {lua,lauxlib,lualib,to_luastring,to_jsstring}=fengari;

test('actual Lua limiter enforces email, network and global limits and expires its buckets',()=>{
  const L=lauxlib.luaL_newstate();lualib.luaL_openlibs(L);
  // Execute the production Lua against deterministic Redis command semantics.
  // This tests the script itself; live Upstash connectivity is a separate activation check.
  const code=`
local store={}
local expires={}
local now=0
redis={call=function(command,key,value)
  if expires[key] and expires[key]<=now then store[key]=nil;expires[key]=nil end
  if command=='GET' then return store[key] or false end
  if command=='INCR' then store[key]=(store[key] or 0)+1;return store[key] end
  if command=='EXPIRE' then expires[key]=now+tonumber(value);return 1 end
  if command=='TTL' then return expires[key] and expires[key]-now or -1 end
  error('Unexpected Redis command')
end}
local function request(ip,email)
  KEYS={'ip:'..ip,'email:'..email,'global'}
  ARGV={'5','600','3','600','50','3600'}
  local function evaluate()
${LIMIT_SCRIPT}
  end
  return evaluate()
end
for i=1,3 do assert(request('first','same')[1]==1) end
assert(request('other','same')[1]==0)
assert(store['ip:other']==nil, 'Blocked request must not charge unrelated bucket')
now=601
assert(request('first','same')[1]==1)
store={};expires={};now=0
for i=1,5 do assert(request('network','email'..i)[1]==1) end
local denied=request('network','sixth')
assert(denied[1]==0 and denied[2]==600)
assert(store['email:sixth']==nil)
store={};expires={};now=0
for i=1,50 do assert(request('ip'..i,'email'..i)[1]==1) end
assert(request('new','new')[1]==0)
now=601
assert(request('new','new')[1]==0, 'Global hour must outlive per-user ten minutes')
now=3601
assert(request('new','new')[1]==1)
`;
  const result=lauxlib.luaL_dostring(L,to_luastring(code));
  const error=result===lua.LUA_OK?'':to_jsstring(lua.lua_tostring(L,-1));lua.lua_close(L);
  assert.equal(result,lua.LUA_OK,error);
});
