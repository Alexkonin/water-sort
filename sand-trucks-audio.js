/* Real sand falling between fingers (SoundDino). One stream follows pickups. */
(function(root){
  'use strict';
  function create({enabled=()=>true,url='audio/sand-trucks/sand-through-fingers-v1.mp3'}={}){
    let context=null,buffer=null,voice=null,loading=null,tail=0,idle=0,audible=false;
    const file=fetch(url).then(r=>{if(!r.ok)throw new Error('Sand audio unavailable');return r.arrayBuffer();}).catch(()=>null);
    function unlock(){
      if(!enabled()||document.hidden)return;
      if(!context){const C=root.AudioContext||root.webkitAudioContext;if(!C)return;try{context=new C();}catch{return;}}
      if(context.state==='suspended'||context.state==='interrupted')context.resume().catch(()=>{});
      if(!loading)loading=file.then(async bytes=>{
        if(!bytes)return;const decoded=await context.decodeAudioData(bytes);
        // Keep the steady middle; crossfade the seam instead of replaying the attack.
        const rate=decoded.sampleRate,first=Math.floor(.02*rate),end=Math.min(decoded.length,Math.floor(2.30*rate)),fade=Math.floor(.04*rate),length=end-first-fade;
        if(length<=fade)return;
        buffer=context.createBuffer(decoded.numberOfChannels,length,rate);
        for(let c=0;c<decoded.numberOfChannels;c++){
          const source=decoded.getChannelData(c),out=buffer.getChannelData(c);out.set(source.subarray(first,first+length));
          for(let i=0;i<fade;i++){const t=i/fade;out[i]=source[first+length+i]*(1-t)+source[first+i]*t;}
        }
      }).catch(()=>{});
    }
    function ramp(value,seconds){
      if(!voice)return;const param=voice.gain.gain,now=context.currentTime;
      if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);
      else{const held=param.value;param.cancelScheduledValues(now);param.setValueAtTime(held,now);}
      param.linearRampToValueAtTime(value,now+seconds);
    }
    function start(){
      if(voice||!buffer||!context||context.state!=='running')return;
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(context.destination);
      const v={source,gain};voice=v;source.onended=()=>{source.disconnect();gain.disconnect();if(voice===v)voice=null;};source.start();
    }
    function stop(){
      tail=0;idle=0;audible=false;if(!voice)return;ramp(0,.025);const old=voice;voice=null;try{old.source.stop(context.currentTime+.03);}catch{}
    }
    function step(pickups,dt){
      if(!enabled()||document.hidden){stop();return;}
      if(pickups>0){tail=.16;idle=0;}else{tail=Math.max(0,tail-dt);idle+=dt;}
      if(tail>0){start();if(voice&&!audible){audible=true;ramp(.4,.06);}}
      else if(audible){audible=false;ramp(0,.22);}
      if(voice&&idle>.7)stop();
    }
    document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(context)context.suspend().catch(()=>{});}else unlock();});root.addEventListener('pagehide',stop);
    return{step,stop,unlock};
  }
  root.SandTruckAudio={create};
})(globalThis);
