import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Technician } from "../types";

const REMEMBERED_LOGIN_KEY = "mdhub.rememberedLogin.v1";
const BACKEND_RETRY_ATTEMPTS = 12;
const BACKEND_RETRY_DELAY_MS = 1000;

type LoginPageProps = {
  initialEmail: string;
  onLogin: (email: string, technician: Technician | null) => void;
};

export function LoginPage({ initialEmail, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState(() => {
    try {
      const raw = localStorage.getItem(REMEMBERED_LOGIN_KEY);
      const saved = raw ? JSON.parse(raw) as { email?: string } : null;
      return saved?.email || initialEmail;
    } catch {
      return initialEmail;
    }
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBERED_LOGIN_KEY);
      const saved = raw ? JSON.parse(raw) as { password?: string; remember?: boolean } : null;
      if (saved?.password) {
        setPassword(saved.password);
      }
      if (typeof saved?.remember === "boolean") {
        setRemember(saved.remember);
      }
    } catch {
      // Ignora configuracao local invalida e segue com login limpo.
    }
  }, []);

  async function loadTechnicians() {
    setError("");

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= BACKEND_RETRY_ATTEMPTS; attempt += 1) {
      try {
        api.setBaseUrl(api.baseUrl);
        await api.health();
        setError("");
        return true;
      } catch (err) {
        lastError = err;
        if (attempt < BACKEND_RETRY_ATTEMPTS) {
          await wait(BACKEND_RETRY_DELAY_MS);
        }
      }
    }

    setError(
      lastError instanceof TypeError
        ? "Nao consegui conectar ao servidor central. Verifique a rede e tente novamente."
          : lastError instanceof Error
            ? lastError.message
          : "Falha ao testar servidor."
    );
    return false;
  }

  useEffect(() => {
    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      api.setBaseUrl(api.baseUrl);
      const response = await api.midiaLogin(email, password, remember);
      if (remember) {
        localStorage.setItem(
          REMEMBERED_LOGIN_KEY,
          JSON.stringify({
            email,
            password,
            remember: true
          })
        );
      } else {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY);
      }
      onLogin(email, response.technician);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="hero-brand">MD</div>
        <h1>MD HUB FINAL</h1>
        <p>Entre com sua conta MidiaSimples para iniciar a operacao.</p>

        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label>
            Senha
            <div className="password-row">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          <label className="inline-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Manter sessao ativa neste computador
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-action" type="submit" disabled={loading}>
            {loading ? "Validando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
