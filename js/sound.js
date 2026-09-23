/* =========================================================
   Howler setup, one shared instance per sound.

   Both sounds are created (and start downloading + decoding)
   as soon as initSound() runs on page load, so the first
   hover/click plays instantly instead of waiting on a fetch.

   Browsers keep audio muted until the visitor's first click
   or tap; Howler unlocks it automatically on that gesture.
   ========================================================= */

let clickSound = null;
let blowSound = null;

export function initSound() {
  clickSound = new Howl({
    src: ["assets/click.mp3"],
    preload: true,
    volume: 0.5,
    pool: 4, // a few pre-warmed nodes so overlapping clicks don't queue
  });

  blowSound = new Howl({
    src: ["assets/candle.mp3"],
    preload: true,
    volume: 0.8,
    pool: 4,
  });

  // Chrome/Safari start the Web Audio context "suspended" until a user
  // gesture. Howler unlocks it automatically on the first play() call, but
  // that unlock (resume) itself takes a beat -- which is exactly the delay
  // on that first sound. Kick the resume off on the very first pointerdown
  // anywhere on the page, so by the time a candle is actually clicked the
  // context is already running.
  const unlockAudio = () => {
    if (Howler.ctx && Howler.ctx.state !== "running") {
      Howler.ctx.resume();
    }
    window.removeEventListener("pointerdown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio);
}

// short UI click: only on the mouse click that opens a candle's card
export function playClick() {
  clickSound?.play();
}

// candle blow-out
export function playBlow() {
  blowSound?.play();
}
