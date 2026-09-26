const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
const currentCache = source.match(/const CACHE = '([^']+)'/)[1];
const base = 'https://example.com/water-sort/';
const response = body => ({body,status:200,type:'basic',clone(){return response(body);}});
function setup({offline=false,writeFails=false}={}){
  const handlers={}, entries=new Map(), calls=[], removed=[], installed=[];
  const key = r => new URL(typeof r==='string'?r:r.url,base).href;
  const store={
    match:async r=>entries.get(key(r)),
    put:async(r,res)=>{if(writeFails)throw Error('quota');entries.set(key(r),res);},
    addAll:async rs=>installed.push(...rs)
  };
  const context=vm.createContext({URL,
    Request:class {constructor(url,options){this.url=key(url);Object.assign(this,options);}},
    self:{location:{origin:new URL(base).origin},addEventListener:(n,h)=>handlers[n]=h,
      skipWaiting:async()=>{},clients:{claim:async()=>{}}},
    caches:{open:async()=>store,keys:async()=>['games-v1',currentCache,'another-app'],delete:async k=>removed.push(k)},
    fetch:async(r,options)=>{calls.push({r,options});if(offline)throw Error('offline');return response('fresh');}
  });
  vm.runInContext(source,context);
  return {entries,calls,removed,installed,handlers,
    async event(name,request){
      const tasks=[];let result;
      handlers[name]({request,waitUntil:p=>tasks.push(p),respondWith:p=>result=p});
      const res=await result;await Promise.all(tasks);return res;
    }
  };
}
const navigation = suffix => ({url:base+suffix,method:'GET',mode:'navigate'});
test('online navigation returns the release even when an older page is cached',async()=>{
  const h=setup();h.entries.set(base+'water-sort.html',response('old'));
  const res=await h.event('fetch',navigation('water-sort.html'));
  assert.equal(res.body,'fresh');assert.equal(h.calls[0].options.cache,'no-cache');
  assert.equal(h.entries.get(base+'water-sort.html').body,'fresh');
});
test('offline navigation with a release query falls back to the precached page',async()=>{
  const h=setup({offline:true});h.entries.set(base+'water-sort.html',response('offline copy'));
  const res=await h.event('fetch',navigation('water-sort.html?v=40'));
  assert.equal(res.body,'offline copy');
});
test('cache write failures do not replace a successful online response with old content',async()=>{
  const h=setup({writeFails:true});h.entries.set(base+'water-sort.html',response('old'));
  assert.equal((await h.event('fetch',navigation('water-sort.html'))).body,'fresh');
});
test('static assets keep working offline',async()=>{
  const h=setup({offline:true});h.entries.set(base+'shell.css',response('styles'));
  assert.equal((await h.event('fetch',{url:base+'shell.css',method:'GET',mode:'cors'})).body,'styles');
});
test('installation bypasses HTTP cache and activation only removes older game caches',async()=>{
  const h=setup();await h.event('install');await h.event('activate');
  assert.ok(h.installed.length>5 && h.installed.every(r=>r.cache==='reload'));
  assert.deepEqual(h.removed,['games-v1']);
});
