/* =========================================================
   Envelope: corner button -> centers + blacks out -> the flap
   lifts open on its top hinge -> the note peeks up through the
   gap -> click the note to pull it fully out.

   States: closed -> opening -> peeking -> reading -> closing
   The envelope is two layers cut from the same photo (see
   envelope.css): a "body" (the pocket) and a "flap" (just the
   top triangle), hinged along the top edge. Opening rotates
   the flap back in 3D instead of just fading something out.
   The note is always centered on the envelope's own center
   point (xPercent/yPercent -50, set once); only its extra `y`
   offset (a percentage of its OWN height, so it scales with
   whatever size it currently is) and size change between
   states, so it can slide from "hidden behind the envelope"
   to "peeking through the flap gap" to "pulled out and
   enlarged" without ever needing to know pixel values.
   ========================================================= */

import { FINAL_LETTER } from "./wishes.js";
import { playClick } from "./sound.js";

let btn, overlay, stage, note, noteText, flap;
let state = "closed"; // closed | opening | peeking | reading | closing

export function initEnvelope() {
  btn = document.getElementById("envelope-btn");
  if (!btn) return;

  overlay = document.createElement("div");
  overlay.className = "envelope-overlay";
  document.body.appendChild(overlay);

  stage = document.createElement("div");
  stage.className = "envelope-stage";
  stage.innerHTML = `
    <div class="envelope-body"><img class="envelope-img" src="assets/envelope.png" alt=""></div>
    <div class="envelope-note">
      <p class="envelope-note-text"></p>
    </div>
    <div class="envelope-flap"><img class="envelope-img" src="assets/envelope.png" alt=""></div>
  `;
  document.body.appendChild(stage);

  note = stage.querySelector(".envelope-note");
  noteText = stage.querySelector(".envelope-note-text");
  flap = stage.querySelector(".envelope-flap");
  noteText.textContent = FINAL_LETTER;

  gsap.set(stage, { xPercent: -50, yPercent: -50, scale: 0.5, opacity: 0 });
  gsap.set(note, { xPercent: -50, yPercent: -50, y: "70%", opacity: 0 });
  gsap.set(flap, { rotationX: 0, transformPerspective: 900 });

  btn.addEventListener("click", openEnvelope);
  overlay.addEventListener("click", () => {
    if (state === "peeking" || state === "reading") closeEnvelope();
  });
  note.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state === "peeking") pullNoteOut();
    else if (state === "reading") closeEnvelope();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (state === "peeking" || state === "reading")) closeEnvelope();
  });
}

function openEnvelope() {
  if (state !== "closed") return;
  state = "opening";
  playClick();

  btn.classList.add("is-hidden");
  note.classList.remove("is-reading");
  gsap.set(note, { y: "70%", opacity: 0 });
  gsap.set(flap, { rotationX: 0 });

  overlay.classList.add("is-active");
  stage.classList.add("is-active");

  gsap.timeline({ onComplete: () => { state = "peeking"; } })
    .to(overlay, { opacity: 0.9, duration: 0.35, ease: "power1.out" }, 0)
    .to(stage, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, 0.05)
    // the flap lifts open on its top hinge, swinging back and away
    .to(flap, { rotationX: -155, duration: 0.5, ease: "power2.inOut" }, 0.35)
    // the note peeks up through the gap once the flap is out of the way
    .to(note, { y: "-8%", opacity: 1, duration: 0.4, ease: "power2.out" }, 0.65);
}

function pullNoteOut() {
  if (state !== "peeking") return;
  state = "reading";
  playClick();

  note.classList.add("is-reading");
  gsap.to(note, { y: "-42%", duration: 0.55, ease: "power3.out" });
}

function closeEnvelope() {
  if (state === "closed" || state === "closing") return;
  const wasReading = state === "reading";
  state = "closing";

  gsap.timeline({
    onComplete: () => {
      stage.classList.remove("is-active");
      note.classList.remove("is-reading");
      gsap.set(stage, { scale: 0.5, opacity: 0 });
      gsap.set(flap, { rotationX: 0 });
      overlay.classList.remove("is-active");
      btn.classList.remove("is-hidden");
      state = "closed";
    },
  })
    .to(note, { y: "70%", opacity: 0, duration: wasReading ? 0.4 : 0.3, ease: "power2.in" }, 0)
    .to(flap, { rotationX: 0, duration: 0.4, ease: "power2.inOut" }, 0.15)
    .to(stage, { scale: 0.5, opacity: 0, duration: 0.35, ease: "power2.in" }, 0.35)
    .to(overlay, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.4);
}
