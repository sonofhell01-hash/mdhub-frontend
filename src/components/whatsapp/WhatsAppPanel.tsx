import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import type { Technician, WhatsAppHistoryItem, WhatsAppQueueItem, WhatsAppStatus } from "../../types";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "enviado") {
    return "sent";
  }
  if (normalized === "falha" || normalized === "bloqueado") {
    return "error";
  }
  return "pending";
}

type WhatsAppPanelProps = {
  technician: Technician | null;
};

export function WhatsAppPanel({ technician }: WhatsAppPanelProps) {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [queue, setQueue] = useState<WhatsAppQueueItem[]>([]);
  const [history, setHistory] = useState<WhatsAppHistoryItem[]>([]);
  const [selected, setSelected] = useState<WhatsAppQueueItem | null>(null);
  const [message, setMessage] = useState("Carregando painel WhatsApp.");
  const [documentId, setDocumentId] = useState("");
  const [phone, setPhone] = useState("");
  const [preview, setPreview] = useState("");
  const [batchLimit, setBatchLimit] = useState(1);
  const [reminderLimit, setReminderLimit] = useState(10);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const pendingCount = useMemo(() => status?.queue.pendente ?? 0, [status]);

  async function refresh() {
    try {
      const [statusData, queueData, historyData] = await Promise.all([
        api.whatsappStatus(),
        api.whatsappQueue(),
        api.whatsappHistory()
      ]);
      setStatus(statusData);
      setQueue(queueData.items);
      setHistory(historyData.items);
      setMessage("Painel WhatsApp atualizado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao carregar painel WhatsApp.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function previewDocument() {
    const id = Number(documentId);
    if (!id) {
      setMessage("Informe o ID do documento para gerar a previa.");
      return;
    }
    setBusyAction("preview");
    try {
      const response = await api.whatsappPreviewDocument(id, phone);
      setPreview(response.preview.mensagem);
      setMessage(response.preview.bloqueado ? `Bloqueado: ${response.preview.motivo_bloqueio}` : "Previa gerada.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao gerar preview.");
    } finally {
      setBusyAction(null);
    }
  }

  async function queueDocument() {
    const id = Number(documentId);
    if (!id) {
      setMessage("Informe o ID do documento para criar fila.");
      return;
    }
    setBusyAction("queue");
    try {
      const response = await api.whatsappQueueDocument(id, phone);
      setSelected(response.item);
      setPreview(response.item.mensagem);
      setMessage(`Item #${response.item.id} criado na fila WhatsApp.`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao criar fila WhatsApp.");
    } finally {
      setBusyAction(null);
    }
  }

  async function queueReminders() {
    const confirmed = window.confirm(
      `Criar lembretes de assinatura para ate ${reminderLimit} documento(s) pronto(s) para envio?`
    );
    if (!confirmed) {
      return;
    }
    setBusyAction("reminders");
    try {
      const response = await api.whatsappQueueReminders(reminderLimit, false);
      setMessage(
        `Lembretes preparados: ${response.created} criado(s), ${response.blocked} bloqueado(s), ${response.skipped} ignorado(s).`
      );
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao criar lembretes WhatsApp.");
      await refresh();
    } finally {
      setBusyAction(null);
    }
  }

  async function syncRatReminders() {
    if (!technician?.email) {
      setMessage("Tecnico sem e-mail de sessao para consultar MidiaSimples.");
      return;
    }
    const confirmed = window.confirm(
      "Sincronizar RATs do MidiaSimples e criar fila apenas para documentos nao assinados dos tecnicos permitidos?"
    );
    if (!confirmed) {
      return;
    }
    setBusyAction("sync-rats");
    try {
      const response = await api.whatsappSyncRatReminders(technician.email);
      setMessage(
        `RATs verificadas: ${response.scanned}. Elegiveis: ${response.eligible}. Assinadas: ${response.signed}. Fora do escopo: ${response.out_of_scope}. Fila criada: ${response.queued}.`
      );
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao sincronizar RATs para WhatsApp.");
      await refresh();
    } finally {
      setBusyAction(null);
    }
  }

  async function resetOperational() {
    const confirmed = window.confirm(
      "Zerar fila e historico WhatsApp deste ambiente? Use antes de comecar uma rodada real. Os contatos serao mantidos."
    );
    if (!confirmed) {
      return;
    }
    setBusyAction("reset");
    try {
      const response = await api.whatsappResetOperational(false);
      setSelected(null);
      setPreview("");
      setMessage(
        `Limpeza concluida: ${response.deleted_queue} item(ns) da fila e ${response.deleted_history} historico(s) removidos.`
      );
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao zerar fila WhatsApp.");
      await refresh();
    } finally {
      setBusyAction(null);
    }
  }

  async function sendOne(item: WhatsAppQueueItem) {
    const confirmed = window.confirm(`Enviar agora a mensagem WhatsApp do item #${item.id} para ${item.telefone}?`);
    if (!confirmed) {
      return;
    }
    setBusyAction(`send-${item.id}`);
    try {
      const response = await api.whatsappSendOne(item.id);
      setSelected(response.item);
      setPreview(response.item.mensagem);
      setMessage(`Item #${item.id}: status ${response.item.status}.`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao enviar WhatsApp.");
      await refresh();
    } finally {
      setBusyAction(null);
    }
  }

  async function sendBatch() {
    const confirmed = window.confirm(`Enviar ate ${batchLimit} mensagem(ns) pendente(s) pelo WhatsApp Web do servidor?`);
    if (!confirmed) {
      return;
    }
    setBusyAction("batch");
    try {
      const response = await api.whatsappSendPending(batchLimit);
      setMessage(`Lote processado: ${response.sent} enviada(s), ${response.failed} falha(s), ${response.processed} processada(s).`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao enviar lote WhatsApp.");
      await refresh();
    } finally {
      setBusyAction(null);
    }
  }

  function selectQueueItem(item: WhatsAppQueueItem) {
    setSelected(item);
    setPreview(item.mensagem);
  }

  return (
    <section className="whatsapp-panel">
      <div className="whatsapp-header">
        <div>
          <span className="section-kicker">WhatsApp central</span>
          <h2>Fila e historico de mensagens</h2>
        </div>
        <div className="whatsapp-actions">
          <button onClick={refresh} disabled={busyAction !== null}>Atualizar</button>
          <button onClick={syncRatReminders} disabled={busyAction !== null || !technician?.email}>
            {busyAction === "sync-rats" ? "Sincronizando..." : "Sincronizar RATs"}
          </button>
          <button onClick={resetOperational} disabled={busyAction !== null}>
            {busyAction === "reset" ? "Zerando..." : "Zerar fila"}
          </button>
          <button className="danger-action" onClick={sendBatch} disabled={busyAction !== null || pendingCount === 0}>
            {busyAction === "batch" ? "Enviando..." : "Enviar lote"}
          </button>
        </div>
      </div>

      <p className="whatsapp-message">{message}</p>

      {status && (
        <div className="whatsapp-stats">
          <strong>{status.contacts}</strong><span>contatos</span>
          <strong>{status.queue.pendente}</strong><span>pendentes</span>
          <strong>{status.queue.enviado}</strong><span>enviadas</span>
          <strong>{status.queue.falha}</strong><span>falhas</span>
          <strong>{status.worker.mode}</strong><span>modo</span>
        </div>
      )}

      <div className="whatsapp-grid">
        <article className="whatsapp-card">
          <header>
            <div>
              <span className="section-kicker">Preparar mensagem</span>
              <h3>Preview e fila</h3>
            </div>
          </header>

          <label className="wizard-field compact">
            ID do documento
            <input value={documentId} onChange={(event) => setDocumentId(event.target.value.replace(/\D/g, ""))} placeholder="Ex: 41" />
          </label>

          <label className="wizard-field compact">
            Telefone opcional
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Vazio usa contato do colaborador" />
          </label>

          <div className="whatsapp-button-row">
            <button onClick={previewDocument} disabled={busyAction !== null}>
              {busyAction === "preview" ? "Gerando..." : "Preview"}
            </button>
            <button onClick={queueDocument} disabled={busyAction !== null}>
              {busyAction === "queue" ? "Criando..." : "Criar fila"}
            </button>
          </div>

          <label className="wizard-field compact">
            Limite do lote
            <select value={batchLimit} onChange={(event) => setBatchLimit(Number(event.target.value))}>
              {[1, 2, 3, 5, 10].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="wizard-field compact">
            Lembretes automáticos
            <select value={reminderLimit} onChange={(event) => setReminderLimit(Number(event.target.value))}>
              {[5, 10, 20, 50].map((value) => (
                <option key={value} value={value}>{value} documentos</option>
              ))}
            </select>
          </label>

          <div className="whatsapp-button-row">
            <button onClick={queueReminders} disabled={busyAction !== null}>
              {busyAction === "reminders" ? "Preparando..." : "Criar lembretes"}
            </button>
          </div>
        </article>

        <article className="whatsapp-card">
          <header>
            <div>
              <span className="section-kicker">Preview selecionado</span>
              <h3>{selected ? `Fila #${selected.id}` : "Mensagem"}</h3>
            </div>
          </header>
          <pre className="whatsapp-preview">{preview || "Selecione um item da fila ou gere um preview."}</pre>
        </article>
      </div>

      <div className="whatsapp-grid">
        <article className="whatsapp-card">
          <header>
            <div>
              <span className="section-kicker">Fila operacional</span>
              <h3>Mensagens recentes</h3>
            </div>
          </header>
          <div className="whatsapp-list">
            {queue.map((item) => (
              <div className="whatsapp-row" key={item.id} role="button" tabIndex={0} onClick={() => selectQueueItem(item)}>
                <span>
                  <strong>#{item.id} · Doc {item.documento_id || "-"}</strong>
                  <small>{item.telefone} · {formatDate(item.created_at)} · tentativas {item.tentativas}</small>
                  {item.ultimo_erro && <small className="whatsapp-error">{item.ultimo_erro}</small>}
                </span>
                <span className="whatsapp-row-actions">
                  <small className={`whatsapp-badge ${statusClass(item.status)}`}>{item.status}</small>
                  <button
                    className="mini-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      sendOne(item);
                    }}
                    disabled={busyAction !== null || item.status !== "pendente"}
                  >
                    {busyAction === `send-${item.id}` ? "..." : "Enviar 1"}
                  </button>
                </span>
              </div>
            ))}
            {!queue.length && <p className="empty-sync">Nenhum item na fila.</p>}
          </div>
        </article>

        <article className="whatsapp-card">
          <header>
            <div>
              <span className="section-kicker">Historico</span>
              <h3>Ultimos envios</h3>
            </div>
          </header>
          <div className="whatsapp-list">
            {history.map((item) => (
              <div className="whatsapp-row" key={item.id} role="button" tabIndex={0} onClick={() => setPreview(item.mensagem)}>
                <span>
                  <strong>#{item.id} · Doc {item.documento_id || "-"}</strong>
                  <small>{item.telefone} · {formatDate(item.created_at)}</small>
                  {item.erro && <small className="whatsapp-error">{item.erro}</small>}
                </span>
                <small className={`whatsapp-badge ${statusClass(item.status)}`}>{item.status}</small>
              </div>
            ))}
            {!history.length && <p className="empty-sync">Nenhum historico WhatsApp registrado.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
