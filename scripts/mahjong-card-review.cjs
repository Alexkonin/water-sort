// Generate isolated before/after evidence for one card; never changes game art.
const fs=require('node:fs'),path=require('node:path');
const [mode,folder,idText,title,pass='1']=process.argv.slice(2),id=Number(idText);
const dir=path.resolve('output/mahjong-card-by-card',folder);fs.mkdirSync(dir,{recursive:true});
if(mode==='begin'){
 fs.writeFileSync(path.join(dir,'before.cjs'),fs.readFileSync('mahjong-art.js','utf8').replace("require('./mahjong-glyphs.js')","require('../../../mahjong-glyphs.js')"));
}else{
 const a=require('../mahjong-art'),b=require(path.join(dir,'before.cjs'));
 const changed=Array.from({length:42},(_,i)=>i).filter(i=>a.face(i)!==b.face(i));
 if(changed.some(i=>i!==id))throw Error('Other cards changed: '+changed);
 const tile=(s,w)=>`<div class="tile" style="width:${w}px;height:${w*68/48}px">${s}</div>`;
 const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../../../mahjong.css"><style>body{padding:32px;background:#193c34;color:#f5efdc;font-family:system-ui}.row{display:flex;gap:32px;align-items:end}.tile{position:relative}h1{font-size:24px}p{color:#bfccba}</style><h1>${title}</h1><p>Было → правка ${pass} → игровой размер</p><div class="row">${tile(b.face(id),160)}${tile(a.face(id),160)}${tile(a.face(id),32)}</div>`;
 fs.writeFileSync(path.join(dir,'preview.html'),html);fs.writeFileSync(path.join(dir,`pass-${pass}.svg`),a.face(id));
 console.log(JSON.stringify({id,changed,folder,pass}));
}
