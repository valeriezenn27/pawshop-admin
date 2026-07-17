export type Theme = "default" | "light" | "dark";

export const THEME_STORAGE_KEY = "pawshop-theme";
export const THEMES: Theme[] = ["default", "light", "dark"];

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}
