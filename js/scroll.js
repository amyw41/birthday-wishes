/* =========================================================
   Page load-in animation.

   The cake + candles are just there from the start (no
   animation on them). The "happy birthday" banner is the only
   thing that animates in -- it drops down into place from
   above the top of the screen.
   ========================================================= */

export function initScroll() {
  const hbdSign = document.querySelector(".hbd-sign");
  if (!hbdSign) return;

  gsap.from(hbdSign, {
    y: "-110%",
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });
}
