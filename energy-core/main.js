import { App } from "./src/App.js";

const canvas = document.getElementById("scene");
const app = new App(canvas);
app.start();

// Reveal the canvas once the first real frame has painted, so the viewer
// never sees an unrendered flash before the scene exists.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const boot = document.getElementById("boot");
    if (boot) {
      boot.classList.add("hidden");
      boot.addEventListener("transitionend", () => boot.remove(), { once: true });
    }
  });
});
