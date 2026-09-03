import type {
  CheckerRunResponse,
  CheckerStatesResponse,
  DocumentDraftRequest,
  DocumentDraftResponse,
  DocumentDeleteResponse,
  DocumentSendResponse,
  DocumentUpdateRequest,
  DocumentValidationResponse,
  DocumentsResponse,
  FechamentoRatCandidatesResponse,
  MidiaSimplesRatSyncResponse,
  OperationalResult,
  SyncPendingResponse,
  SyncRunResponse,
  SyncSummary,
  Technician,
  WhatsAppHistoryResponse,
  WhatsAppPreviewResponse,
  WhatsAppQueueCreateResponse,
  WhatsAppQueueResponse,
  WhatsAppRatSyncResponse,
  WhatsAppReminderBatchResponse,
  WhatsAppResetResponse,
  WhatsAppSendBatchResponse,
  WhatsAppStatus
} from "../types";

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://10.136.59.60:8766";
const API_BASE_STORAGE_KEY = "mdhubfinal.apiBaseUrl.v1";

// Token JWT do HUB (emitido por /auth/midiasimples/login quando o usuario
// existe no banco). Mantido em memoria: quem persiste entre reloads e o
// App, via store/session.ts + setAccessToken() na inicializacao.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

function normalizeApiBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
}

export function getApiBaseUrl() {
  const saved = window.localStorage.getItem(API_BASE_STORAGE_KEY);
  const normalized = normalizeApiBaseUrl(saved || DEFAULT_API_BASE);
  return normalized;
}

export function setApiBaseUrl(value: string) {
  const normalized = normalizeApiBaseUrl(value);
  window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
  return normalized;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers || {})
    },
    ...init
  });

  if (!response.ok) {
    const text = await response.text();
    let apiMessage = "";
    try {
      const payload = JSON.parse(text) as { detail?: unknown; message?: unknown };
      const detail = payload.detail || payload.message;
      if (typeof detail === "string") {
        apiMessage = detail;
      }
    } catch {
      apiMessage = "";
    }
    throw new Error(apiMessage || text || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get baseUrl() {
    return getApiBaseUrl();
  },

  setBaseUrl(value: string) {
    return setApiBaseUrl(value);
  },

  health() {
    return request<{ status: string; app: string; version: string }>("/health");
  },

  databaseStatus() {
    return request<{ status: string }>("/database/status");
  },

  technicians() {
    return request<Technician[]>("/tecnicos");
  },

  operationalSearch(query: string) {
    return request<OperationalResult>(`/operacional/search?q=${encodeURIComponent(query)}`);
  },

  syncStatus() {
    return request<SyncSummary>("/sync/status");
  },

  syncPending() {
    return request<SyncPendingResponse>("/sync/pending?limit=8");
  },

  syncRun() {
    return request<SyncRunResponse>("/sync/run", { method: "POST" });
  },

  createDocumentDraft(payload: DocumentDraftRequest) {
    return request<DocumentDraftResponse>(`/documents/${payload.tipo}/draft`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  documents() {
    return request<DocumentsResponse>("/documents/?limit=30");
  },

  fechamentoRats(query = "") {
    const params = new URLSearchParams({ limit: "25" });
    if (query.trim()) {
      params.set("q", query.trim());
    }
    return request<FechamentoRatCandidatesResponse>(`/documents/fechamento/rats?${params.toString()}`);
  },

  sendDocument(id: number) {
    return request<DocumentSendResponse>(`/documents/${id}/send`, { method: "POST" });
  },

  validateDocument(id: number) {
    return request<DocumentValidationResponse>(`/documents/${id}/validate-send`);
  },

  updateDocument(id: number, payload: DocumentUpdateRequest) {
    return request<{ status: string; document_id: number; message: string }>(`/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  deleteDocument(id: number) {
    return request<DocumentDeleteResponse>(`/documents/${id}`, { method: "DELETE" });
  },

  checkerStates() {
    return request<CheckerStatesResponse>("/checkers/states");
  },

  runMidiaCheckers(email: string) {
    return request<CheckerRunResponse>(`/checkers/midiasimples/run?email=${encodeURIComponent(email)}`, {
      method: "POST"
    });
  },

  syncMidiaRats(email: string, clearLocal = false) {
    return request<MidiaSimplesRatSyncResponse>("/documents/sync/midiasimples-rats", {
      method: "POST",
      body: JSON.stringify({
        email,
        max_pages: 5,
        page_size: 100,
        clear_local_rats_without_midiasimples_id: clearLocal,
        include_all_technicians: true
      })
    });
  },

  runAutomatosChecker() {
    return request<CheckerRunResponse>("/checkers/automatos/run", {
      method: "POST"
    });
  },

  whatsappStatus() {
    return request<WhatsAppStatus>("/whatsapp/status");
  },

  whatsappQueue(status?: string) {
    const suffix = status ? `?status=${encodeURIComponent(status)}&limit=20` : "?limit=20";
    return request<WhatsAppQueueResponse>(`/whatsapp/queue${suffix}`);
  },

  whatsappHistory() {
    return request<WhatsAppHistoryResponse>("/whatsapp/history?limit=20");
  },

  whatsappPreviewDocument(documentId: number, telefone?: string) {
    return request<WhatsAppPreviewResponse>("/whatsapp/messages/preview-document", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        telefone: telefone?.trim() || null
      })
    });
  },

  whatsappQueueDocument(documentId: number, telefone?: string, force = false) {
    return request<WhatsAppQueueCreateResponse>("/whatsapp/queue", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        telefone: telefone?.trim() || null,
        force
      })
    });
  },

  whatsappQueueReminders(limit: number, force = false) {
    return request<WhatsAppReminderBatchResponse>("/whatsapp/queue/reminders", {
      method: "POST",
      body: JSON.stringify({
        limit,
        include_drafts: false,
        force
      })
    });
  },

  whatsappSyncRatReminders(email: string, maxPages = 30, queueLimit = 200) {
    return request<WhatsAppRatSyncResponse>("/whatsapp/queue/sync-rat-reminders", {
      method: "POST",
      body: JSON.stringify({
        email,
        max_pages: maxPages,
        queue_limit: queueLimit
      })
    });
  },

  whatsappResetOperational(clearDocuments = false) {
    return request<WhatsAppResetResponse>("/whatsapp/reset-operational", {
      method: "POST",
      body: JSON.stringify({
        clear_history: true,
        clear_documents: clearDocuments,
        only_whatsapp: true
      })
    });
  },

  whatsappSendOne(queueId: number) {
    return request<WhatsAppQueueCreateResponse>(`/whatsapp/queue/${queueId}/send`, {
      method: "POST"
    });
  },

  whatsappSendPending(limit: number) {
    return request<WhatsAppSendBatchResponse>("/whatsapp/queue/send-pending", {
      method: "POST",
      body: JSON.stringify({ limit })
    });
  },

  midiaLogin(email: string, password: string, remember = true) {
    return request<{
      authenticated: boolean;
      technician_known: boolean;
      technician: Technician | null;
      user_name?: string | null;
      access_token?: string | null;
      token_type?: string | null;
    }>("/auth/midiasimples/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember })
    });
  }
};
