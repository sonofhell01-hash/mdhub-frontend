import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

const THEME_KEY = "hubregional.theme";

function storedTheme(): ThemeMode {
  return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
}

export function initializeTheme() {
  applyTheme(storedTheme());
}

export function SettingsPanel() {
  const [theme, setTheme] = useState<ThemeMode>(storedTheme);

  function changeTheme(next: ThemeMode) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <section className="settings-panel">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Preferencias</span>
          <h2>Configuracoes do aplicativo</h2>
        </div>
      </div>

      <article className="settings-group">
        <div className="settings-copy">
          <strong>Aparencia</strong>
          <span>Escolha o tema visual usado neste navegador.</span>
        </div>
        <div className="segmented-control" role="group" aria-label="Tema do aplicativo">
          <button className={theme === "light" ? "active" : ""} onClick={() => changeTheme("light")}>
            <Sun size={16} strokeWidth={1.9} />
            Claro
          </button>
          <button className={theme === "dark" ? "active" : ""} onClick={() => changeTheme("dark")}>
            <Moon size={16} strokeWidth={1.9} />
            Escuro
          </button>
        </div>
      </article>
    </section>
  );
}
