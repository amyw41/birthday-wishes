const clickSound = new Howl({ src: ["assets/click.mp3"], volume: 0.6, preload: true });
const blowSound  = new Howl({ src: ["assets/candle.mp3"], volume: 0.7, preload: true });

export function playClick() {
  clickSound.play();
}

export function playBlow() {
  blowSound.play();
}
