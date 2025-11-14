
const Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Events = Matter.Events;

let engine = Engine.create();
let world = engine.world;

const canvas = document.getElementById("world");
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: { width: window.innerWidth, height: window.innerHeight*0.75, wireframes:false, background:"#fff" }
});
Render.run(render);
Engine.run(engine);

let score = 0;
let currentFruitIndex = 0;
let dropping = null;

const FRUITS = Array.from({length:10}, (_,i)=>`fruit_${i}.png`);
const RADII=[20,25,30,35,40,45,50,55,60,65];

function spawnFruit(){
  currentFruitIndex = Math.floor(Math.random()*3);
  dropping = Bodies.circle(render.options.width/2,50,RADII[currentFruitIndex],{
    restitution:0.2,
    render:{ sprite:{ texture: FRUITS[currentFruitIndex], xScale:0.4, yScale:0.4 }}
  });
  World.add(world, dropping);
}

canvas.addEventListener("click",(e)=>{
  if(!dropping) return;
  Body.setPosition(dropping, { x:e.offsetX, y:50 });
  Body.setStatic(dropping, false);
  dropping=null;
  setTimeout(spawnFruit,500);
});

Events.on(engine,"collisionStart",(ev)=>{
  ev.pairs.forEach(pair=>{
    let a=pair.bodyA, b=pair.bodyB;
    if(a.label==="fruit" || b.label==="fruit"){
      if(a.render.sprite && b.render.sprite){
        let ia = FRUITS.indexOf(a.render.sprite.texture);
        let ib = FRUITS.indexOf(b.render.sprite.texture);
        if(ia===ib && ia<9){
          World.remove(world,a);
          World.remove(world,b);
          let merged = Bodies.circle((a.position.x+b.position.x)/2,(a.position.y+b.position.y)/2,RADII[ia+1],{
            restitution:0.2,
            render:{sprite:{texture:FRUITS[ia+1], xScale:0.4, yScale:0.4}}
          });
          merged.label="fruit";
          World.add(world, merged);
          score += (ia+1)*10;
          document.getElementById("score").innerText="Score: "+score;
          new Audio("peta.mp3").play();
        }
      }
    }
  });
});

spawnFruit();
