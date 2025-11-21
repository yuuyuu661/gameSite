
let cv=document.getElementById('cv'),ctx=cv.getContext('2d');
function resize(){cv.width=innerWidth;cv.height=innerHeight;}resize();
addEventListener('resize',resize);

let fruits=[],pieces=[],sparks=[],running=false,time=30,score=0,last=0;
let imgs=[],sparkImg=new Image(); sparkImg.src='effects/spark_0.png';

for(let i=0;i<8;i++){ let im=new Image(); im.src='fruits/fruit_'+i+'a.png'; imgs.push(im); }

function spawn(){
  let side=Math.floor(Math.random()*4);
  let x,y,vx,vy;
  let t=Math.floor(Math.random()*8);
  if(side===0){ x=Math.random()*cv.width; y=cv.height+40; vx=(Math.random()-0.5)*2; vy=-8-Math.random()*4; }
  if(side===1){ x=Math.random()*cv.width; y=-40; vx=(Math.random()-0.5)*2; vy=8+Math.random()*4; }
  if(side===2){ x=-40; y=Math.random()*cv.height; vx=8+Math.random()*4; vy=(Math.random()-0.5)*2; }
  if(side===3){ x=cv.width+40; y=Math.random()*cv.height; vx=-8-Math.random()*4; vy=(Math.random()-0.5)*2; }
  fruits.push({x,y,vx,vy,rot:0,img:imgs[t],alive:true});
}

let slicing=false,pts=[];
cv.addEventListener('pointerdown',e=>{ if(!running)return; slicing=true; pts=[{x:e.clientX,y:e.clientY}]; });
cv.addEventListener('pointermove',e=>{ if(!slicing)return; pts.push({x:e.clientX,y:e.clientY}); });
cv.addEventListener('pointerup',()=>{ slicing=false; pts=[]; });

function update(dt){
  if(Math.random()<0.04) spawn();
  fruits.forEach(f=>{ f.x+=f.vx; f.y+=f.vy; f.vy+=0.2; f.rot+=0.05;
    if(f.x<-200||f.x>cv.width+200||f.y<-200||f.y>cv.height+200) f.alive=false; });
  fruits=fruits.filter(f=>f.alive);

  if(slicing&&pts.length>1){
    let p=pts[pts.length-1];
    fruits.forEach(f=>{
      let dx=f.x-p.x, dy=f.y-p.y;
      if(dx*dx+dy*dy<2500){
        f.alive=false; score+=10; document.getElementById('score').textContent=score;
      }
    });
  }
}

function draw(){
  ctx.clearRect(0,0,cv.width,cv.height);
  fruits.forEach(f=>{
    ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.rot);
    ctx.drawImage(f.img,-40,-40,80,80); ctx.restore();
  });
  if(slicing&&pts.length>1){
    ctx.strokeStyle='white'; ctx.lineWidth=6; ctx.beginPath();
    ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.stroke();
  }
}

function loop(ts){
  if(!running){ requestAnimationFrame(loop); return; }
  let dt=(ts-last)/1000; last=ts;
  update(dt); draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

document.getElementById('startBtn').onclick=()=>{
  running=true; score=0; time=30;
  document.getElementById('score').textContent=0;
  document.getElementById('time').textContent=30;
  document.getElementById('hud').style.display='flex';
  document.getElementById('startBtn').style.display='none';
  document.getElementById('backBtn').style.display='none';
  let timer=setInterval(()=>{
    if(!running){ clearInterval(timer); return; }
    time--; document.getElementById('time').textContent=time;
    if(time<=0){
      running=false;
      document.getElementById('backBtn').style.display='block';
    }
  },1000);
};

document.getElementById('backBtn').onclick=()=>{ location.href='../../index.html'; };
