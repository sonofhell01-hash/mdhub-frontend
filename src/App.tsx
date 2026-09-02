import { useState } from "react";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { clearSession, loadSession, saveSession } from "./store/session";
import type { Technician } from "./types";

export default function App() {
  const [session, setSession] = useState(loadSession);

  function handleLogin(email: string, technician: Technician | null) {
    const next = { email, technician };
    saveSession(next);
    setSession(next);
  }

  function handleLogout() {
    clearSession();
    setSession({ email: "", technician: null });
  }

  if (!session.technician) {
    return <LoginPage initialEmail={session.email} onLogin={handleLogin} />;
  }

  return <HomePage technician={session.technician} onLogout={handleLogout} />;
}
