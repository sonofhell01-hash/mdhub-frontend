export type Technician = {
  username: string;
  display_name: string;
  full_name: string;
  midiasimples_id: number;
  email: string;
  active: boolean;
};

export type OperationalResult = {
  found: boolean;
  query: string;
  dados: {
    usuario_id?: number | null;
    midiasimples_id?: number | null;
    id?: number | null;
    matricula?: string;
    nome?: string;
    telefone?: string;
    email?: string;
    cargo?: string;
    hostname?: string;
    marca?: string;
    modelo?: string;
    modelo_tecnico?: string;
    modelo_origem?: string;
    perfil_documental?: string;
    modelo_opcoes?: string[];
    serial?: string;
    patrimonio?: string;
    nota_fiscal?: string;
    categoria?: string;
    _prefill_source?: string;
  };
  automatos?: Record<string, unknown>;
  alerts?: string[];
  missing_required?: string[];
  summary?: string;
};

export type SystemStatus = {
  api: "online" | "offline" | "checking";
  database: "online" | "offline" | "checking";
  message?: string;
};

export type SyncSummary = {
  total: number;
  pendente: number;
  sincronizado: number;
  erro: number;
  by_status: Record<string, number>;
  hub_configurado: boolean;
};

export type SyncItem = {
  id: number;
  usuario_id?: number | null;
  tipo: string;
  status: string;
  tentativas: number;
  ultimo_erro?: string | null;
  created_at?: string | null;
  ultima_tentativa?: string | null;
  payload: Record<string, unknown>;
};

export type SyncPendingResponse = {
  items: SyncItem[];
  summary: SyncSummary;
};

export type SyncRunResponse = {
  status: string;
  mode: string;
  processed: number;
  synced: number;
  failed: number;
  skipped: number;
  summary: SyncSummary;
};

export type DocumentType = "rat" | "laudo" | "devolucao" | "substituicao" | "substituicao_headset" | "concessao" | "emprestimo" | "rollout" | "fechamento";

export type DocumentDraftRequest = {
  tipo: DocumentType;
  numero_chamado?: string;
  usuario_id?: number;
  colaborador?: {
    matricula?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    cargo?: string;
    regional?: string;
  };
  payload: Record<string, unknown>;
  queue_sync: boolean;
  status?: "pronto_envio";
};

export type DocumentDraftResponse = {
  status: string;
  document_id: number;
  sync_id?: number | null;
};

export type OperationalDocument = {
  id: number;
  tipo: DocumentType;
  status: string;
  numero_chamado?: string | null;
  midiasimples_id?: string | null;
  sync_pendente: boolean;
  sync_tentativas: number;
  created_at?: string | null;
  enviado_em?: string | null;
  payload: Record<string, unknown>;
};

export type DocumentsResponse = {
  items: OperationalDocument[];
};

export type MidiaSimplesRatSyncResponse = {
  status: string;
  module: string;
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  out_of_scope: number;
  max_seen_midiasimples_id: number;
  items: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
};

export type DocumentSendResponse = {
  status: string;
  document_id: number;
  message: string;
};

export type DocumentUpdateRequest = {
  numero_chamado?: string | null;
  status?: "pronto_envio";
  observacao?: string;
  payload?: Record<string, unknown>;
};

export type DocumentValidationResponse = {
  status: "ready" | "blocked";
  document_id: number;
  message: string;
  issues: string[];
  warnings: string[];
};

export type FechamentoRatCandidate = {
  document_id: number;
  midiasimples_id?: string | null;
  numero_chamado?: string | null;
  created_at?: string | null;
  status: string;
  responsavel: string;
  colaborador: {
    matricula?: string | null;
    nome?: string | null;
    email?: string | null;
    cargo?: string | null;
  };
  rat: {
    problem_text?: string | null;
    close_text?: string | null;
    other?: string | null;
    signature_status?: string | null;
  };
  suggested_script: string;
};

export type FechamentoRatCandidatesResponse = {
  items: FechamentoRatCandidate[];
  allowed_technicians: string[];
};

export type DocumentDeleteResponse = {
  status: string;
  document_id: number;
  message: string;
  deleted_sync: number;
  deleted_whatsapp_queue: number;
  deleted_whatsapp_history: number;
};

export type CheckerState = {
  id: number;
  fonte: string;
  modulo: string;
  status: string;
  ultimo_cursor?: string | null;
  total_registros: number;
  ultima_contagem: number;
  payload?: Record<string, unknown> | null;
  ultimo_erro?: string | null;
  checked_at?: string | null;
  updated_at?: string | null;
};

export type CheckerStatesResponse = {
  items: CheckerState[];
};

export type CheckerRunResponse = {
  status: string;
  processed: number;
  results: Array<Record<string, unknown>>;
};

