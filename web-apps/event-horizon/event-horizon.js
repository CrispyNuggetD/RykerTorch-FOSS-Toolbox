// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Christopher Nah
(()=>{
  const parse=value=>{if(value===null||value===undefined||value==='')return NaN;const n=Number(value);return Number.isFinite(n)?(Math.abs(n)<1e12?n*1000:n):Date.parse(value);};
  const instances=new WeakMap();
  function mount(root,options={}){
    if(instances.has(root))return instances.get(root);root.dataset.ehMounted='true';
    const person=root.querySelector('.eh-person'),status=root.querySelector('.eh-status');
    if(!person||!status||!window.IntersectionObserver||!window.ResizeObserver)return;
    const variables=getComputedStyle(root);
    let deadline=parse(options.deadline??root.dataset.deadline??variables.getPropertyValue('--event-horizon-deadline').trim()),start=parse(options.start??root.dataset.start),observed=parse(options.observedAt??root.dataset.observedAt);
    function identity(data){
      const requested=data.gender??root.dataset.gender;const gender=['neutral','male','female'].includes(requested)?requested:'neutral';root.dataset.gender=gender;
      const badge=person.querySelector('.eh-gender-badge');if(badge)badge.textContent=gender==='male'?'♂':gender==='female'?'♀':'✦';
      const login=data.login??root.dataset.login;if(typeof login==='string'&&/^[A-Za-z0-9_.-]{1,32}$/.test(login)){root.dataset.login=login;person.dataset.label=login+' ↗';person.setAttribute('aria-label',login+': '+gender+' student astronaut, open Intra profile');}
      if(typeof data.profileUrl==='string'){try{const url=new URL(data.profileUrl,location.href);if(url.protocol==='https:'&&!url.username&&!url.password)person.href=url.href;}catch{}}
    }
    identity({gender:options.gender??root.dataset.gender,login:options.login??root.dataset.login,profileUrl:options.profileUrl??root.dataset.profileUrl});
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),contrast=matchMedia('(forced-colors: active)');
    const key=root.dataset.storageKey||'foss-toolbox.event-horizon.motion';let motion=true;
    try{motion=localStorage.getItem(key)!=='off';}catch{}
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
    const ctx=canvas.getContext('2d');if(!ctx)return;root.classList.add('enhanced');
    const button=document.createElement('button');button.type='button';root.querySelector('.eh-controls')?.append(button);
    let frame=0,lastPaint=0,lastText=0,visible=true,width=1,height=1,phase=0,mouse={x:0,y:0},target={x:0,y:0};
    const stars=Array.from({length:85},(_,i)=>({x:((i*73+19)%997)/997,y:((i*137+47)%991)/991,r:.5+(i%3)*.35}));
    function animate(){return motion&&!reduced.matches&&!contrast.matches&&visible&&!document.hidden;}
    function controls(){button.disabled=reduced.matches||contrast.matches;button.textContent='Motion: '+(button.disabled?'System default':motion?'On':'Off');button.setAttribute('aria-pressed',String(motion&&!button.disabled));}
    function stop(){if(frame)cancelAnimationFrame(frame);frame=0;lastPaint=0;}
    function schedule(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
    function resize(){const box=root.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);schedule();}
    function draw(now){
      frame=0;if(!visible||document.hidden)return;
      const moving=animate();if(moving&&lastPaint&&now-lastPaint<32){schedule();return;}
      const dt=lastPaint?Math.min(70,now-lastPaint):32;lastPaint=now;if(moving)phase+=dt*.00012;
      mouse.x+=(target.x-mouse.x)*.12;mouse.y+=(target.y-mouse.y)*.12;
      if(!moving){mouse={x:0,y:0};person.style.setProperty('--eh-eye-x','0px');person.style.setProperty('--eh-eye-y','0px');}
      const epoch=Date.now();const valid=Number.isFinite(deadline);const windowStart=Number.isFinite(start)&&start<deadline?start:deadline-90*86400000;
      const progress=valid?Math.max(0,Math.min(1,(epoch-windowStart)/(deadline-windowStart))):.35;
      const hx=width*.70,hy=height*(width<520?.68:.51),radius=Math.min(width*.115,55);
      ctx.clearRect(0,0,width,height);
      for(const s of stars){const x=s.x*width+mouse.x*(s.r*4),y=s.y*height+mouse.y*(s.r*3);ctx.fillStyle=`rgba(208,234,246,${.25+s.r*.22})`;ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();}
      const glow=ctx.createRadialGradient(hx,hy,radius*.7,hx,hy,radius*2.6);glow.addColorStop(0,'#91c9c94d');glow.addColorStop(.5,'#4d8c9b22');glow.addColorStop(1,'#4d8c9b00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(hx,hy,radius*2.6,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(hx,hy);ctx.rotate(-.34);
      for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(168,230,207,${.12+i*.11})`;ctx.lineWidth=1+i*.8;ctx.beginPath();ctx.ellipse(0,0,radius*(1.7+i*.18),radius*(.38+i*.07),0,0,Math.PI*2);ctx.stroke();}
      for(let i=0;i<16;i++){const angle=i*Math.PI/8+phase;ctx.fillStyle='#b8e9d699';ctx.beginPath();ctx.arc(Math.cos(angle)*radius*1.95,Math.sin(angle)*radius*.5,1.1,0,Math.PI*2);ctx.fill();}ctx.restore();
      ctx.fillStyle='#04101b';ctx.beginPath();ctx.arc(hx,hy,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a8e6cf99';ctx.lineWidth=1.5;ctx.stroke();
      ctx.font='10px system-ui';ctx.fillStyle='#a9c1cf';ctx.textAlign='center';ctx.fillText('EVENT HORIZON',hx,hy+radius+28);
      const horizon=root.querySelector('.eh-horizon-info');if(horizon){horizon.style.left=hx+'px';horizon.style.top=hy+'px';horizon.style.width=radius*2+'px';horizon.style.height=radius*2+'px';}
      // Position depends on time, never chases the pointer. Freeze under hover/focus.
      if(!person.matches(':hover,:focus-within')){const distance=radius+35+(1-progress)*Math.min(width*.26,170);const px=Math.max(40,hx-distance),py=hy-18;person.style.left=px+'px';person.style.top=py+'px';}
      if(!lastText||now-lastText>1000){lastText=now;if(valid){const left=deadline-epoch;const days=Math.floor(Math.abs(left)/86400000),hours=Math.floor(Math.abs(left)%86400000/3600000);status.textContent=left>=0?`${days}d ${hours}h to the recorded horizon.`:'Recorded horizon date reached; check your current Intra status.';}else status.textContent='Set a deadline to place your journey in time.';const preview=root.querySelector('.eh-horizon-preview');if(preview)preview.textContent=valid?'Recorded horizon: '+new Date(deadline).toLocaleString('en-SG',{timeZone:'Asia/Singapore'})+' SGT · click for details':'Set a recorded deadline';const note=root.querySelector('.eh-source-note');if(note&&Number.isFinite(observed))note.textContent='Snapshot: '+new Date(observed).toLocaleDateString('en-SG')+(epoch-observed>3*86400000?' · refresh needed':'')+' · not a live eligibility check.';}
      if(moving)schedule();
    }
    root.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!animate())return;const box=root.getBoundingClientRect();target={x:(event.clientX-box.left)/width-.5,y:(event.clientY-box.top)/height-.5};const b=person.getBoundingClientRect();person.style.setProperty('--eh-eye-x',Math.max(-2,Math.min(2,(event.clientX-b.left-b.width/2)/90))+'px');person.style.setProperty('--eh-eye-y',Math.max(-1.5,Math.min(1.5,(event.clientY-b.top-b.height/2)/90))+'px');schedule();},{passive:true});
    root.addEventListener('pointerleave',()=>{target={x:0,y:0};person.style.setProperty('--eh-eye-x','0px');person.style.setProperty('--eh-eye-y','0px');});
    button.addEventListener('click',()=>{motion=!motion;try{localStorage.setItem(key,motion?'on':'off');}catch{}controls();stop();schedule();});
    for(const media of [reduced,contrast])media.addEventListener('change',()=>{controls();stop();schedule();});
    document.addEventListener('visibilitychange',()=>{stop();if(!document.hidden)schedule();});
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stop();if(visible)schedule();});observer.observe(root);
    new ResizeObserver(resize).observe(root);controls();resize();
    // Keeps deadline text current even with motion disabled; no animation loop when idle.
    const timer=setInterval(()=>{if(!root.isConnected){clearInterval(timer);observer.disconnect();stop();return;}if(visible&&!document.hidden)schedule();},60000);
    const controller={update(data){deadline=parse(data.deadline);start=parse(data.start);observed=parse(data.observedAt);identity(data);lastText=0;schedule();}};
    instances.set(root,controller);
    if(root.dataset.configUrl){
      try{const url=new URL(root.dataset.configUrl,location.href);if(url.origin!==location.origin)throw Error('Configuration must be same-origin');
        fetch(url,{credentials:'omit',redirect:'error',cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('Configuration unavailable');const text=await response.text();if(text.length>16384)throw Error('Configuration too large');return JSON.parse(text);}).then(data=>{if(!data||typeof data!=='object'||!Number.isFinite(parse(data.deadline)))throw Error('Invalid deadline configuration');controller.update(data);}).catch(()=>{root.dataset.configStatus='unavailable';});
      }catch{root.dataset.configStatus='unavailable';}
    }
    return controller;
  }
  window.EventHorizon={mount};
  document.querySelectorAll('[data-event-horizon]').forEach(root=>mount(root));
})();
