/* =========================================================
   Imports the above, boots everything on load.
   ========================================================= */

import { initSound, playSong } from "./sound.js";
import { initCandle } from "./candle.js";
import { initScroll } from "./scroll.js";
import { initCards } from "./cards.js";
import { initGallery } from "./gallery.js";
import { initEnvelope } from "./envelope.js";
import { initUnlock } from "./unlock.js";

// this script tag is `type="module"` at the end of <body>, so the DOM is
// already parsed by the time it runs -- no need to wait for `load`, which
// only fires once every image (cake.png, the envelope art, etc.) has
// finished downloading.
initSound();
initCandle();
initCards();
initGallery();
initEnvelope();

// the HBD sign's fall-in and the song both need a real user gesture to
// fire reliably -- the unlock screen's tap is that gesture, so both start
// together the instant it's tapped, every time
initUnlock(() => {
  initScroll();
  playSong();
});
