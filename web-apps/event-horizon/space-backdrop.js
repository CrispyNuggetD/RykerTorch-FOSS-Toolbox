// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Christopher Nah
// Optional original space treatment: no game assets, external requests or tracking.
(()=>{
 const root=document.querySelector('[data-space-background]');if(!root)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),contrast=matchMedia('(forced-colors: active)');
 const canvas=document.createElement('canvas');canvas.className='space-backdrop';canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');if(!ctx)return;document.body.prepend(canvas);document.body.classList.add('has-space-backdrop');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='space-motion-toggle';document.body.append(toggle);
 let enabled=root.dataset.ehMotion==='on',frame=0,last=0,time=0,w=1,h=1,pointer={x:0,y:0},aim={x:0,y:0},scroll=window.scrollY;
 const stars=Array.from({length:160},(_,i)=>({x:((i*79+17)%997)/997,y:((i*149+41)%991)/991,depth:1+i%3,r:.5+(i%4)*.28}));
 function moving(){return enabled&&!reduced.matches&&!contrast.matches;}
 function state(){toggle.disabled=reduced.matches||contrast.matches;toggle.textContent='Space motion: '+(toggle.disabled?'System':enabled?'On':'Off');toggle.setAttribute('aria-pressed',String(moving()));document.body.classList.toggle('space-high-contrast',contrast.matches);}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
 function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);schedule();}
 const wrap=(x,n)=>(x%n+n)%n;
 function cloud(x,y,rx,ry,color){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,'#11223800');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();}
 function draw(now){frame=0;if(document.hidden)return;const active=moving();if(active&&last&&now-last<33){schedule();return;}const dt=last?Math.min(now-last,70):33;last=now;if(active)time+=dt/1000;
 pointer.x+=(aim.x-pointer.x)*.07;pointer.y+=(aim.y-pointer.y)*.07;scroll+=(scrollY-scroll)*.08;
 if(!active){pointer={x:0,y:0};scroll=0;}
 ctx.fillStyle='#0d2032';ctx.fillRect(0,0,w,h);
 // Distant diffuse galaxies drift slowly; nearer clouds and stars move faster.
 for(let i=0;i<5;i++){const depth=.04+i*.025;const x=w*(i%2?.92:.08)+pointer.x*(20+i*10);const y=wrap(h*(.15+i*.27)-scroll*depth+pointer.y*20,h+600)-300;cloud(x,y,330+i*35,240+i*15,i%2?'#38516f77':'#33726966');}
 ctx.save();ctx.translate(w*.83+pointer.x*16,wrap(h*.4-scroll*.035,h+500)-150);ctx.rotate(-.55);cloud(0,0,380,65,'#a3b7cb44');cloud(0,0,130,25,'#ccdedb55');ctx.restore();
 for(const star of stars){const x=wrap(star.x*w+pointer.x*star.depth*24,w);const y=wrap(star.y*h-scroll*star.depth*.12+pointer.y*star.depth*18,h);ctx.fillStyle=`rgba(210,234,246,${.25+star.depth*.15})`;ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fill();}
 // One short, quiet comet crossing every 18 active seconds, alternating edges.
 const cycle=time%18;if(active&&cycle>12&&cycle<14.4){const progress=(cycle-12)/2.4,side=Math.floor(time/18)%2?1:-1;const x=side<0?w*(1.15-progress*1.3):w*(-.15+progress*1.3),y=h*(.1+progress*.55);const tail=ctx.createLinearGradient(x,y,x+side*130,y-55);tail.addColorStop(0,'#d5f9e7aa');tail.addColorStop(1,'#a8e6cf00');ctx.strokeStyle=tail;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*130,y-55);ctx.stroke();}
 if(active)schedule();}
 window.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&moving())aim={x:e.clientX/w-.5,y:e.clientY/h-.5};},{passive:true});
 window.addEventListener('scroll',()=>{if(moving())schedule();},{passive:true});window.addEventListener('resize',resize,{passive:true});
 window.addEventListener('event-horizon-motion',e=>{enabled=Boolean(e.detail.enabled);state();stop();schedule();});
 toggle.addEventListener('click',()=>window.EventHorizon?.mount(root)?.setMotion(!enabled));
 for(const media of [reduced,contrast])media.addEventListener('change',()=>{state();stop();schedule();});
 document.addEventListener('visibilitychange',()=>{stop();if(!document.hidden)schedule();});state();resize();
})();
