import { createCandle, getTotalCandles } from "./candle.js";
import { initCards } from "./cards.js";
import { initScroll } from "./scroll.js";
import { initGallery } from "./gallery.js";

const candleRow = document.getElementById("candle-row");

for (let i = 0; i < getTotalCandles(); i++) {
  candleRow.appendChild(createCandle(i));
}

initCards();
initScroll();
initGallery();
