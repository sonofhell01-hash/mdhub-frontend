import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { SyncItem, SyncSummary } from "../../types";

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

export function SyncPanel() {
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [items, setItems] = useState<SyncItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isCentralApi = !/127\.0\.0\.1|localhost/i.test(api.baseUrl);
  const [message, setMessage] = useState(
    isCentralApi
      ? "Servidor central conectado. Esta fila mostra eventos centralizados."
      : "Fila local pronta."
  );

  async function refresh() {
    const data = await api.syncPending();
    setSummary(data.summary);
    setItems(data.items);
    setMessage(
      isCentralApi
        ? "Servidor central conectado. Esta fila mostra eventos centralizados."
        : data.summary.hub_configurado
          ? "HUB central configurado. Pendencias locais podem ser sincronizadas."
          : "HUB central nao configurado. A fila ficou em contingencia local; isso nao bloqueia validar/enviar documentos pelo MidiaSimples."
    );
  }

  async function runSync() {
    if (isCentralApi) {
      await refresh();
      return;
    }
    setLoading(true);
    try {
      const result = await api.syncRun();
      setSummary(result.summary);
      setMessage(
        result.mode === "local_contingency"
          ? "HUB central nao configurado. A fila ficou em contingencia local; isso nao bloqueia validar/enviar documentos pelo MidiaSimples."
          : `Sincronizacao executada: ${result.synced} enviados, ${result.failed} erro(s).`
      );
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao sincronizar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch((err) => setMessage(err instanceof Error ? err.message : "Falha ao carregar sync."));
  }, []);

  return (
    <section className="sync-panel">
      <div className="sync-header">
        <div>
          <span className="section-kicker">{isCentralApi ? "Servidor central" : "Offline e Sync"}</span>
          <h2>{isCentralApi ? "Fila central" : "Fila de contingencia"}</h2>
        </div>
        <button onClick={runSync} disabled={loading}>
          {loading ? "Sincronizando..." : isCentralApi ? "Atualizar fila" : "Forcar sync"}
        </button>
      </div>

      <div className="sync-stats">
        <strong>{summary?.pendente ?? "--"}</strong>
        <span>Pendentes</span>
        <strong>{summary?.sincronizado ?? "--"}</strong>
        <span>Sincronizados</span>
        <strong>{summary?.erro ?? "--"}</strong>
        <span>Erros</span>
      </div>

      <p className="sync-message">{message}</p>

      <div className="sync-list">
        {items.length === 0 ? (
          <span className="empty-sync">{isCentralApi ? "Nenhum evento central pendente." : "Nenhuma pendencia local."}</span>
        ) : (
          items.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.tipo}</strong>
                <span>#{item.id} · {formatDate(item.created_at)}</span>
              </div>
              <small className={`sync-badge ${item.status}`}>{item.status}</small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
