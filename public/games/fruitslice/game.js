
let cv=document.getElementById('cv'),ctx=cv.getContext('2d');
function resize(){cv.width=innerWidth;cv.height=innerHeight;}
resize();addEventListener('resize',resize);

let fruits=[],pieces=[],sparks=[];
let score=0,time=30,last=0;
let fruitImgs=[];
for(let i=0;i<8;i++){
  let im=new Image();
  im.src='fruits/fruit_'+i+'a.png';
  fruitImgs.push(im);
}
let sparkImg=new Image(); sparkImg.src='effects/spark_0.png';

function spawn(){
    let x=Math.random()*cv.width;
    let y=cv.height+50;
    let vx=(Math.random()-0.5)*2;
    let vy=-10-Math.random()*5;
    let t=Math.floor(Math.random()*8);
    fruits.push({x,y,vx,vy,rot:0,img:fruitImgs[t],alive:true});
}

function update(dt){
    if(time<=0)return;
    if(Math.random()<0.04)spawn();

    fruits.forEach(f=>{
        f.x+=f.vx; f.y+=f.vy; f.vy+=0.3; f.rot+=0.05;
        if(f.y>cv.height+200) f.alive=false;
    });
    fruits=fruits.filter(f=>f.alive);

    pieces.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life-=dt;
    });
    pieces=pieces.filter(p=>p.life>0);

    sparks.forEach(s=>{
        s.x+=s.vx; s.y+=s.vy; s.life-=dt;
    });
    sparks=sparks.filter(s=>s.life>0);
}

let slicing=false,pts=[];
cv.addEventListener('pointerdown',e=>{slicing=true; pts=[{x:e.clientX,y:e.clientY}]});
cv.addEventListener('pointermove',e=>{
  if(!slicing)return;
  pts.push({x:e.clientX,y:e.clientY});
  // slash effect
  if(pts.length>2){
    let p=pts[pts.length-1], q=pts[pts.length-2];
    let ang=Math.atan2(p.y-q.y,p.x-q.x);
    let spd=6;
    sparks.push({x:p.x,y:p.y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:0.15});
  }
  // hit detection + split
  fruits.forEach(f=>{
     if(!f.alive)return;
     let dx=f.x-e.clientX, dy=f.y-e.clientY;
     if(dx*dx+dy*dy<2500){
        f.alive=false;
        score+=10;
        document.getElementById('score').textContent=score;
        // split pieces
        let ang=0;
        if(pts.length>2){
          let p=pts[pts.length-1], q=pts[pts.length-2];
          ang=Math.atan2(p.y-q.y,p.x-q.x);
        }
        let sp=Math.PI/2;
        let speed=6;
        pieces.push({x:f.x,y:f.y,vx:Math.cos(ang-sp)*speed,vy:Math.sin(ang-sp)*speed,
                      img:f.img,life:1});
        pieces.push({x:f.x,y:f.y,vx:Math.cos(ang+sp)*speed,vy:Math.sin(ang+sp)*speed,
                      img:f.img,life:1});
     }
  });
});
cv.addEventListener('pointerup',()=>{slicing=false; pts=[]});

function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    // fruits
    fruits.forEach(f=>{
       ctx.save();
       ctx.translate(f.x,f.y);
       ctx.rotate(f.rot);
       ctx.drawImage(f.img,-40,-40,80,80);
       ctx.restore();
    });

    // pieces
    pieces.forEach(p=>{
       ctx.save();
       ctx.globalAlpha=Math.max(0,p.life);
       ctx.translate(p.x,p.y);
       ctx.drawImage(p.img,-30,-30,60,60);
       ctx.restore();
    });

    // sparks
    sparks.forEach(s=>{
       ctx.save();
       ctx.globalAlpha=Math.max(0,s.life);
       ctx.drawImage(sparkImg,s.x-10,s.y-10,20,20);
       ctx.restore();
    });

    // slash trail
    if(pts.length>1){
      ctx.strokeStyle='rgba(255,255,255,0.9)';
      ctx.lineWidth=6;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
      ctx.stroke();
    }
}

function loop(ts){
  let dt=(ts-last)/1000; last=ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(()=>{ if(time>0){ time--; document.getElementById('time').textContent=time; } },1000);
