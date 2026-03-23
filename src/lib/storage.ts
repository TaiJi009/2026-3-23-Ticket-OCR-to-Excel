const API_KEY_STORAGE = "zhipu_api_key";
const THEME_STORAGE = "ui_theme";

export type ThemeMode = "light" | "dark";

export function readApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? "";
}

export function writeApiKey(value: string): void {
  localStorage.setItem(API_KEY_STORAGE, value.trim());
}

export function readTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function writeTheme(value: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE, value);
}
