// Render header with back button and shared wallet
import { points, formatPoints } from "../assets/js/portal.js";

export function renderHeader({ title = "Arcade", backTo = "/" }) {
  const bar = document.createElement("div");
  bar.className = "header";

  const back = document.createElement("button");
  back.className = "back";
  back.textContent = "← Arcade";
  back.onclick = () => (window.location.href = backTo);
  bar.appendChild(back);

  const t = document.createElement("div");
  t.className = "title";
  t.textContent = title;
  bar.appendChild(t);

  const spacer = document.createElement("div");
  spacer.className = "spacer";
  bar.appendChild(spacer);

  const pts = document.createElement("div");
  pts.className = "points";
  const span = document.createElement("span");
  span.textContent = "Points";
  const value = document.createElement("strong");
  value.textContent = formatPoints(points.get());
  pts.appendChild(span);
  pts.appendChild(value);
  bar.appendChild(pts);

  document.body.prepend(bar);

  window.addEventListener("points:change", () => {
    value.textContent = formatPoints(points.get());
  });
}