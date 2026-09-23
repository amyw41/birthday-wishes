/* =========================================================
   Card open/close logic.

   "Click goes dark": when a candle enters lit-clicked (candle.js
   fires "candle:lit-clicked"), the screen dims, a warm glow
   blooms behind the candle, the candle rises to the middle of
   the screen and its wish card rises with it, both settling
   into place together.
   When the candle is blown out ("candle:blown") everything
   reverses: card + glow fade, candle glides back to its spot
   on the cake, then the overlay fades away.

   The candle's own transforms (y/scale/xPercent/yPercent) stay
   owned by candle.js. To rise, the candle is moved into a
   fixed "lift" layer that exactly overlays #candle-row (so its
   left/top % still resolve the same way and nothing jumps),
   and GSAP moves that layer instead of the candle itself.

   Once candle.js reports all 19 out ("candles:all-blown"), the
   "the end" prompt is revealed after the last card has closed
   and the screen is light again.

   The gallery reuses the same overlay + card element in a
   "reading" state (openCardFullscreen): card centered and
   larger, read-only, closed by clicking it or outside it.
   ========================================================= */

import { WISHES } from "./wishes.js";
import { playClick } from "./sound.js";

// How big the candle reads once risen. It rises to the BOTTOM of the
// screen, in front of the (now centered, paper-textured) card, with its
// base allowed to run past the bottom edge -- only the top portion with
// the flame needs to stay on screen, like a candle held up in front of you.
const RISE_SCALE = 3.2;
// RISE_SCALE (and the glow) were tuned on a 52px-tall candle. Candles are
// now sized off the cake, so the rise is normalized against this to keep
// the risen candle + glow the same size on screen whatever the cake size.
const TUNED_CANDLE_H = 52;
const TUNED_GLOW_PX = 320;
const RISE_BASE_Y = 1.08; // fraction of viewport height -- >1 lets the base hang off-screen
const OFFSCREEN_PX = 260; // how far below the viewport the candle/card start from
const CARD_POP_PX = 420; // how far below its resting spot the card starts

let overlay, card, cardText;
let active = null; // { candle, parent, next, lift, glow, liftLeft, liftTop }
let allBlown = false;
let reading = false; // gallery card open full-screen

export function initCards() {
  overlay = document.createElement("div");
  overlay.id = "dark-overlay";
  document.body.appendChild(overlay);

  card = document.createElement("div");
  card.className = "wish-card";
  card.innerHTML = `<p class="wish-text"></p>`;
  cardText = card.querySelector(".wish-text");
  document.body.appendChild(card);
  gsap.set(card, { xPercent: -50, y: CARD_POP_PX, opacity: 0 });

  document.addEventListener("candle:lit-clicked", (e) => {
    const { candle, index } = e.detail;
    if (active) return;
    goDark(candle, index);
  });

  document.addEventListener("candle:blown", (e) => {
    if (!active || e.detail.candle !== active.candle) return;
    comeBack();
  });

  window.addEventListener("candles:all-blown", () => {
    allBlown = true;
    if (!active) showEndPrompt();
  });

  // reading state: click the card or anywhere outside it to close
  overlay.addEventListener("click", closeCardFullscreen);
  card.addEventListener("click", closeCardFullscreen);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCardFullscreen();
  });
}

export function isCardFullscreen() {
  return reading;
}

export function openCardFullscreen(text, { letter = false } = {}) {
  if (active || reading) return;
  reading = true;
  playClick();

  cardText.textContent = text;
  card.classList.add("is-reading");
  card.classList.toggle("is-letter", letter);
  card.style.top = "50%";
  card.scrollTop = 0;
  gsap.set(card, { yPercent: -50, y: 40, opacity: 0 });

  overlay.classList.add("is-active");
  gsap.timeline()
    .to(overlay, { opacity: 0.9, duration: 0.35, ease: "power1.out" }, 0)
    .to(card, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0);
}

function closeCardFullscreen() {
  if (reading !== true) return; // not open, or already closing
  reading = "closing";

  gsap.timeline({
    onComplete: () => {
      card.classList.remove("is-reading", "is-letter");
      card.style.top = "";
      gsap.set(card, { yPercent: 0 });
      overlay.classList.remove("is-active");
      reading = false;
    },
  })
    .to(card, { y: 40, opacity: 0, duration: 0.3, ease: "power2.in" }, 0)
    .to(overlay, { opacity: 0, duration: 0.35, ease: "power1.in" }, 0);
}

