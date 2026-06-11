"use client";

export type ThemeMode = "dark" | "light";

export const getCurrentThemeMode = (): ThemeMode => {
  if (typeof document === "undefined") {
    return "dark";
  }

  const savedTheme = window.localStorage.getItem("webmaker-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export const applyThemeMode = (theme: ThemeMode): void => {
  if (typeof document === "undefined") {
    return;
  }

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("webmaker-theme", theme);
};
