import { createContext, useContext, useEffect, useState } from "react";

const KEY = "shopease_theme";

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

const getSystem = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getStored = () => {
  try {
    const t = localStorage.getItem(KEY);
    return ["light", "dark", "system"].includes(t) ? t : "system";
  } catch {
    return "system";
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStored);
  const [systemTheme, setSystemTheme] = useState(getSystem);

  // follow the operating system when the user hasn't chosen
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  // apply the class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (value) => {
    setThemeState(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);