(() => {
'use strict';
const D=ArsenalCurrent.GunDesign;
const styles=[{id:'fortress',name:'Крепостная',text:'Каменная опора, спокойный зелёный металл. Крупные формы в стиле классической игры.',note:'Крепостная · утверждена · подключена локально'},{id:'woodland',name:'Лесная мастерская',text:'Деревянный настил, железные скобы и округлый механизм. Тёплый ремесленный характер.',note:'Лесная мастерская · вариант для сравнения'},{id:'precise',name:'Лаконичная механическая',text:'Шестигранная опора, холодный металл и мятные акценты. Строгие угловатые формы.',note:'Лаконичная механическая · вариант для сравнения'}];
const descriptions=['Маленький круглый корпус и тонкий ствол.','Широкая муфта, толстый ствол и вытянутый корпус.','Две открытые боковые опоры; широкий силуэт.','Опоры объединены в сплошной бронекорпус.','Выступающие плечи и светлый край. Максимальный уровень.'];
const roman=['I','II','III','IV','V'];
document.querySelector('#styles').innerHTML=styles.map(o=>`<article class="choice ${o.id==='fortress'?'active':''}" data-style-card="${o.id}"><canvas data-style="${o.id}" data-rank="1" role="img" aria-label="${o.name}: Пушка первого уровня"></canvas><h3>${o.name}</h3><p>${o.text}</p><button data-choose="${o.id}" aria-pressed="${o.id==='fortress'}">Показать пять уровней</button></article>`).join('');
document.querySelector('#ranks').innerHTML=D.names.map((name,j)=>`<article class="rank"><span class="label">${roman[j]} / ${j===4?'Максимум':'Уровень '+(j+1)}</span><canvas data-rank="${j+1}" role="img" aria-label="${name}, уровень ${j+1}"></canvas><b>${name}</b><p>${descriptions[j]}</p></article>`).join('');
document.querySelector('#field').innerHTML=D.names.map((name,j)=>`<figure><canvas data-rank="${j+1}" data-size="40" role="img" aria-label="${name} в игровом размере"></canvas><figcaption>${roman[j]}</figcaption></figure>`).join('');
let style='fortress',aim=-40*Math.PI/180,spin=false,silhouette=false,shotAt=-10000;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function select(id){style=id;document.querySelector('#style-note').textContent=styles.find(o=>o.id===id).note;for(const b of document.querySelectorAll('[data-choose]'))b.setAttribute('aria-pressed',String(b.dataset.choose===id));for(const card of document.querySelectorAll('[data-style-card]'))card.classList.toggle('active',card.dataset.styleCard===id);}
select(style);
for(const b of document.querySelectorAll('[data-choose]'))b.onclick=()=>select(b.dataset.choose);
document.querySelector('#direction').oninput=e=>{aim=+e.target.value*Math.PI/180;spin=false;document.querySelector('#spin').checked=false;};
document.querySelector('#spin').onchange=e=>{spin=e.target.checked};
document.querySelector('#silhouette').onchange=e=>{silhouette=e.target.checked};
document.querySelector('#fire').onclick=()=>{shotAt=performance.now()};
const canvases=[...document.querySelectorAll('canvas')];let last=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden||now-last<32)return;const dt=Math.min((now-last)/1000,.1);last=now;if(spin&&!reduced.matches)aim+=dt*.6;for(const el of canvases){const w=el.clientWidth,h=el.clientHeight,d=Math.min(devicePixelRatio||1,2);if(el.width!==Math.round(w*d)||el.height!==Math.round(h*d)){el.width=Math.round(w*d);el.height=Math.round(h*d);}const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);c.translate(w/2,h/2);const s=el.dataset.size?+el.dataset.size:Math.min(w,h)*1.04;const age=(now-shotAt)/1000,flash=reduced.matches?0:Math.max(0,.07-age),recoil=reduced.matches?0:Math.max(0,1-age/.22);if(!silhouette)D.body(c,s,+el.dataset.rank,el.dataset.style||style);D.live(c,s,{lvl:+el.dataset.rank,aim,flash,recoil},el.dataset.style||style,silhouette);}}
requestAnimationFrame(frame);
})();
