const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('all playable pages have no sound control and their scripts parse',()=>{
  for(const file of ['water-sort.html','tower-defense.html','tower-diorama.html','forest-lights.html','memory-cards.html','mahjong.html','sand-trucks.html']){
    const html=read(file);
    assert.doesNotMatch(html,/GameAudio|SandTruckAudio|sound\.js|AudioContext|new Audio\(/,file);
    assert.doesNotMatch(html,/btnSound|soundButton|id="sound"|Включить звук|Выключить звук/,file);
    for(const [,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script,{filename:file});
  }
  assert.doesNotMatch(read('sand-trucks.html'),/sand-trucks-audio\.js/);
  assert.doesNotMatch(read('sw.js'),/sound\.js|\.(mp3|wav|ogg)/);
  assert.equal(fs.existsSync(path.join(__dirname,'../sound.js')),false);
  assert.equal(fs.existsSync(path.join(__dirname,'../sand-trucks-audio.js')),false);
  for(const file of ['mahjong-ui.js','sand-trucks-ui.js','tower-diorama-renderer.js']){assert.doesNotMatch(read(file),/GameAudio|SandTruckAudio|refreshSoundButton/);new vm.Script(read(file));}
});
test('old enabled settings restore as disabled without losing the chosen level',()=>{
  for(const [file,global] of [['memory-cards.js','MemoryCards'],['mahjong.js','Mahjong'],['arrow-escape.js','ArrowEscape']]){
    const context=vm.createContext({});vm.runInContext(read(file),context);
    const game=context[global];
    const state=game.restore({version:game.VERSION,level:3,sound:true});
    assert.equal(state.sound,false,file);assert.equal(state.level,3,file);
  }
});
test('sand trucks ignore enabled legacy settings on create, save and restore',()=>{
  const game=require('../sand-trucks.js');
  const state=game.create(3,true,[1,2]);
  assert.equal(state.sound,false);
  state.sound=true;
  const saved=game.snapshot(state);assert.equal(saved.sound,false);
  const restored=game.restore({...saved,sound:true});
  assert.equal(restored.sound,false);assert.equal(restored.puzzle.level,3);
  assert.deepEqual(restored.completed,[1,2]);
});
