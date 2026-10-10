/* Reauthor levels 4–100 without moving a single parked truck. Write only after
   every revised picture has a winning certificate in the actual physics. */
const fs=require('node:fs'),path=require('node:path');
const {picture}=require('./sand-picture-art.cjs'),{refine}=require('./refine-sand-intro.cjs');
function build(level,index){const art=picture(index+1,level.rows[0].length,level.rows.length);return refine(level,index,art.rows);}
if(require.main===module){
 const file=path.join(__dirname,'../sand-trucks-levels.js'),levels=require(file),start=Date.now();
 const updated=levels.map((level,index)=>{
  if(index<3)return level;
  const result=build(level,index);console.log(index+1,result.title,Math.round((Date.now()-start)/1000)+'s');return result;
 });
 if(new Set(updated.map(p=>p.rows.join(''))).size!==100)throw Error('Duplicate picture');
 fs.writeFileSync(file,'/* 100 pictures and parking lots; generated release orders replay the actual sand physics. */\n(function(root){\n  const levels='+JSON.stringify(updated)+';\n  if(typeof module!=="undefined"&&module.exports)module.exports=levels;else root.SandTruckLevels=levels;\n})(globalThis);\n');
}
module.exports={build};
