import { playClick, playBlow } from "./sound.js";

const PALETTE = [
  "#e07a7a", "#e0b17a", "#e0d97a", "#a7e07a", "#7ae0b1",
  "#7ac9e0", "#7a8ee0", "#b17ae0", "#e07ac9", "#e0a17a",
];

const TOTAL = 19;
let blownCount = 0;

/**
 * Creates one candle element for the given wish index.
 * Dispatches bubbling custom events on the element:
 *  - "candle:lit"   detail: { index }   — first click, wish should reveal
 *  - "candle:blown" detail: { index }   — second click, wish should hide/collect
 */
export function createCandle(index) {
  const color = PALETTE[index % PALETTE.length];
  const el = document.createElement("div");
  el.className = "candle";
  el.dataset.index = index;
  el.dataset.state = "idle"; // idle -> lit-clicked -> blown
  el.style.setProperty("--candle-color", color);
  el.innerHTML = `<div class="flame"></div><div class="wick"></div>`;

  el.addEventListener("click", () => {
    const state = el.dataset.state;

    if (state === "idle") {
      playClick();
      el.dataset.state = "lit-clicked";
      el.classList.add("lit-clicked");
      el.dispatchEvent(new CustomEvent("candle:lit", { bubbles: true, detail: { index } }));
      return;
    }

    if (state === "lit-clicked") {
      playBlow();
      el.dataset.state = "blown";
      el.classList.remove("lit-clicked");
      el.classList.add("blown");
      blownCount++;
      el.dispatchEvent(new CustomEvent("candle:blown", { bubbles: true, detail: { index } }));

      if (blownCount === TOTAL) {
        window.dispatchEvent(new CustomEvent("candles:all-blown"));
      }
      return;
    }
    // already blown, ignore further clicks
  });

  return el;
}

export function getBlownCount() {
  return blownCount;
}

export function getTotalCandles() {
  return TOTAL;
}
