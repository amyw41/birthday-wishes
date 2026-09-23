import { WISHES, FINAL_LETTER } from "./wishes.js";
import { playClick } from "./sound.js";

export function initGallery() {
  const theEnd = document.getElementById("the-end");
  const overlay = document.getElementById("gallery-overlay");
  const grid = document.getElementById("gallery-grid");
  const closeBtn = document.getElementById("gallery-close");

  WISHES.forEach((text) => {
    const mini = document.createElement("div");
    mini.className = "mini-wish";
    mini.textContent = text;
    mini.addEventListener("click", () => openReadOnly(text, false));
    grid.appendChild(mini);
  });

  const letterMini = document.createElement("div");
  letterMini.className = "mini-wish letter";
  letterMini.textContent = "olivia's letter";
  letterMini.addEventListener("click", () => openReadOnly(FINAL_LETTER, true));
  grid.appendChild(letterMini);

  theEnd.addEventListener("click", () => {
    playClick();
    overlay.classList.remove("hidden");
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  });

  closeBtn.addEventListener("click", () => {
    playClick();
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => overlay.classList.add("hidden"),
    });
  });
}

function openReadOnly(text) {
  const el = document.createElement("div");
  el.className = "wish-card open visible";
  el.style.zIndex = "95";
  el.textContent = text;
  document.body.appendChild(el);
  gsap.fromTo(el, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.35 });
  el.addEventListener("click", () => {
    gsap.to(el, { opacity: 0, scale: 0.92, duration: 0.25, onComplete: () => el.remove() });
  });
}
