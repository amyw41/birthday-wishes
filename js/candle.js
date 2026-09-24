/* =========================================================
   Candle state machine + hover/click behavior.

   States: idle -> hover -> lit-clicked -> blown
   Stored on candleEl.dataset.state, driven purely by
   transform/opacity so GSAP and CSS never fight over layout
   properties.

   All 19 candles sit on the cake from the start (no docking
   step, they never leave it). Hover lifts a candle slightly
   above its resting spot, blowing it out just stops the
   flame and settles it back down in place.
   ========================================================= */

import { playClick, playBlow } from "./sound.js";

const PALETTE = [
  "#e07a7a", "#e0b17a", "#e0d97a", "#a7e07a", "#7ae0b1",
  "#7ac9e0", "#7a8ee0", "#b17ae0", "#e07ac9", "#e0a17a",
];

export const TOTAL_CANDLES = 19;

export function createCandle(index, { onLitClick, onBlown } = {}) {
  const candle = document.createElement("div");
  candle.className = "candle";
  candle.dataset.state = "idle";
  candle.dataset.index = index;
  candle.style.setProperty("--candle-color", PALETTE[index % PALETTE.length]);
  // candle.png is a fixed pink/white striped illustration -- rotate its hue
  // per candle so the row still reads as 19 differently-colored candles.
  candle.style.setProperty("--hue-rotate", `${(index * 360) / PALETTE.length}deg`);

  candle.innerHTML = `
    <img class="wick" src="assets/candle.png" alt="" draggable="false">
    <div class="flame-wrap"><div class="flame"></div></div>
  `;

  const flameWrap = candle.querySelector(".flame-wrap");
  const flame = candle.querySelector(".flame");

  // hover/lit lifts as a fraction of the candle's height (was -14px / -6px
  // on a 52px candle), so they stay proportional when the cake is resized
  const liftBy = (fraction) => -candle.offsetHeight * fraction;

  function riseUp() {
    if (candle.dataset.state !== "idle") return;
    candle.dataset.state = "hover";
    gsap.to(candle, { y: liftBy(0.27), duration: 0.4, ease: "power2.out" });
  }

  function settleDown() {
    if (candle.dataset.state !== "hover") return;
    candle.dataset.state = "idle";
    gsap.to(candle, { y: 0, duration: 0.4, ease: "power2.out" });
  }

  function lightClick() {
    candle.dataset.state = "lit-clicked";
    gsap.to(candle, { y: liftBy(0.115), scale: 1.2, duration: 0.2, ease: "power2.out" });
    candle.dispatchEvent(
      new CustomEvent("candle:lit-clicked", { bubbles: true, detail: { candle, index } })
    );
    if (typeof onLitClick === "function") onLitClick(candle, index);
  }

  function blowOut() {
    candle.dataset.state = "blown";
    playBlow();
    flameWrap.style.willChange = "transform, opacity";
    gsap.to(candle, { y: 0, scale: 1, duration: 0.3, ease: "power2.inOut" });
    gsap.to(flameWrap, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: "power1.in",
      onComplete: () => {
        flameWrap.style.willChange = "auto";
        candle.dispatchEvent(
          new CustomEvent("candle:blown", { bubbles: true, detail: { candle, index } })
        );
        if (typeof onBlown === "function") onBlown(candle, index);
      },
    });
  }

  candle.addEventListener("mouseenter", riseUp);
  candle.addEventListener("mouseleave", settleDown);

  candle.addEventListener("click", () => {
    const state = candle.dataset.state;
    // click sound only on the click that opens the card;
    // the blow-out click plays just the blow sound (in blowOut)
    if (state === "idle" || state === "hover") {
      playClick();
      lightClick();
    } else if (state === "lit-clicked") {
      blowOut();
    }
    // once blown, clicking does nothing further
  });

  return candle;
}

/* ---------------------------------------------------------
   Builds all 19 candles into #candle-row, arranged in a ring
   that follows the cake's top edge, and tracks how many have
   been blown out, firing "candles:all-blown" on window once
   every one is out (cards.js/gallery.js hook into this in a
   later step).
   --------------------------------------------------------- */
// Re-measured off the current (real-photo) cake.png with a percent grid:
// the swirled tan top forms an oval -- back edge ~6% down, front edge
// ~51% down, left edge ~9%, right edge ~91% across. Re-measure this any
// time cake.png is swapped for a different image.
const RING_CENTER_X = 50;
const RING_CENTER_Y = 32;
const RING_RADIUS_X = 38;
const RING_RADIUS_Y = 23;

// Evenly-spaced angles by ARC LENGTH around the FULL ellipse (a closed
// loop), starting the walk at the very top (angle -PI/2). Two things this
// fixes at once:
//  - a flat ellipse sampled at uniform ANGLES bunches points up near the
//    left/right ends, which is why candles were overlapping there -- arc
//    length spacing walks the actual perimeter instead.
//  - starting exactly at the top (a symmetry axis of the ellipse) and
//    walking the full loop one direction gives a point set that is mirror-
//    symmetric about the vertical center line no matter how many candles
//    there are, so the odd one out lands dead center and the rest pair up
//    evenly left/right.
function evenlySpacedAngles(n, radiusXpx, radiusYpx) {
  const startAngle = -Math.PI / 2;
  const samples = 2000;
  const arc = [0];
  let prevX = radiusXpx * Math.cos(startAngle);
  let prevY = radiusYpx * Math.sin(startAngle);
  for (let i = 1; i <= samples; i++) {
    const t = startAngle + (i / samples) * (Math.PI * 2);
    const x = radiusXpx * Math.cos(t);
    const y = radiusYpx * Math.sin(t);
    arc.push(arc[i - 1] + Math.hypot(x - prevX, y - prevY));
    prevX = x;
    prevY = y;
  }
  const total = arc[samples];
  const angles = [];
  for (let i = 0; i < n; i++) {
    const targetLen = (i / n) * total; // closed loop -- don't repeat the start point
    let lo = 0, hi = samples;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arc[mid] < targetLen) lo = mid + 1;
      else hi = mid;
    }
    angles.push(startAngle + (lo / samples) * (Math.PI * 2));
  }
  return angles;
}

export function initCandle() {
  const row = document.getElementById("candle-row");
  if (!row) return;

  let blownCount = 0;

  const rowRect = row.getBoundingClientRect();
  const radiusXpx = (RING_RADIUS_X / 100) * rowRect.width;
  const radiusYpx = (RING_RADIUS_Y / 100) * rowRect.height;
  const angles = evenlySpacedAngles(TOTAL_CANDLES, radiusXpx, radiusYpx);

  for (let i = 0; i < TOTAL_CANDLES; i++) {
    const angle = angles[i];
    const left = RING_CENTER_X + RING_RADIUS_X * Math.cos(angle);
    const top = RING_CENTER_Y + RING_RADIUS_Y * Math.sin(angle);

    const candle = createCandle(i, {
      onBlown: () => {
        blownCount++;
        if (blownCount === TOTAL_CANDLES) {
          window.dispatchEvent(new CustomEvent("candles:all-blown"));
        }
      },
    });

    candle.style.left = `${left}%`;
    candle.style.top = `${top}%`;
    // candles further "back" on the cake (smaller top%) should render
    // behind ones further "front" (larger top%), so a near candle's flame
    // never gets covered by a farther one it happens to overlap
    candle.style.zIndex = String(Math.round(top * 10));

    row.appendChild(candle); // must be in the DOM before GSAP measures it for xPercent/yPercent
    gsap.set(candle, { xPercent: -50, yPercent: -100 });
  }
}
