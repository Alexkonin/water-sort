/* Small, still scenes. Shared game renderers keep the collection faithful to play.
   No animation loop, game state, input handlers or random layout in the menu. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = content => `<svg xmlns="${NS}" viewBox="0 0 360 220" aria-hidden="true" focusable="false">${content}</svg>`;
  const ellipse = (x,y,rx,ry,fill) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;

  function water(host){
    const colors = ['#d95360','#78d9bc','#e8c65a','#7950ad'];
    let art = '<defs><linearGradient id="menu-glass"><stop stop-color="#000" stop-opacity=".22"/><stop offset=".33" stop-color="#fff" stop-opacity=".25"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>';
    [[77,36,-9,[0,2,1,3]],[157,23,0,[2,3,0,1]],[237,36,9,[1,0,3,2]]].forEach(([x,y,angle,layers],i) => {
      art += `<g transform="translate(${x} ${y}) rotate(${angle} 23 80)">${ellipse(24,169,32,7,'#061b1940')}<defs><clipPath id="menu-tube-${i}"><path d="M3 18H43V141A20 20 0 0 1 3 141Z"/></clipPath></defs><path d="M0 3Q23 -2 46 3V141A23 23 0 0 1 0 141Z" fill="#ffffff12" stroke="#d9f6ed" stroke-opacity=".55" stroke-width="2.5"/><g clip-path="url(#menu-tube-${i})">`;
      layers.forEach((c,j) => { art += `<rect x="3" y="${37+j*31}" width="40" height="32" fill="${colors[c]}"/>`; });
      art += `<rect x="3" y="37" width="40" height="127" fill="url(#menu-glass)"/>${ellipse(23,37,20,3,'#ffffff60')}</g><path d="M-2 10H48M8 47V130" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/></g>`;
    });
    host.innerHTML = svg(art);
  }

  function towers(host){
    const canvas = document.createElement('canvas');
    canvas.width = 720; canvas.height = 440; host.append(canvas);
    const c = canvas.getContext('2d'); if (!c) return;
    c.scale(2,2);
    c.fillStyle='#8caa69';c.beginPath();c.ellipse(183,139,166,72,-.1,0,Math.PI*2);c.fill();
    c.strokeStyle='#c8bc89';c.lineWidth=43;c.lineCap='round';c.beginPath();c.moveTo(365,130);c.bezierCurveTo(228,70,192,215,70,164);c.stroke();
    c.strokeStyle='#d9cda0';c.lineWidth=30;c.stroke();
    for(let i=0;i<28;i++){
      const x=30+(i*79)%302,y=58+(i*43)%127;
      c.fillStyle=i%2?'#d8dea15c':'#52774f55';c.beginPath();c.ellipse(x,y,3,1.5,-.4,0,Math.PI*2);c.fill();
    }
    c.save();c.translate(111,99);StorybookGun.body(c,175,2);StorybookGun.live(c,175,{lvl:2,aim:.26,flash:0});c.restore();
    Ugolek.draw(c,{x:264,y:146,size:105,heading:-2.6,state:'walk',distance:.2,time:1,seed:1});
    c.fillStyle='#fae5a7';c.beginPath();c.arc(207,125,4,0,Math.PI*2);c.fill();
  }

  function trucks(host){
    let art = '<path d="M28 168H332" stroke="#618478" stroke-width="2" stroke-dasharray="6 7"/>';
    const tones=['#28bfc5','#f5b544','#f4df68','#cd6656'];
    // A ragged mosaic edge and individual falling grains show the sand mechanic.
    for(let x=0;x<36;x++)for(let y=0;y<10;y++){
      if(y>7 && (x<12 || x>23 || y>7+(x%3)))continue;
      const color=tones[y<3?0:y<6?2:1];
      art+=`<rect x="${36+x*8}" y="${10+y*7}" width="8.2" height="7.2" fill="${color}" opacity="${.78+((x*7+y*3)%5)*.05}"/>`;
    }
    for(let i=0;i<53;i++)art+=`<rect x="${151+(i*17)%58}" y="${80+(i*13)%50}" width="${2+i%3}" height="3" rx=".5" fill="${i%3?'#f5b544':'#ffe59d'}"/>`;
    host.innerHTML = svg(art);
    // The active truck is gold, matching the falling sand.
    const active = SandTruckArt.create({id:2,color:0,cells:[0,1,2]},28);
    SandTruckArt.update(active,0,.7);
    active.setAttribute('transform','translate(190 158) rotate(90) scale(1.95)');
    host.firstChild.append(active);
  }

  function lights(host){
    const tones=['#eacb68','#df8b7c','#87c6b3','#9da4d4','#eacb68','#87c6b3','#df8b7c'];
    let art='<defs>';
    tones.forEach((tone,i)=>{art+=`<radialGradient id="menu-orb-${i}" cx="30%" cy="22%" r="95%"><stop stop-color="#fff9dc"/><stop offset=".44" stop-color="${tone}"/><stop offset="1" stop-color="#244c43"/></radialGradient>`;});
    art+='</defs><circle cx="180" cy="110" r="76" fill="none" stroke="#bfd0a310" stroke-width="26"/><circle cx="180" cy="110" r="76" fill="none" stroke="#bfd0a34d" stroke-width="2"/><path d="M125 162A76 76 0 0 0 235 162" fill="none" stroke="#ead184" stroke-width="3"/>';
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4-Math.PI/2,x=180+Math.cos(a)*76,y=110+Math.sin(a)*76;
      art+=`<circle cx="${x}" cy="${y}" r="20" fill="none" stroke="${tones[i%7]}" opacity=".45"/>`;
      if(i===3)continue;
      const k=i>3?i-1:i;
      art+=`<circle cx="${x}" cy="${y+3}" r="15" fill="#061b1966"/><circle cx="${x}" cy="${y}" r="16" fill="url(#menu-orb-${k})" stroke="#fff6"/>`;
    }
    art+='<path d="M178 127V100Q159 106 156 86Q179 84 178 106Q179 86 201 87Q200 109 181 108" fill="#bfd0a3"/>';
    host.innerHTML=svg(art);
  }

  function mahjong(host){
    let art='';
    [[90,53,-17,0],[214,46,15,16],[151,24,-3,0]].forEach(([x,y,angle,type])=>{
      art+=`<g transform="translate(${x} ${y}) rotate(${angle} 39 59)"><rect x="-1" y="8" width="80" height="119" rx="11" fill="#122f2840"/><rect y="5" width="78" height="118" rx="10" fill="#779777"/><rect width="78" height="118" rx="10" fill="#f8f3e0" stroke="#c9c5a7" stroke-width="1.5"/><path d="M9 3H67" stroke="#fffdf0" stroke-width="3" stroke-linecap="round"/><g transform="translate(7 7) scale(1.32 1.48)">${MahjongArt.face(type).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></g>`;
    });
    host.innerHTML=svg(art);
  }

  function memory(host){
    const symbols=['leaf','acorn','moon','mushroom','fox','flower','butterfly','sun','pinecone'];
    let art='<defs><pattern id="menu-card-back" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#e9eedf"/><path d="M0 0V9" stroke="#ccd9bc" stroke-width="3"/></pattern></defs><g transform="translate(211 37) rotate(13 44 70)"><rect width="89" height="144" rx="13" fill="#b0bc9a"/><rect x="0" y="-4" width="89" height="144" rx="13" fill="#f3efdd"/><rect x="8" y="4" width="73" height="128" rx="8" fill="url(#menu-card-back)" stroke="#adb99b"/><text x="44" y="80" text-anchor="middle" fill="#809767" font-size="32">✦</text></g><g transform="translate(65 22) rotate(-8 75 85)"><rect y="5" width="155" height="172" rx="15" fill="#344e3730"/><rect width="155" height="172" rx="15" fill="#f3efdd" stroke="#aeba97"/><text x="77" y="18" text-anchor="middle" font-size="12" fill="#aa9568">✦</text>';
    symbols.forEach((symbol,i)=>{
      const x=12+(i%3)*45,y=27+Math.floor(i/3)*45;
      art+=`<rect x="${x}" y="${y}" width="41" height="41" rx="7" fill="#fffcf0" stroke="#adb99b"/><image x="${x+3}" y="${y+3}" width="35" height="35" href="memory-art/v1/${symbol}.png" style="mix-blend-mode:darken"/>`;
    });
    host.innerHTML=svg(art+'</g>');
  }
  const scenes={castle:towers,flask:water,truck:trucks,lights,mahjong,memory};
  globalThis.MenuArt={render(host,key){if(scenes[key])scenes[key](host);}};
})();
