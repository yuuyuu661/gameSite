// Shared Arcade wallet using localStorage
class ArcadeWallet {
  constructor() { this.key = "arcade:points"; }
  get() {
    const v = localStorage.getItem(this.key);
    return v ? parseInt(v, 10) : 0;
  }
  set(n) {
    localStorage.setItem(this.key, String(Math.max(0, Math.floor(n))));
    window.dispatchEvent(new CustomEvent("points:change", { detail: { value: this.get() } }));
  }
  add(delta) { this.set(this.get() + delta); }
}

export const points = new ArcadeWallet();
export function formatPoints(p) { return `${p} pt`; }