export type WhatsAppStatus = {
  status: string;
  worker: {
    mode: string;
    chrome_debug_port: number;
    batch_size: number;
    max_attempts: number;
    send_wait_seconds: number;
    between_messages_seconds: number;
  };
  contacts: number;
  queue: {
    pendente: number;
    bloqueado: number;
    enviado: number;
    falha: number;
  };
  blocked_roles: string[];
};

export type WhatsAppQueueItem = {
  id: number;
  documento_id?: number | null;
  colaborador_id?: number | null;
  usuario_id?: number | null;
  telefone: string;
  tipo_mensagem: string;
  status: string;
  tentativas: number;
  ultimo_erro?: string | null;
  motivo_bloqueio?: string | null;
  agendado_para?: string | null;
  enviado_em?: string | null;
  created_at?: string | null;
  mensagem: string;
  payload?: Record<string, unknown> | null;
};

export type WhatsAppQueueResponse = {
  items: WhatsAppQueueItem[];
};

export type WhatsAppHistoryItem = {
  id: number;
  queue_id?: number | null;
  documento_id?: number | null;
  colaborador_id?: number | null;
  usuario_id?: number | null;
  telefone: string;
  status: string;
  tipo_mensagem: string;
  motivo_bloqueio?: string | null;
  erro?: string | null;
  created_at?: string | null;
  mensagem: string;
  payload?: Record<string, unknown> | null;
};

export type WhatsAppHistoryResponse = {
  items: WhatsAppHistoryItem[];
};

export type WhatsAppPreviewResponse = {
  status: string;
  preview: {
    document_id: number;
    colaborador_id?: number | null;
    nome?: string | null;
    telefone?: string | null;
    tipo_mensagem: string;
    bloqueado: boolean;
    motivo_bloqueio?: string | null;
    mensagem: string;
  };
};

export type WhatsAppQueueCreateResponse = {
  status: string;
  item: WhatsAppQueueItem;
};

export type WhatsAppSendBatchResponse = {
  status: string;
  processed: number;
  sent: number;
  failed: number;
  items: WhatsAppQueueItem[];
};

export type WhatsAppReminderBatchResponse = {
  status: string;
  processed: number;
  created: number;
  blocked: number;
  skipped: number;
  items: Array<Record<string, unknown>>;
  blocked_items: Array<Record<string, unknown>>;
  skipped_items: Array<Record<string, unknown>>;
};

export type WhatsAppRatSyncResponse = {
  status: string;
  scanned: number;
  eligible: number;
  signed: number;
  out_of_scope: number;
  queued: number;
  skipped: number;
  allowed_technicians: string[];
  items: Array<Record<string, unknown>>;
  skipped_items: Array<Record<string, unknown>>;
};

export type WhatsAppResetResponse = {
  status: string;
  deleted_queue: number;
  deleted_history: number;
  deleted_documents: number;
};

// ---------------------------------------------------------------------------
// Central NOC (agregacao por equipe) - ver src/api/routes/noc.py no backend.
// ---------------------------------------------------------------------------

export type NocModuleState = "synced" | "syncing" | "stale" | "error" | "not_synced";

export type NocModule = {
  label: string;
  total: number | null;
  state: NocModuleState;
  checker_scope: "global" | "n/a";
  last_synced_at: string | null;
  pending: number | null;
  failed: number | null;
};

export type NocAlert = {
  type: string;
  module: DocumentType | null;
  message: string;
  email?: string;
};

export type NocTeamRef = {
  id: number;
  name: string;
  code: string;
};

export type NocMeResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    role: "tecnico" | "admin" | "gestor_noc";
  };
  teams: Array<NocTeamRef & { principal: boolean }>;
  default_team_id: number | null;
  can_switch_teams: boolean;
};

export type NocTeamsResponse = {
  items: NocTeamRef[];
};

export type NocOverviewResponse = {
  team: NocTeamRef | null;
  scope: { role: "tecnico" | "admin" | "gestor_noc"; can_switch_teams: boolean };
  technicians: {
    active: number;
    items: Array<{ id: number; nome: string; apelido: string | null; email: string; perfil_noc: string }>;
  };
  modules: Record<DocumentType, NocModule>;
  alerts: NocAlert[];
  generated_at: string;
};

export type NocDocumentSummary = {
  id: number;
  tipo: DocumentType;
  numero_chamado: string | null;
  midiasimples_id: string | null;
  status: string;
  usuario_id: number | null;
  responsavel: string | null;
  sync_pendente: boolean;
  created_at: string | null;
  enviado_em: string | null;
};

export type NocDocumentsResponse = {
  items: NocDocumentSummary[];
  page: number;
  page_size: number;
  total: number;
};

export type NocAlertsResponse = {
  items: NocAlert[];
  generated_at: string;
};
