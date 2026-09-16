const THEME_KEY = "theme";

function updateThemeButton() {
  const button = document.getElementById("theme-btn");
  const icon = document.getElementById("theme-icon");
  const label = document.getElementById("theme-label");

  if (!button || !icon || !label) return;

  const isDark = document.body.classList.contains("dark-theme");

  if (isDark) {
    button.classList.add("dark");
    icon.textContent = "☾";
    label.textContent = "DARK MODE";
  } else {
    button.classList.remove("dark");
    icon.textContent = "☀";
    label.textContent = "LIGHT MODE";
  }
}

export function loadTheme() {
  try {
    const theme = localStorage.getItem(THEME_KEY);

    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    updateThemeButton();

  } catch (error) {
    console.error("No se pudo leer el tema:", error);
  }
}

export function setupTheme() {
  const button = document.getElementById("theme-btn");

  if (!button) return;

  updateThemeButton();

  button.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-theme");

    try {
      localStorage.setItem(
        THEME_KEY,
        isDark ? "dark" : "light"
      );
    } catch (error) {
      console.error("No se pudo guardar el tema:", error);
    }

    updateThemeButton();

    const localValue = document.getElementById("local-value");

    if (localValue) {
      localValue.textContent = isDark ? "dark" : "light";
    }
  });
}

export function refreshThemeButton() {
  updateThemeButton();
}