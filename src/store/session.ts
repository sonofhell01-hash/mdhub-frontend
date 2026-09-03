import type { Technician } from "../types";

const STORAGE_KEY = "mdhub.session.v1";

export type SessionState = {
  email: string;
  technician: Technician | null;
  accessToken: string | null;
};

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { email: "", technician: null, accessToken: null };
    }
    const parsed = JSON.parse(raw) as SessionState;
    return {
      email: parsed.email || "",
      technician: parsed.technician || null,
      accessToken: parsed.accessToken || null
    };
  } catch {
    return { email: "", technician: null, accessToken: null };
  }
}

export function saveSession(session: SessionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
