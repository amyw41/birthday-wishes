/* =========================================================
   Gallery button + layout.

   #gallery-btn (under the "the end" prompt, so it shows up
   once all 19 candles are out) opens a full-screen gallery:
   a responsive grid of all 19 wish cards plus the final
   letter card. Clicking a card opens it full-screen through
   cards.js (the same overlay + card used by the candles);
   clicking it again or outside it goes back to the grid.

   Reachable by button only -- nothing here is scroll-driven.
   ========================================================= */

import { WISHES, FINAL_LETTER } from "./wishes.js";
import { openCardFullscreen, isCardFullscreen } from "./cards.js";

let gallery = null;
let lastFocus = null;

export function initGallery() {
  const button = document.getElementById("gallery-btn");
  if (!button) return;

  gallery = buildGallery();
  document.body.appendChild(gallery);

  button.addEventListener("click", openGallery);
  gallery.querySelector(".gallery-close").addEventListener("click", closeGallery);

  document.addEventListener("keydown", (e) => {
    // Esc closes an open card first (cards.js), the gallery on the next press
    if (e.key === "Escape" && gallery.classList.contains("is-open") && !isCardFullscreen()) {
      closeGallery();
    }
  });
}

function buildGallery() {
  const el = document.createElement("div");
  el.id = "gallery";
  el.className = "gallery";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "all the wishes");

  el.innerHTML = `
    <button class="gallery-close" type="button" aria-label="close gallery">&times;</button>
    <h2 class="gallery-title">19 wishes</h2>
    <div class="gallery-grid"></div>
  `;

  const grid = el.querySelector(".gallery-grid");

  WISHES.forEach((wish, i) => {
    grid.appendChild(makeCard(String(i + 1).padStart(2, "0"), wish, false));
  });
  grid.appendChild(makeCard("a letter for you", FINAL_LETTER, true));

  return el;
}

function makeCard(label, text, isLetter) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = isLetter ? "gallery-card is-letter" : "gallery-card";
  card.innerHTML = `
    <span class="gallery-card-label"></span>
    <span class="gallery-card-text"></span>
  `;
  card.querySelector(".gallery-card-label").textContent = label;
  card.querySelector(".gallery-card-text").textContent = text;
  card.addEventListener("click", () => openCardFullscreen(text, { letter: isLetter }));
  return card;
}

function openGallery() {
  if (gallery.classList.contains("is-open")) return;
  lastFocus = document.activeElement;
  gallery.classList.add("is-open");
  gallery.scrollTop = 0;

  gsap.fromTo(gallery, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" });
  gsap.fromTo(gallery.querySelectorAll(".gallery-card"),
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.03, delay: 0.1 });

  gallery.querySelector(".gallery-close").focus({ preventScroll: true });
}

function closeGallery() {
  if (!gallery.classList.contains("is-open")) return;
  gsap.to(gallery, {
    opacity: 0,
    duration: 0.3,
    ease: "power1.in",
    onComplete: () => {
      gallery.classList.remove("is-open");
      lastFocus?.focus?.({ preventScroll: true });
    },
  });
}