function showEndPrompt() {
  const prompt = document.getElementById("end-prompt");
  if (!prompt || prompt.classList.contains("is-visible")) return;
  prompt.classList.add("is-visible");
  gsap.fromTo(prompt,
    { xPercent: -50, opacity: 0, y: 16 },
    { xPercent: -50, opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
}

function goDark(candle, index) {
  const row = candle.parentElement;
  const rowRect = row.getBoundingClientRect();

  // Lift layer: same box as #candle-row, but fixed + above the overlay.
  const lift = document.createElement("div");
  lift.className = "candle-lift";
  Object.assign(lift.style, {
    left: `${rowRect.left}px`,
    top: `${rowRect.top}px`,
    width: `${rowRect.width}px`,
    height: `${rowRect.height}px`,
  });

  // Glow sits at the candle's flame, inside the lift so it travels with it.
  const glow = document.createElement("div");
  glow.className = "candle-glow";
  glow.innerHTML = `<div class="candle-glow-core"></div>`;
  glow.style.left = candle.style.left;
  glow.style.top = candle.style.top;
  const candleH = candle.offsetHeight;
  const riseScale = RISE_SCALE * (TUNED_CANDLE_H / candleH);
  const glowPx = TUNED_GLOW_PX * (candleH / TUNED_CANDLE_H);
  glow.style.width = `${glowPx}px`;
  glow.style.height = `${glowPx}px`;
  glow.style.marginTop = `${-candleH}px`; // base -> flame
  glow.style.setProperty("--glow-k", candleH / TUNED_CANDLE_H);
  lift.appendChild(glow);

  active = {
    candle,
    parent: row,
    next: candle.nextSibling,
    lift,
    glow,
    liftLeft: rowRect.left,
    liftTop: rowRect.top,
  };

  lift.appendChild(candle);
  document.body.appendChild(lift);

  // Candle's base point (xPercent -50 / yPercent -100 puts the base here).
  const anchorX = (parseFloat(candle.style.left) / 100) * rowRect.width;
  const anchorY = (parseFloat(candle.style.top) / 100) * rowRect.height;
  const targetX = window.innerWidth / 2;
  const targetBaseY = window.innerHeight * RISE_BASE_Y;
  const startBaseY = window.innerHeight + OFFSCREEN_PX;

  cardText.textContent = WISHES[index];
  card.style.top = "";
  card.style.bottom = "0px";
  gsap.set(card, { yPercent: 0, y: CARD_POP_PX, opacity: 0 });

  overlay.classList.add("is-active");
  gsap.set(lift, { transformOrigin: `${anchorX}px ${anchorY}px` });
  gsap.set(glow, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });

  // Teleport the lift off-screen below (this happens before the next paint,
  // so nothing visibly jumps), then animate it rising into place. It reads
  // as a fresh candle popping up from the bottom, not the clicked candle
  // sliding across the screen from its spot on the cake. The card rises
  // at the same time, right alongside it.
  gsap.set(lift, {
    x: targetX - (rowRect.left + anchorX),
    y: startBaseY - (rowRect.top + anchorY),
    scale: riseScale,
  });

  gsap.timeline()
    .to(overlay, { opacity: 0.9, duration: 0.35, ease: "power1.out" }, 0)
    .to(lift, {
      y: targetBaseY - (rowRect.top + anchorY),
      duration: 0.85,
      ease: "power3.out",
    }, 0.05)
    .to(card, { y: 0, opacity: 1, duration: 0.85, ease: "power3.out" }, 0.05)
    .to(glow, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, 0.3);
}

function comeBack() {
  const { candle, parent, next, lift, glow } = active;
  // Row may have moved (resize) while dark -- land on where it is now.
  const rowRect = parent.getBoundingClientRect();
  const anchorX = (parseFloat(candle.style.left) / 100) * rowRect.width;
  const anchorY = (parseFloat(candle.style.top) / 100) * rowRect.height;
  const downY = window.innerHeight + OFFSCREEN_PX - (rowRect.top + anchorY);

  // Reverse order from goDark: paper goes down first, then the candle pops
  // back down off-screen, then the lights come back up.
  gsap.timeline({
    onComplete: () => {
      parent.insertBefore(candle, next);
      lift.remove();
      overlay.classList.remove("is-active");
      card.style.bottom = "";
      gsap.set(card, { yPercent: 0 });
      active = null;
      if (allBlown) showEndPrompt();
    },
  })
    .to(card, { y: CARD_POP_PX, opacity: 0, duration: 0.3, ease: "power2.in" }, 0)
    .to(glow, { opacity: 0, scale: 0.6, duration: 0.35, ease: "power2.in" }, 0.05)
    .to(lift, { y: downY, scale: 1, duration: 0.5, ease: "power2.in" }, 0.15)
    .to(overlay, { opacity: 0, duration: 0.35, ease: "power1.in" }, 0.35);
}
