export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(
    ".cake-wrap",
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#hero",
        start: "top 85%",
        once: true,
      },
    }
  );

  const theEnd = document.getElementById("the-end");

  window.addEventListener("candles:all-blown", () => {
    theEnd.classList.remove("hidden");
    gsap.fromTo(theEnd, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}
