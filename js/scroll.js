/* =========================================================
   Page load-in animation.

   The cake + candles are just there from the start (no
   animation on them). The "happy birthday" banner is the only
   thing that animates in -- it drifts down into place from
   above the top of the screen like a falling balloon: no
   opacity fade (it's fully visible the whole way down), with
   no sway, just a straight drop.
   ========================================================= */

export function initScroll() {
  const hbdSign = document.querySelector(".hbd-sign");
  if (!hbdSign) return;

  gsap.from(hbdSign, {
    y: "-120%",
    duration: 1.7,
    ease: "power1.in", // starts slow, picks up speed like it's actually falling
  });
}
