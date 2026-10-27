// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Christopher Nah
(()=>{
  const parse=value=>{if(value===null||value===undefined||value==='')return NaN;const n=Number(value);return Number.isFinite(n)?(Math.abs(n)<1e12?n*1000:n):Date.parse(value);};
  const instances=new WeakMap();
  function mount(root,options={}){
    if(instances.has(root))return instances.get(root);root.dataset.ehMounted='true';
    const person=root.querySelector('.eh-person'),status=root.querySelector('.eh-status');
    let profileMenuOpen=false;
    if(!person||!status||!window.IntersectionObserver||!window.ResizeObserver)return;
    const variables=getComputedStyle(root);
    let deadline=parse(options.deadline??root.dataset.deadline??variables.getPropertyValue('--event-horizon-deadline').trim()),start=parse(options.start??root.dataset.start),observed=parse(options.observedAt??root.dataset.observedAt);
    let profileChoicesSync=()=>{};
    function identity(data){
      const requested=data.gender??root.dataset.gender;const gender=['neutral','male','female'].includes(requested)?requested:'neutral';root.dataset.gender=gender;
      const badge=person.querySelector('.eh-gender-badge');if(badge)badge.textContent=gender==='male'?'♂':gender==='female'?'♀':'✦';
      const login=data.login??root.dataset.login;if(typeof login==='string'&&/^[A-Za-z0-9_.-]{1,32}$/.test(login)){root.dataset.login=login;person.dataset.label=login+' ↗';person.setAttribute('aria-label',login+': '+gender+' student astronaut, open Intra profile');}
      if(typeof data.profileUrl==='string'){try{const url=new URL(data.profileUrl,location.href);if(url.protocol==='https:'&&!url.username&&!url.password)person.href=url.href;}catch{}}
      profileChoicesSync(data);
    }
    identity({gender:options.gender??root.dataset.gender,login:options.login??root.dataset.login,profileUrl:options.profileUrl??root.dataset.profileUrl??person.dataset.profileUrl});
    person.target='_blank';person.rel='noopener noreferrer';
    const studentUrl=person.href;
    let publicUrl=null;
    try{const candidate=new URL(root.dataset.publicUrl||'',location.href);if(root.dataset.publicUrl&&candidate.protocol==='https:'&&!candidate.username&&!candidate.password)publicUrl=candidate.href;}catch{}
    if(publicUrl){
      const label=root.dataset.publicLabel||'Public profile';
      person.href=publicUrl;person.dataset.label=(root.dataset.login||'Student')+' · profiles ↗';
      person.setAttribute('role','button');person.setAttribute('aria-label','Choose public or 42 student profile');person.setAttribute('aria-haspopup','dialog');person.setAttribute('aria-expanded','false');
      const panel=document.createElement('div');panel.className='eh-profile-choices';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Choose a profile');panel.hidden=true;
      const heading=document.createElement('strong');heading.textContent='Where shall we go?';
      const publicLink=document.createElement('a');publicLink.href=publicUrl;publicLink.textContent='Everyone · '+label+' ↗';publicLink.target='_blank';publicLink.rel='noopener noreferrer';
      const studentLink=document.createElement('a');studentLink.href=studentUrl;studentLink.textContent='42 students · Intra ↗';studentLink.target='_blank';studentLink.rel='noopener noreferrer';
      const note=document.createElement('small');note.textContent='Both open in a new tab. Intra requires a 42 account; the public profile is open to everyone.';
      const close=document.createElement('button');close.type='button';close.textContent='Close';panel.append(heading,publicLink,studentLink,note,close);document.body.append(panel);
      profileChoicesSync=data=>{if(typeof data.profileUrl==='string'){try{const u=new URL(data.profileUrl,location.href);if(u.protocol==='https:'&&!u.username&&!u.password)studentLink.href=u.href;}catch{}}person.href=publicUrl;person.dataset.label=(root.dataset.login||'Student')+' · profiles ↗';person.setAttribute('aria-label','Choose public or 42 student profile');};
      function dismiss(focus=false){profileMenuOpen=false;panel.hidden=true;person.setAttribute('aria-expanded','false');person.removeAttribute('data-profile-open');if(focus)person.focus({preventScroll:true});}
      function open(){profileMenuOpen=true;panel.hidden=false;person.dataset.profileOpen='true';person.setAttribute('aria-expanded','true');
        const rect=person.getBoundingClientRect(),box=panel.getBoundingClientRect();
        panel.style.left=Math.max(12,Math.min(innerWidth-box.width-12,rect.left+rect.width/2-box.width/2))+'px';
        panel.style.top=Math.max(12,Math.min(innerHeight-box.height-12,rect.bottom+14))+'px';publicLink.focus({preventScroll:true});}
      person.addEventListener('click',event=>{event.preventDefault();profileMenuOpen?dismiss(true):open();});
      person.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();person.click();}});
      close.addEventListener('click',()=>dismiss(true));
      for(const link of [publicLink,studentLink])link.addEventListener('click',()=>dismiss(true));
      document.addEventListener('keydown',event=>{if(profileMenuOpen&&event.key==='Escape'){event.preventDefault();dismiss(true);}});
      document.addEventListener('pointerdown',event=>{if(profileMenuOpen&&!panel.contains(event.target)&&!person.contains(event.target))dismiss();});
      document.addEventListener('focusin',event=>{if(profileMenuOpen&&!panel.contains(event.target)&&event.target!==person)dismiss();});
      window.addEventListener('resize',()=>dismiss(),{passive:true});
    }
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),contrast=matchMedia('(forced-colors: active)');
    const key=root.dataset.storageKey||'foss-toolbox.event-horizon.motion';let motion=true;
    try{motion=localStorage.getItem(key)!=='off';}catch{}
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
    const ctx=canvas.getContext('2d');if(!ctx)return;root.classList.add('enhanced');
    const button=document.createElement('button');button.type='button';root.querySelector('.eh-controls')?.append(button);
    let frame=0,lastPaint=0,lastText=0,visible=true,width=1,height=1,phase=0,arrival=0,scrollDrift=0,mouse={x:0,y:0},target={x:0,y:0};
    const countdown=document.createElement('div');countdown.className='eh-countdown';countdown.setAttribute('role','timer');countdown.setAttribute('aria-live','off');
    root.querySelector('.eh-countdown')?.remove();root.querySelector('.eh-copy')?.append(countdown);
    const units=['Days','Hours','Minutes','Seconds'];
    const cards=units.map(label=>{const card=document.createElement('span');card.className='eh-flip-unit';const face=document.createElement('strong');face.className='eh-flip-face';face.textContent='00';const caption=document.createElement('span');caption.textContent=label;card.append(face,caption);countdown.append(card);return face;});
    function tick(){
      if(!Number.isFinite(deadline)){countdown.hidden=true;return;}countdown.hidden=false;
      const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
      const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
      countdown.setAttribute('aria-label',values.map((n,i)=>n+' '+units[i].toLowerCase()).join(', ')+' to the recorded deadline');
      cards.forEach((card,i)=>{const value=String(values[i]).padStart(2,'0');if(card.textContent===value)return;card.textContent=value;card.classList.remove('flipping');if(animate()){void card.offsetWidth;card.classList.add('flipping');}});
    }
    const chatterEnabled=root.hasAttribute('data-astronaut-chatter');
    const bubble=document.createElement('span');bubble.className='eh-speech';bubble.setAttribute('aria-hidden','true');bubble.hidden=true;person.append(bubble);
    const sayings=['send snacks, not segfaults','zero gravity, zero braincells','tiny steps. big void.','are we there yet?','brb, orbiting','pls do not feed the black hole','i brought snacks :3','just a lil space guy','this is fine. probably.','uwu, but in space'];
    let zone='far',reactionUntil=0,engaged=false,departed=false,nearSince=0,dwellHint=false,discoveryStart=0;
    const chatAllowed=()=>chatterEnabled&&motion&&!reduced.matches&&!contrast.matches&&!document.hidden&&(visible||docked);
    const finePointer=matchMedia('(any-pointer: fine)');
    const hint=document.createElement('span');hint.className='eh-interaction-hint';hint.setAttribute('aria-hidden','true');hint.textContent='move your cursor closer ↗';person.append(hint);
    // Separate the waving arm so the profile target and body stay still.
    const limbs=person.querySelector('svg > path');
    if(limbs?.getAttribute('d')?.includes('M44 37l8 8')){limbs.setAttribute('d',limbs.getAttribute('d').replace('M44 37l8 8',''));const arm=document.createElementNS('http://www.w3.org/2000/svg','path');arm.setAttribute('d','M44 37l8 8');arm.setAttribute('stroke','currentColor');arm.setAttribute('stroke-width','5');arm.setAttribute('stroke-linecap','round');arm.classList.add('eh-wave-arm');limbs.after(arm);}
    function speak(text,mood='idle'){bubble.textContent=text;bubble.hidden=false;person.dataset.ehMood=mood;person.classList.toggle('eh-distressed',mood==='depart');}
    function react(text,mood){reactionUntil=performance.now()+3000;speak(text,mood);}
    function chatter(){
      hint.hidden=!chatAllowed()||engaged||!finePointer.matches;
      if(!chatAllowed()){bubble.hidden=true;person.classList.remove('eh-distressed');person.dataset.ehMood='quiet';return;}
      const clock=performance.now();if(!discoveryStart)discoveryStart=clock;
      if(zone==='near'&&clock-nearSince>1300&&!dwellHint){dwellHint=true;react('click me? pick your destination :3','near');}
      if(clock<reactionUntil)return;
      person.classList.remove('eh-distressed');
      if(!engaged&&finePointer.matches){
        const elapsed=clock-discoveryStart;
        if(elapsed>1800&&elapsed<5800){speak('psst… yes, you there 👀','beckon');return;}
        if(elapsed>=5800&&elapsed<10500){speak('bring your cursor closer?','beckon');return;}
        if(elapsed%30000<4500&&elapsed>10500){speak('tiny astronaut requesting a cursor 🥺','beckon');return;}
      }
      if(zone==='near'){bubble.hidden=true;person.dataset.ehMood='near';return;}
      // Only idle chatter uses Unix slots; reactions are immediate session events.
      const now=Date.now(),slot=Math.floor(now/20000),offset=((now%20000)+20000)%20000;
      if(offset<4500)speak(sayings[((slot*7+3)%sayings.length+sayings.length)%sayings.length]);else{bubble.hidden=true;person.dataset.ehMood='idle';}
    }
    function cursorReaction(event){
      if(!chatAllowed()||event.pointerType!=='mouse')return;
      const rect=person.getBoundingClientRect(),distance=Math.hypot(event.clientX-rect.left-rect.width/2,event.clientY-rect.top-rect.height/2);
      if(zone==='near'&&distance>155){zone='far';departed=true;nearSince=0;react('nooo!!! come baaack 🥺','depart');}
      else if(zone!=='near'&&distance<90){zone='near';nearSince=performance.now();dwellHint=false;engaged=true;hint.hidden=true;react(departed?'you came back!! :3':'you found me!! helppppp','near');}
      else if(zone==='far'&&distance<210){zone='approach';if(!engaged)react('yes, YOUR cursor! closer…','beckon');}
      else if(zone==='approach'&&distance>260){zone='far';}
    }
    const dockEnabled=root.hasAttribute('data-dock-astronaut');
    const homeSlot=document.createComment('Astronaut returns here');person.before(homeSlot);
    let docked=false,petFrame=0,petLast=0,petPhase=0,home={x:40,y:200};
    function stopPet(){if(petFrame)cancelAnimationFrame(petFrame);petFrame=0;petLast=0;}
    function dockPosition(now=0){
      petFrame=0;if(!docked||document.hidden)return;
      const moving=motion&&!reduced.matches&&!contrast.matches;
      if(moving&&petLast&&now-petLast<33){petFrame=requestAnimationFrame(dockPosition);return;}
      const dt=petLast?Math.min(70,now-petLast):33;petLast=now;if(moving)petPhase+=dt*.001;
      if(!profileMenuOpen&&!person.matches(':hover,:focus-within')){
        const box=root.getBoundingClientRect();
        person.style.left=Math.max(42,Math.min(innerWidth-42,box.left+home.x))+'px';
        person.style.top=(48+(moving?Math.sin(petPhase*1.8)*3:0))+'px';
        person.style.setProperty('--eh-tilt',moving?Math.sin(petPhase)*4+'deg':'0deg');
      }
      if(!moving){person.style.setProperty('--eh-eye-x','0px');person.style.setProperty('--eh-eye-y','0px');}
      if(moving)petFrame=requestAnimationFrame(dockPosition);
    }
    function docking(){
      if(!dockEnabled)return;
      const box=root.getBoundingClientRect(),shouldDock=box.top+home.y<48;
      if(shouldDock!==docked){
        const focused=document.activeElement===person;
        docked=shouldDock;person.classList.toggle('eh-docked',docked);
        if(docked){document.body.append(person);person.style.left=Math.max(42,Math.min(innerWidth-42,box.left+home.x))+'px';person.style.top='48px';person.title=publicUrl?'Your travelling astronaut · choose a profile':'Your travelling astronaut · open Intra profile';}
        else{homeSlot.after(person);person.removeAttribute('title');person.style.left=home.x+'px';person.style.top=home.y+'px';}
        if(focused)person.focus({preventScroll:true});
      }
      stopPet();if(docked)dockPosition();
    }
    const stars=Array.from({length:85},(_,i)=>({x:((i*73+19)%997)/997,y:((i*137+47)%991)/991,r:.5+(i%3)*.35}));
    function animate(){return motion&&!reduced.matches&&!contrast.matches&&visible&&!document.hidden;}
    function controls(){root.dataset.ehMotion=motion&&!reduced.matches&&!contrast.matches?'on':'off';button.disabled=reduced.matches||contrast.matches;button.textContent='Motion: '+(button.disabled?'System default':motion?'On':'Off');button.setAttribute('aria-pressed',String(motion&&!button.disabled));window.dispatchEvent(new CustomEvent('event-horizon-motion',{detail:{enabled:motion&&!button.disabled}}));docking();chatter();}
    function stop(){if(frame)cancelAnimationFrame(frame);frame=0;lastPaint=0;}
    function schedule(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
    function resize(){const box=root.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
      // Restored scroll positions/hash links may start with the scene offscreen.
      // Calculate its real home before docking, without requiring a canvas frame.
      const beginning=Number.isFinite(start)&&start<deadline?start:deadline-90*86400000;
      const progress=Number.isFinite(deadline)?Math.max(0,Math.min(1,(Date.now()-beginning)/(deadline-beginning))):.35;
      home={x:40+progress*(width*.70-Math.min(width*.115,55)-74),y:height*(width<520?.49:.52)-18};
      docking();schedule();}
    function draw(now){
      frame=0;if(!visible||document.hidden)return;
      const moving=animate();if(moving&&lastPaint&&now-lastPaint<32){schedule();return;}
      const dt=lastPaint?Math.min(70,now-lastPaint):32;lastPaint=now;if(moving){phase+=dt*.00012;arrival=Math.min(1,arrival+dt/1800);}
      mouse.x+=(target.x-mouse.x)*.12;mouse.y+=(target.y-mouse.y)*.12;
      if(!moving){mouse={x:0,y:0};person.style.setProperty('--eh-eye-x','0px');person.style.setProperty('--eh-eye-y','0px');}
      const epoch=Date.now();const valid=Number.isFinite(deadline);const windowStart=Number.isFinite(start)&&start<deadline?start:deadline-90*86400000;
      const progress=valid?Math.max(0,Math.min(1,(epoch-windowStart)/(deadline-windowStart))):.35;
      const hx=width*.70,hy=height*(width<520?.49:.52),radius=Math.min(width*.115,55);
      ctx.clearRect(0,0,width,height);
      for(const s of stars){const x=s.x*width+mouse.x*(s.r*38),y=((s.y*height+mouse.y*(s.r*28)-scrollY*(.035+s.r*.045))%height+height)%height;ctx.fillStyle=`rgba(208,234,246,${.25+s.r*.22})`;ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();}
      const glow=ctx.createRadialGradient(hx,hy,radius*.7,hx,hy,radius*2.6);glow.addColorStop(0,'#91c9c94d');glow.addColorStop(.5,'#4d8c9b22');glow.addColorStop(1,'#4d8c9b00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(hx,hy,radius*2.6,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(hx,hy);ctx.rotate(-.34);
      for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(168,230,207,${.12+i*.11})`;ctx.lineWidth=1+i*.8;ctx.beginPath();ctx.ellipse(0,0,radius*(1.7+i*.18),radius*(.38+i*.07),0,0,Math.PI*2);ctx.stroke();}
      for(let i=0;i<16;i++){const angle=i*Math.PI/8+phase;ctx.fillStyle='#b8e9d699';ctx.beginPath();ctx.arc(Math.cos(angle)*radius*1.95,Math.sin(angle)*radius*.5,1.1,0,Math.PI*2);ctx.fill();}ctx.restore();
      ctx.fillStyle='#04101b';ctx.beginPath();ctx.arc(hx,hy,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a8e6cf99';ctx.lineWidth=1.5;ctx.stroke();
      ctx.font='10px system-ui';ctx.fillStyle='#a9c1cf';ctx.textAlign='center';ctx.fillText('EVENT HORIZON',hx,hy+radius+28);
      const horizon=root.querySelector('.eh-horizon-info');if(horizon){horizon.style.left=hx+'px';horizon.style.top=hy+'px';horizon.style.width=radius*2+'px';horizon.style.height=radius*2+'px';}
      // Time determines distance; scroll adds a bounded drift, never changes deadline progress.
      const box=root.getBoundingClientRect();
      const desiredScroll=moving?Math.max(-1,Math.min(1,-box.top/Math.max(1,height))):0;
      scrollDrift=moving?scrollDrift+(desiredScroll-scrollDrift)*.08:0;
      if(!profileMenuOpen&&(docked||!person.matches(':hover,:focus-within'))){
        const distance=radius+35+(1-progress)*Math.min(width*.26,170);
        const settled=40+progress*(hx-radius-74),ease=1-Math.pow(1-arrival,3);
        const enter=moving?(1-ease)*Math.min(width*.26,160):0;
        const bob=moving?Math.sin(phase*4)*7:0,drift=moving?Math.sin(phase*2.6)*3:0;
        home.x=Math.max(36,Math.min(hx-radius-34,settled-enter+scrollDrift*24+drift));
        home.y=hy-18+bob-scrollDrift*22;
        if(!docked){person.style.left=home.x+'px';person.style.top=home.y+'px';}
        if(!docked)person.style.setProperty('--eh-tilt',moving?(Math.sin(phase*3)*4-scrollDrift*8)+'deg':'0deg');
      }
      docking();
      // Instrument scale is calendar-linear; its marker uses the unanimated position.
      const railStart=40,railEnd=hx-radius-34,railY=hy+82;
      ctx.save();ctx.strokeStyle='#a8e6cf55';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(railStart,railY);ctx.lineTo(hx+radius,railY);ctx.stroke();
      ctx.font='9px ui-monospace,monospace';ctx.fillStyle='#bad9dd';
      for(let i=0;i<=20;i++){const x=railStart+(railEnd-railStart)*i/20;ctx.beginPath();ctx.moveTo(x,railY);ctx.lineTo(x,railY+(i%5===0?10:5));ctx.stroke();}
      const markX=railStart+progress*(railEnd-railStart);
      ctx.fillStyle='#a8e6cf';ctx.beginPath();ctx.moveTo(markX,railY-4);ctx.lineTo(markX-4,railY-11);ctx.lineTo(markX+4,railY-11);ctx.closePath();ctx.fill();
      ctx.textAlign='left';ctx.fillText(Number.isFinite(start)?'CORE JOINED':'WINDOW START',railStart,railY+27);
      const shortDate=value=>new Date(value).toLocaleDateString('en-SG',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Singapore'});
      if(Number.isFinite(start))ctx.fillText(shortDate(start),railStart,railY+41);
      ctx.textAlign='right';ctx.fillText('RECORDED HORIZON',hx+radius,railY+27);if(valid)ctx.fillText(shortDate(deadline),hx+radius,railY+41);
      ctx.textAlign='center';ctx.fillStyle='#dffff1';ctx.fillText('NOW'+(Number.isFinite(start)?' · DAY '+Math.max(0,Math.floor((epoch-start)/86400000)):''),markX,railY-17);
      // Sparse wake strokes suggest travel, not an accelerated passage of real time.
      if(moving&&!docked&&!person.matches(':hover,:focus-within')){const px=parseFloat(person.style.left),py=parseFloat(person.style.top);ctx.strokeStyle='#a8e6cf33';for(let i=0;i<3;i++){const slip=(phase*130+i*17)%48;ctx.beginPath();ctx.moveTo(px-36-slip,py-10+i*10);ctx.lineTo(px-26-slip,py-10+i*10);ctx.stroke();}}
      ctx.restore();
      if(!lastText||now-lastText>1000){lastText=now;if(valid){const left=deadline-epoch;const days=Math.floor(Math.abs(left)/86400000),hours=Math.floor(Math.abs(left)%86400000/3600000);status.textContent=left>=0?`${days}d ${hours}h to the recorded horizon.`:'Recorded horizon date reached; check your current Intra status.';}else status.textContent='Set a deadline to place your journey in time.';const preview=root.querySelector('.eh-horizon-preview');if(preview)preview.textContent=valid?'Recorded horizon: '+new Date(deadline).toLocaleString('en-SG',{timeZone:'Asia/Singapore'})+' SGT · click for details':'Set a recorded deadline';const note=root.querySelector('.eh-source-note');if(note&&Number.isFinite(observed))note.textContent='Snapshot: '+new Date(observed).toLocaleDateString('en-SG')+(epoch-observed>3*86400000?' · refresh needed':'')+' · not a live eligibility check.';}
      if(moving)schedule();
    }
    window.addEventListener('scroll',()=>{docking();if(visible&&animate())schedule();},{passive:true});
    window.addEventListener('pointermove',event=>{cursorReaction(event);if(event.pointerType!=='mouse'||!(animate()||(docked&&motion&&!reduced.matches&&!contrast.matches&&!document.hidden)))return;target={x:event.clientX/Math.max(1,innerWidth)-.5,y:event.clientY/Math.max(1,innerHeight)-.5};const b=person.getBoundingClientRect();person.style.setProperty('--eh-eye-x',Math.max(-2,Math.min(2,(event.clientX-b.left-b.width/2)/90))+'px');person.style.setProperty('--eh-eye-y',Math.max(-1.5,Math.min(1.5,(event.clientY-b.top-b.height/2)/90))+'px');schedule();},{passive:true});
    document.documentElement.addEventListener('pointerleave',()=>{target={x:0,y:0};person.style.setProperty('--eh-eye-x','0px');person.style.setProperty('--eh-eye-y','0px');});
    button.addEventListener('click',()=>{motion=!motion;try{localStorage.setItem(key,motion?'on':'off');}catch{}controls();stop();schedule();});
    for(const media of [reduced,contrast])media.addEventListener('change',()=>{controls();stop();schedule();});
    document.addEventListener('visibilitychange',()=>{stop();stopPet();if(!document.hidden){docking();schedule();}});
    window.addEventListener('resize',docking,{passive:true});
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stop();if(visible)schedule();});observer.observe(root);
    new ResizeObserver(resize).observe(root);controls();resize();tick();chatter();
    // Keeps deadline text current even with motion disabled; no animation loop when idle.
    const timer=setInterval(()=>{if(!root.isConnected){clearInterval(timer);observer.disconnect();stop();return;}if(!document.hidden){chatter();if(visible){tick();schedule();}}},500);
    const controller={setMotion(enabled){motion=Boolean(enabled);try{localStorage.setItem(key,motion?'on':'off');}catch{}controls();stop();schedule();},update(data){deadline=parse(data.deadline);start=parse(data.start);observed=parse(data.observedAt);identity(data);lastText=0;tick();schedule();}};
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
