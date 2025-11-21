
let cv=document.getElementById('cv'),ctx=cv.getContext('2d');
function resize(){cv.width=innerWidth;cv.height=innerHeight;}
resize();addEventListener('resize',resize);

let time=180,score=0;
let drawing=false,path=[];
setInterval(()=>{ if(time>0){ time--; document.getElementById('time').textContent=time;} },1000);

// Generate random target shape
function genShape(){
  let pts=[];
  let cx=cv.width/2, cy=cv.height/3, r=80;
  let n=3+Math.floor(Math.random()*4);
  for(let i=0;i<n;i++){
    let a=i*2*Math.PI/n;
    pts.push({x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r});
  }
  return pts;
}
let shape=genShape();

cv.addEventListener('pointerdown',e=>{drawing=true; path=[{x:e.clientX,y:e.clientY}]});
cv.addEventListener('pointermove',e=>{ if(drawing) path.push({x:e.clientX,y:e.clientY})});
cv.addEventListener('pointerup',()=>{
  drawing=false;
  // scoring = overlap approximation
  let acc=0;
  for(let p of path){
    let min=9999;
    for(let q of shape){
      let dx=p.x-q.x, dy=p.y-q.y;
      let d=Math.sqrt(dx*dx+dy*dy);
      if(d<min) min=d;
    }
    acc+=Math.max(0,50-min);
  }
  acc=Math.floor(acc/20);
  score+=acc;
  document.getElementById('score').textContent=score;
  path=[];
  shape=genShape();
});

function draw(){
  ctx.clearRect(0,0,cv.width,cv.height);
  // shape
  ctx.strokeStyle='#FF7043'; ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(shape[0].x,shape[0].y);
  for(let i=1;i<shape.length;i++) ctx.lineTo(shape[i].x,shape[i].y);
  ctx.closePath();
  ctx.stroke();

  // user path
  if(path.length>1){
    ctx.strokeStyle='#333'; ctx.lineWidth=4;
    ctx.beginPath();
    ctx.moveTo(path[0].x,path[0].y);
    for(let i=1;i<path.length;i++) ctx.lineTo(path[i].x,path[i].y);
    ctx.stroke();
  }
  requestAnimationFrame(draw);
}
draw();
