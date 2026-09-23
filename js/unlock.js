/* =========================================================
   Unlock screen.

   Browsers won't let a page play audio with sound until
   there's been a real click/tap on it -- so instead of the
   song racing (and losing) against that restriction, this
   cover sits in front of everything on load and holds it
   back. The one tap on its button is the trusted gesture the
   browser needs, and the callback passed in fires in that
   same instant, so the song and the HBD sign's fall-in both
   start together, every time.
   ========================================================= */

export function initUnlock(onUnlock) {
  const screen = document.createElement("div");
  screen.className = "unlock-screen";
  screen.innerHTML = `
    <p class="unlock-title">happy 19th, olivia</p>
    <button class="unlock-btn" type="button">tap to open</button>
  `;
  document.body.appendChild(screen);

  screen.querySelector(".unlock-btn").addEventListener("click", () => {
    if (typeof onUnlock === "function") onUnlock();

    gsap.to(screen, {
      opacity: 0,
      duration: 0.4,
      ease: "power1.out",
      onComplete: () => screen.remove(),
    });
  });
}
