import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js";

const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

const WIDTH = 420;
const HEIGHT = 700;
const CEILING_Y = 120;

const FRUITS = [
  { id: 0, radius: 18, img: "fruits/fruit_0.png", next: 1 },
  { id: 1, radius: 22, img: "fruits/fruit_1.png", next: 2 },
  { id: 2, radius: 26, img: "fruits/fruit_2.png", next: 3 },
  { id: 3, radius: 30, img: "fruits/fruit_3.png", next: 4 },
  { id: 4, radius: 36, img: "fruits/fruit_4.png", next: 5 },
  { id: 5, radius: 42, img: "fruits/fruit_5.png", next: 6 },
  { id: 6, radius: 48, img: "fruits/fruit_6.png", next: 7 },
  { id: 7, radius: 54, img: "fruits/fruit_7.png", next: 8 },
  { id: 8, radius: 60, img: "fruits/fruit_8.png", next: 9 },
  { id: 9, radius: 68, img: "fruits/fruit_9.png", next: null }
];

const engine = Engine.create();
const world = engine.world;

const render = Render.create({
  element: document.getElementById("game"),
  engine: engine,
  options: {
    width: WIDTH,
    height: HEIGHT,
    wireframes: false,
    background: "#111"
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

const floor = Bodies.rectangle(WIDTH/2, HEIGHT+30, WIDTH, 60, { isStatic:true });
const leftWall = Bodies.rectangle(-30, HEIGHT/2, 60, HEIGHT, { isStatic:true });
const rightWall= Bodies.rectangle(WIDTH+30, HEIGHT/2, 60, HEIGHT, { isStatic:true });
Composite.add(world, [floor, leftWall, rightWall]);

function spawnFruit(level, x, y){
  const f = FRUITS[level];
  const body = Bodies.circle(x, y, f.radius, {
    restitution:0.4,
    friction:0.3,
    render:{
      sprite:{
        texture: f.img,
        xScale: (f.radius*2)/256,
        yScale: (f.radius*2)/256
      }
    }
  });
  body.fruitLevel = level;
  Composite.add(world, body);
  return body;
}

let currentLevel = 0;
let canDrop = true;
window.addEventListener("pointerdown", e=>{
  if(!canDrop) return;
  const rect = render.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  spawnFruit(currentLevel, x, 80);
  canDrop=false;
  currentLevel = Math.floor(Math.random()*3);
  setTimeout(()=>canDrop=true, 600);
});

const petaSE = new Audio("/sounds/peta.mp3");
let score = 0;

Events.on(engine, "collisionStart", event=>{
  for(const pair of event.pairs){
    const A = pair.bodyA;
    const B = pair.bodyB;
    if(A.fruitLevel===undefined || B.fruitLevel===undefined) continue;
    if(A.fruitLevel !== B.fruitLevel) continue;
    const level = A.fruitLevel;
    if(level === 9) continue;
    if(A._merging || B._merging) continue;
    A._merging = B._merging = true;

    const next = FRUITS[level].next;
    const x = (A.position.x + B.position.x)/2;
    const y = (A.position.y + B.position.y)/2;

    Composite.remove(world,A);
    Composite.remove(world,B);

    const newF = spawnFruit(next, x, y);

    try{ petaSE.currentTime=0; petaSE.play(); }catch(e){}

    Body.scale(newF,1.25,1.25);
    setTimeout(()=> Body.scale(newF,0.80,0.80),120);

    addScore(level);
    checkGameOver();
  }
});

function addScore(level){
  score += level*12 + 10;
  document.getElementById("scoreText").textContent = "Score: "+score;
}

function checkGameOver(){
  for(const b of Composite.allBodies(world)){
    if(b.fruitLevel!==undefined && b.position.y < CEILING_Y){
      alert("ゲームオーバー！");
      location.reload();
      return;
    }
  }
}
