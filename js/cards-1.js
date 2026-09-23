import { WISHES } from "./wishes.js";
import { playClick } from "./sound.js";

const cardLayer = document.getElementById("card-layer");
const blackout = document.getElementById("blackout");

const cards = []; // one wish-card element per index, built up front

export function initCards() {
  WISHES.forEach((text, i) => {
    const card = document.createElement("div");
    card.className = "wish-card";
    card.dataset.index = i;
    card.dataset.state = "peeked"; // peeked -> open
    card.textContent = text;
    card.addEventListener("click", () => toggleCard(card));
    cardLayer.appendChild(card);
    cards[i] = card;
  });

  // when a candle is lit (first click), reveal its card + dark/glow
  document.addEventListener("candle:lit", (e) => {
    const { index } = e.detail;
    revealWish(index, e.target);
  });

  // when a candle is blown (second click), hide its card + clear dark/glow
  document.addEventListener("candle:blown", (e) => {
    const { index } = e.detail;
    hideWish(index, e.target);
  });
}

function revealWish(index, candleEl) {
  const card = cards[index];
  card.dataset.state = "peeked";
  card.classList.remove("open");
  card.classList.add("visible");

  gsap.timeline()
    .to(blackout, { opacity: 1, duration: 0.4 })
    .fromTo(
      card,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.15"
    );
}

function hideWish(index, candleEl) {
  const card = cards[index];

  gsap.timeline()
    .to(card, { opacity: 0, y: 40, duration: 0.35 })
    .call(() => {
      card.classList.remove("visible", "open");
      card.dataset.state = "peeked";
    })
    .to(blackout, { opacity: 0, duration: 0.4 }, "-=0.1");
}

function toggleCard(card) {
  if (card.dataset.state === "peeked") {
    playClick();
    card.dataset.state = "open";
    card.classList.add("open");
  } else if (card.dataset.state === "open") {
    playClick();
    card.dataset.state = "peeked";
    card.classList.remove("open");
  }
}

export function getCards() {
  return cards;
}
