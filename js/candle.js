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

  candle.innerHTML = `
    <div class="flame"></div>
    <div class="wick"></div>
  `;

  const flame = candle.querySelector(".flame");

  function riseUp() {
    if (candle.dataset.state !== "idle") return;
    candle.dataset.state = "hover";
    gsap.to(candle, { y: -14, duration: 0.15, ease: "power2.out" });
  }

  function settleDown() {
    if (candle.dataset.state !== "hover") return;
    candle.dataset.state = "idle";
    gsap.to(candle, { y: 0, duration: 0.15, ease: "power2.out" });
  }

  function lightClick() {
    candle.dataset.state = "lit-clicked";
    gsap.to(candle, { y: -6, scale: 1.2, duration: 0.2, ease: "power2.out" });
    candle.dispatchEvent(
      new CustomEvent("candle:lit-clicked", { bubbles: true, detail: { candle, index } })
    );
    if (typeof onLitClick === "function") onLitClick(candle, index);
  }

  function blowOut() {
    candle.dataset.state = "blown";
    flame.style.willChange = "transform, opacity";
    gsap.to(candle, { y: 0, scale: 1, duration: 0.3, ease: "power2.inOut" });
    gsap.to(flame, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: "power1.in",
      onComplete: () => {
        flame.style.willChange = "auto";
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
    if (state === "idle" || state === "hover") {
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
// cake.png has a lot of transparent padding around the drawn cake — its
// opaque top surface starts about 29% down the image and spans roughly
// x:[0.215, 0.783] (measured previously via a canvas alpha scan), so the
// ring is centered on that visible icing line, not the raw image bounds.
const RING_CENTER_X = 50;
const RING_CENTER_Y = 29;
const RING_RADIUS_X = 27;
const RING_RADIUS_Y = 4;

export function initCandle() {
  const row = document.getElementById("candle-row");
  if (!row) return;

  let blownCount = 0;

  for (let i = 0; i < TOTAL_CANDLES; i++) {
    const angle = (i / TOTAL_CANDLES) * Math.PI * 2 - Math.PI / 2;
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
    gsap.set(candle, { xPercent: -50, yPercent: -100 });

    row.appendChild(candle);
  }
}
