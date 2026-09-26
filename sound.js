/* Общий звуковой набор. Без загрузок и фоновой музыки: мягкие синусные тембры,
   фильтрованный шум, короткие огибающие и ограниченная плотность боя. */
(() => {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const LIMIT = 64;

  function create({ enabled = () => true, context = null, random = Math.random } = {}){
    let ac = context, output = null, input = null, noise = null;
    const voices = new Set(), last = new Map(), flows = [], shots = [];
    let shotStart = -Infinity;
    const doc = typeof document === 'undefined' ? null : document;
    let hideTimer = null;

    function init(){
      if (!enabled() || (doc && doc.hidden && !context)) return null;
      if (!ac){
        const C = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!C) return null;
        try { ac = new C(); } catch { return null; }
      }
      if (!output){
        input = ac.createGain();
        const low = ac.createBiquadFilter(), high = ac.createBiquadFilter();
        high.type = 'highpass'; high.frequency.value = 45;
        low.type = 'lowpass'; low.frequency.value = 4200; low.Q.value = .5;
        const compressor = ac.createDynamicsCompressor();
        compressor.threshold.value = -20; compressor.knee.value = 18;
        compressor.ratio.value = 5; compressor.attack.value = .004; compressor.release.value = .18;
        output = ac.createGain(); output.gain.value = .72;
        input.connect(high); high.connect(low); low.connect(compressor);
        compressor.connect(output); output.connect(ac.destination);
        // Один тихий ранний отзвук смягчает сухие ноты, не размывая быстрые действия.
        const delay = ac.createDelay(.1), wet = ac.createGain(), damp = ac.createBiquadFilter();
        delay.delayTime.value = .055; wet.gain.value = .065;
        damp.type = 'lowpass'; damp.frequency.value = 1800;
        input.connect(delay); delay.connect(damp); damp.connect(wet); wet.connect(high);
        noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const data = noise.getChannelData(0);
        let smooth = 0;
        for (let i = 0; i < data.length; i++){
          smooth = smooth * .72 + (random() * 2 - 1) * .28;
          data[i] = smooth;
        }
      }
      if (!context && (ac.state === 'suspended' || ac.state === 'interrupted')) ac.resume().catch(() => {});
      return ac;
    }

    function ramp(param, value, duration = .025){
      const now = ac.currentTime;
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
      else { const valueNow = param.value; param.cancelScheduledValues(now); param.setValueAtTime(valueNow, now); }
      param.linearRampToValueAtTime(value, now + duration);
    }
    function stop(){
      last.clear(); flows.length = 0; shots.length = 0; shotStart = -Infinity;
      if (!ac) return;
      for (const v of voices){
        ramp(v.gain.gain, 0, .02);
        try { v.source.stop(ac.currentTime + .022); } catch { /* источник уже закончился */ }
      }
    }
    function sync(){
      if (!enabled()){
        stop();
        if (output) ramp(output.gain, 0);
      } else if (init()) ramp(output.gain, .72);
    }

    function source(source, t, duration, volume, attack, filter = null, sustain = 0){
      if (voices.size >= LIMIT) return false;
      const gain = ac.createGain();
      const end = t + duration;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + attack);
      if (sustain) gain.gain.setValueAtTime(volume * .82, t + duration * sustain);
      gain.gain.exponentialRampToValueAtTime(.0001, end);
      gain.gain.linearRampToValueAtTime(0, end + .012);
      if (filter){ source.connect(filter); filter.connect(gain); } else source.connect(gain);
      gain.connect(input);
      const v = {source, gain, filter}; voices.add(v);
      source.onended = () => {
        source.disconnect(); gain.disconnect(); if (filter) filter.disconnect();
        voices.delete(v);
      };
      source.start(t); source.stop(end + .015);
      return true;
    }
    function note(t, frequency, duration, volume, to = frequency, attack = .008){
      if (voices.size >= LIMIT) return;
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + duration);
      source(osc, t, duration, volume, attack);
    }
    function hush(t, duration, volume, frequency, to = frequency, sustained = false){
      if (voices.size >= LIMIT) return;
      const src = ac.createBufferSource(); src.buffer = noise; src.loop = true;
      const filter = ac.createBiquadFilter(); filter.type = 'bandpass'; filter.Q.value = .7;
      filter.frequency.setValueAtTime(frequency, t);
      filter.frequency.linearRampToValueAtTime(to, t + duration);
      source(src, t, duration, volume, sustained ? .06 : .009, filter, sustained ? .65 : 0);
    }
    function mallet(t, frequency, volume = .07, duration = .23){
      note(t, frequency, duration, volume, frequency * .997);
      note(t, frequency * 2.01, duration * .4, volume * .12);
    }
    function allow(key, t, spacing){
      if (t - (last.get(key) ?? -Infinity) < spacing) return false;
      last.set(key, t); return true;
    }

    // Одновременные разные башни слышны вместе. Бюджет учитывает только
    // принятые выстрелы: отклонённый звук не закрывает следующему его очередь.
    function shotTime(kind, t){
      if (t - (last.get('shot:' + kind) ?? -Infinity) < .18) return null;
      while (shots.length && shots[0] <= t - .28) shots.shift();
      if (shots.length >= 4) return null;
      last.set('shot:' + kind, t); shots.push(t);
      shotStart = Math.max(t, shotStart + .018);
      return shotStart;
    }
    function creature(t, voice, event, variation){
      if (!voice) return false;
      const boss = voice === 'guardian';
      const spacing = event === 'appear' ? 6 : 1.1;
      const key = 'creature:' + event + ':' + voice;
      if (t - (last.get(key) ?? -Infinity) < spacing) return false;
      if (!boss && t - (last.get('creatures') ?? -Infinity) < .65) return false;
      last.set(key, t); last.set('creatures', t);
      const gain = event === 'death' ? .6 : .9;
      const pitch = variation * (event === 'death' ? .82 : 1);
      const n = (offset, f, duration, volume, to = f) => note(t + offset, f * pitch, duration, volume * gain, to * pitch, .012);
      const air = (duration, volume, from, to) => hush(t, duration, volume * gain, from, to);
      switch (voice){
        case 'ember': // Уголёк — короткое сиплое ворчание.
          n(0, 185, .18, .055, 115); n(.045, 260, .13, .018, 180); air(.16,.075,520,280); break;
        case 'leaf': // Вихрёк — шорох и быстрый восходящий посвист.
          air(.22,.095,1500,800); n(.015,390,.09,.032,640); n(.11,510,.09,.023,350); break;
        case 'stone': // Камнеспин — два низких каменных удара.
          n(0,105,.19,.08,65); n(.075,160,.14,.04,95); air(.2,.16,460,170); break;
        case 'mist': // Туманник — длинный воздушный вздох.
          air(.44,.10,1100,430); n(.045,470,.36,.026,285); n(.07,690,.3,.008,420); break;
        case 'wood': // Древень — деревянный скрип с полым низким резонансом.
          n(0,125,.32,.065,85); n(.065,210,.25,.025,145); air(.3,.11,670,260); break;
        case 'spores': // Дождевик — мягкое лопанье пузырьков.
          for (let i=0;i<3;i++) n(i*.065,340+i*75,.085,.045-i*.009,110+i*35);
          air(.16,.055,700,350); break;
        case 'lantern': // Фонарник — негромкое стеклянное позвякивание.
          n(0,660,.3,.033,650); n(.085,990,.24,.018,975); break;
        case 'dew': // Росник — две округлые водяные капли.
          n(0,620,.11,.045,270); n(.13,460,.13,.035,190); break;
        case 'drum': // Гулень — короткий ритм полого барабана.
          n(0,140,.14,.065,85); n(.12,180,.12,.04,100); n(.23,125,.2,.05,70); break;
        case 'guardian': // Хранитель — низкий, тихий двухголосый гул.
          n(0,90,.58,.075,65); n(.045,180,.51,.025,130); n(.13,265,.35,.013,170); air(.48,.12,380,160); break;
        default: return false;
      }
      return true;
    }

    function play(name, options = {}){
      if (!init()) return false;
      // delay нужен только для коротких последовательностей и прослушивания набора.
      const t = ac.currentTime + .006 + clamp(Number(options.delay) || 0, 0, 30);
      if (voices.size >= LIMIT) return false;
      const gaps = {tap:.045,nope:.2,build:.08,sell:.09,plop:.08,complete:.16,unlock:.24,
                    kill:.22,boom:.24,leak:.32,wave:.5,win:1,lose:1};
      if (name !== 'flow' && name !== 'shot' && name !== 'creature' && !allow(name, t, gaps[name] || .1)) return false;
      const variation = .97 + random() * .06;
      switch (name){
        case 'tap':
          mallet(t, 540 * variation, .055, .075); break;
        case 'nope':
          note(t, 190, .13, .07, 150, .014); hush(t, .06, .035, 360); break;
        case 'build':
          mallet(t, 369.99, .075, .18); mallet(t + .075, 554.37, .06, .25); break;
        case 'sell':
          mallet(t, 440, .06, .14); mallet(t + .07, 293.66, .05, .19); break;
        case 'wave':
          mallet(t, 293.66, .075, .28); mallet(t + .12, 440, .06, .35); break;
        case 'win':
          // Ре-мажор: атаки разнесены, последний аккорд звучит тихим хвостом.
          [293.66,369.99,440,587.33].forEach((f,i) => mallet(t + i * .115, f, .075 - i * .007, .45));
          note(t + .36, 293.66, .8, .025, 293.66, .07); break;
        case 'lose':
          mallet(t, 293.66, .065, .32); mallet(t + .16, 246.94, .05, .45);
          note(t + .3, 196, .5, .035, 196, .035); break;
        case 'complete':
          mallet(t, 440, .065, .28); mallet(t + .095, 587.33, .05, .4); break;
        case 'unlock':
          hush(t, .075, .08, 850, 480);
          mallet(t + .045, 369.99, .06, .22); mallet(t + .135, 493.88, .045, .3); break;
        case 'plop':
          note(t, 430 * variation, .09, .045, 180, .009); break;
        case 'flow': {
          // Не больше двух струй в миксе даже при нескольких параллельных переливах.
          while (flows.length && flows[0] <= t) flows.shift();
          if (flows.length >= 2) return false;
          const duration = clamp(Number(options.duration) || .6, .16, 3);
          flows.push(t + duration); flows.sort((a,b) => a-b);
          hush(t, duration, .095 / Math.sqrt(flows.length), 520, 920, true);
          // Негромкие нерегулярные пузырьки, без высокого свиста и белого шипения.
          for (let at = .025; at < duration - .055; at += .105 + random() * .08){
            const freq = (340 + random() * 220) * (1 + at / duration * .15);
            note(t + at, freq, .045 + random() * .025, .013 / Math.sqrt(flows.length), freq * .67, .006);
          }
          break;
        }
        case 'shot': {
          const kind = options.kind || 'shot', at = shotTime(kind, t);
          if (at === null) return false;
          // Старшие разряды немного ниже и плотнее, но сохраняют тембр оружия.
          const tier = clamp(Number(options.tier) || 1, 1, 5);
          const pitch = variation * (1 - (tier - 1) * .025);
          if (kind === 'splash'){
            // Мортира: глубокий пуск и короткий выдох; взрыв звучит при попадании.
            note(at, 118 * pitch, .23, .10, 48, .012);
            hush(at, .15, .16, 430, 150);
            note(at + .035, 210 * pitch, .12, .021, 105);
          } else if (kind === 'chain'){
            // Молния: три раздельных электрических импульса вместо писка.
            for (let i=0;i<3;i++){
              const dt = i * .032;
              note(at + dt, (780-i*95)*pitch, .036, .032-i*.006, 300+i*50, .004);
              hush(at + dt, .025, .10-i*.02, 1700, 750);
            }
          } else if (kind === 'frost'){
            // Мороз: прозрачный ледяной звон и длинный мягкий шелест.
            note(at, 1046 * pitch, .24, .029, 1018, .012);
            note(at + .028, 1568 * pitch, .16, .011, 1520, .014);
            hush(at, .22, .085, 1850, 850);
          } else if (kind === 'arrow' || kind === 'ballista'){
            const heavy = kind === 'ballista', f = heavy ? 155 : 270;
            note(at, f, heavy ? .17 : .105, .045, f * .76);
            note(at, f * 2.03, .045, .015);
            hush(at, heavy ? .14 : .09, .09, 1400, 580);
          } else {
            // Пушка: сухой удар, короткий хлопок и тихий щелчок затвора.
            note(at, 210 * pitch, .105, .085, 78);
            hush(at, .042, .19, 1050, 400);
            note(at + .045, 720 * pitch, .028, .015, 460, .004);
          }
          break;
        }
        case 'creature':
          return creature(t, options.voice, options.event || 'appear', variation);
        case 'kill':
          if (options.voice) return creature(t, options.voice, 'death', variation);
          hush(t, .055, .04, 660, 360); break;
        case 'boom':
          note(t, 105 * variation, .28, .11, 48, .012); hush(t, .26, .18, 310, 120); break;
        case 'leak':
          note(t, 145, .19, .08, 90, .012); hush(t, .13, .12, 420, 210); break;
        default: return false;
      }
      return true;
    }

    if (doc && !context){
      // Разблокировка прямо из жеста: звук струи запускается позднее из анимации.
      doc.addEventListener('pointerdown', init, {capture:true, passive:true});
      doc.addEventListener('keydown', init, {capture:true, passive:true});
      doc.addEventListener('visibilitychange', () => {
        clearTimeout(hideTimer);
        if (doc.hidden){
          stop();
          if (output) ramp(output.gain, 0);
          hideTimer = setTimeout(() => {
            if (doc.hidden && ac && ac.state === 'running') ac.suspend().catch(() => {});
          }, 40);
        } else if (output && enabled()) ramp(output.gain, .72);
      });
      globalThis.addEventListener('pagehide', stop);
    }
    return {play, stop, sync, unlock:init};
  }
  globalThis.GameAudio = {create};
})();
