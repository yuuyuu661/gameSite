import { points, formatPoints } from "../assets/js/portal.js";
export function renderHeader({ title="Arcade", backTo="./", hideBack=false }){
  const bar = document.createElement("div"); bar.className = "header";
  if(!hideBack){
    const back = document.createElement("button"); back.className="back"; back.textContent="← Arcade";
    back.onclick = () => (window.location.href = backTo);
    bar.appendChild(back);
  }
  const t = document.createElement("div"); t.className="title"; t.textContent=title; bar.appendChild(t);
  const spacer = document.createElement("div"); spacer.className="spacer"; bar.appendChild(spacer);
  const pts = document.createElement("div"); pts.className="points";
  const label = document.createElement("span"); label.textContent = "Points";
  const val = document.createElement("strong"); val.textContent = formatPoints(points.ensureInit(1000));
  pts.appendChild(label); pts.appendChild(val); bar.appendChild(pts);
  document.body.prepend(bar);
  window.addEventListener("points:change", ()=>{ val.textContent = formatPoints(points.get()); });
}