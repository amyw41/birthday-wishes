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
let songSound = null;

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

  // the load-in song that plays alongside the balloon rain -- Howler
  // queues this play() and fires it as soon as the audio context
  // unlocks on the visitor's first tap/click, even if that happens a
  // beat after load
  songSound = new Howl({
    src: ["assets/gg-f-king-ez.mp3"],
    preload: true,
    volume: 0.6,
    onloaderror: (id, err) => console.error("song failed to load:", err),
    onplayerror: (id, err) => console.error("song failed to play:", err),
  });

  // Chrome/Safari start the Web Audio context "suspended" until a user
  // gesture, AND will silently re-suspend it again after the tab sits in
  // the background for a while (power saving) -- so this can't be a
  // one-time unlock, it has to keep happening. Kick a resume off on every
  // pointerdown anywhere on the page (resuming an already-running context
  // is a harmless no-op), so by the time a candle is actually clicked the
  // context is already running again.
  const resumeIfSuspended = () => {
    if (Howler.ctx && Howler.ctx.state !== "running") {
      Howler.ctx.resume();
    }
  };
  window.addEventListener("pointerdown", resumeIfSuspended);

  // the other half of "after some time off it": catch it the moment the
  // tab comes back into view, before the visitor even clicks anything, so
  // the resume has a head start instead of racing the first click
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resumeIfSuspended();
  });
}

// belt-and-suspenders: resume right before playing too, in case the
// pointerdown/visibilitychange listeners haven't caught it yet
function resumeIfSuspended() {
  if (Howler.ctx && Howler.ctx.state !== "running") {
    Howler.ctx.resume();
  }
}

// short UI click: only on the mouse click that opens a candle's card
export function playClick() {
  resumeIfSuspended();
  clickSound?.play();
}

// candle blow-out
export function playBlow() {
  resumeIfSuspended();
  blowSound?.play();
}

// load-in song, played once alongside the balloon rain
export function playSong() {
  songSound?.play();
}

// Resuming the raw audio context isn't enough on its own -- Howler
// still does its real "unlock" (which warms up every pooled node) on
// the first actual play() call per sound, and that step is what was
// causing the first candle click to lag. Firing a real, silent
// play()+stop() on each sound during the unlock screen's tap (a
// trusted gesture) does that warm-up right then, so by the time a
// candle is actually clicked it's instant.
export function primeSounds() {
  [clickSound, blowSound].forEach((sound) => {
    if (!sound) return;
    const id = sound.play();
    sound.volume(0, id);
    sound.stop(id);
  });
}
