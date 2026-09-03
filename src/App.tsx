import { useState } from "react";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { setAccessToken } from "./services/api";
import { clearSession, loadSession, saveSession } from "./store/session";
import type { Technician } from "./types";

function initialSession() {
  const session = loadSession();
  // Restaura o token JWT em memoria no cliente HTTP logo na inicializacao,
  // para que um reload da pagina nao derrube a autenticacao nas chamadas.
  setAccessToken(session.accessToken);
  return session;
}

export default function App() {
  const [session, setSession] = useState(initialSession);

  function handleLogin(email: string, technician: Technician | null, accessToken: string | null) {
    const next = { email, technician, accessToken };
    setAccessToken(accessToken);
    saveSession(next);
    setSession(next);
  }

  function handleLogout() {
    setAccessToken(null);
    clearSession();
    setSession({ email: "", technician: null, accessToken: null });
  }

  if (!session.technician) {
    return <LoginPage initialEmail={session.email} onLogin={handleLogin} />;
  }

  return <HomePage technician={session.technician} onLogout={handleLogout} />;
}
