/* =========================================================
   Imports the above, boots everything on load.
   ========================================================= */

import { WISHES, LETTER } from "./wishes.js";
import { initSound } from "./sound.js";
import { initCandle } from "./candle.js";
import { initScroll } from "./scroll.js";
import { initCards } from "./cards.js";
import { initGallery } from "./gallery.js";

window.addEventListener("load", () => {
  initSound();
  initCandle();
  initScroll();
  initCards();
  initGallery();
});
