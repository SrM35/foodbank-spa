import {
  canPromptInstall,
  promptInstall,
  isStandalone,
} from "./installPrompt.js";

const buttons = () => document.querySelectorAll('[id^="install-btn"]');

function paint() {
  const hide = !canPromptInstall() || isStandalone();
  buttons().forEach((el) => { el.hidden = hide; });
}

export function initInstallButton() {
  paint();
  window.addEventListener("install-state-changed", paint);
  buttons().forEach((el) =>
    el.addEventListener("click", async () => {
      await promptInstall();
      paint();
    })
  );
}