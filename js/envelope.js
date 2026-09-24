/* =========================================================
   Envelope: click the corner envelope -> the background blacks
   out and the letter's overview pops up, centered.

   Scroll down on it -> it zooms into a close-up, readable
   version of the same letter, anchored to the top -- keep
   scrolling and it scrolls on down through that (taller,
   zoomed) image so the rest of the letter can be read. Scroll
   back up past its top -> it zooms back out to the overview.

   Click off (background/Escape) while reading steps back to
   the overview first; click off again from the overview closes
   it.
   ========================================================= */

import { playClick } from "./sound.js";

let btn, overlay, note, cover, reader;
let state = "closed"; // closed | cover | reading | busy (mid zoom transition)

export function initEnvelope() {
  btn = document.getElementById("envelope-btn");
  if (!btn) return;

  overlay = document.createElement("div");
  overlay.className = "envelope-overlay";
  document.body.appendChild(overlay);

  note = document.createElement("div");
  note.className = "envelope-note";
  note.innerHTML = `
    <div class="letter-cover">
      <img src="assets/letter%20blur.webp" alt="a letter for olivia" draggable="false">
    </div>
    <div class="letter-reader">
      <div class="letter-reader-inner">
        <img src="assets/letter%20blur.webp" alt="the letter, zoomed in" draggable="false">
      </div>
    </div>
  `;
  document.body.appendChild(note);

  cover = note.querySelector(".letter-cover");
  reader = note.querySelector(".letter-reader");

  gsap.set(cover, { scale: 0.7, opacity: 0 });
  gsap.set(reader, { opacity: 0 });

  btn.addEventListener("click", openLetter);
  overlay.addEventListener("click", clickOff);
  cover.addEventListener("click", (e) => {
    if (e.target.closest("img")) return;
    clickOff();
  });
  reader.addEventListener("click", (e) => {
    if (e.target.closest("img")) return;
    clickOff();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clickOff();
  });

  document.addEventListener("wheel", (e) => {
    if (state === "cover" && e.deltaY > 0) {
      e.preventDefault();
      zoomIn();
    } else if (state === "reading" && e.deltaY < 0 && reader.scrollTop <= 0) {
      e.preventDefault();
      zoomOut();
    }
  }, { passive: false });
}

// clicking off: reading -> zooms back out to the overview; cover ->
// closes the whole letter
function clickOff() {
  if (state === "reading") zoomOut();
  else if (state === "cover") closeLetter();
}

function openLetter() {
  if (state !== "closed") return;
  state = "cover";
  playClick();

  btn.classList.add("is-hidden");
  overlay.classList.add("is-active");
  note.classList.add("is-active");
  note.classList.remove("is-reading");
  reader.scrollTop = 0;
  gsap.set(reader, { opacity: 0 });
  gsap.set(cover, { scale: 0.7, opacity: 0 });

  gsap.timeline()
    .to(overlay, { opacity: 0.9, duration: 0.3, ease: "power1.out" }, 0)
    .to(cover, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.4)" }, 0.05);
}

function zoomIn() {
  if (state !== "cover") return;
  state = "busy";
  note.classList.add("is-reading");
  reader.scrollTop = 0;

  gsap.timeline({ onComplete: () => { state = "reading"; } })
    .to(cover, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0)
    .to(reader, { opacity: 1, duration: 0.5, ease: "power2.inOut" }, 0);
}

function zoomOut() {
  if (state !== "reading") return;
  state = "busy";

  gsap.timeline({
    onComplete: () => {
      note.classList.remove("is-reading");
      state = "cover";
    },
  })
    .to(reader, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0)
    .to(cover, { opacity: 1, duration: 0.4, ease: "power2.inOut" }, 0);
}

function closeLetter() {
  if (state === "closed" || state === "busy") return;

  gsap.timeline({
    onComplete: () => {
      overlay.classList.remove("is-active");
      note.classList.remove("is-active", "is-reading");
      btn.classList.remove("is-hidden");
      state = "closed";
    },
  })
    .to(cover, { scale: 0.7, opacity: 0, duration: 0.25, ease: "power2.in" }, 0)
    .to(reader, { opacity: 0, duration: 0.25, ease: "power2.in" }, 0)
    .to(overlay, { opacity: 0, duration: 0.25, ease: "power1.in" }, 0);
}
