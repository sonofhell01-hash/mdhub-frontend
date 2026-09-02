import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { CheckerState, Technician } from "../../types";

type CheckersPanelProps = {
  technician: Technician | null;
};

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

function statusLabel(state: CheckerState) {
  if (state.status === "ok") {
    return "OK";
  }
  if (state.status === "erro") {
    return "Erro";
  }
  return state.status || "Pendente";
}

function checkerDetail(state: CheckerState) {
  const payload = state.payload || {};
  const latestCollect = typeof payload.latest_collect_date === "string" ? payload.latest_collect_date : null;
  const latestUpdate = typeof payload.latest_update_date === "string" ? payload.latest_update_date : null;

  if (state.fonte === "automatos") {
    return `Ultima leitura: ${formatDate(state.checked_at)} · ultima coleta ${formatDate(latestCollect)} · update ${formatDate(latestUpdate)}`;
  }

  return `Ultima leitura: ${formatDate(state.checked_at)} · cursor ${state.ultimo_cursor || "-"}`;
}

export function CheckersPanel({ technician }: CheckersPanelProps) {
  const [items, setItems] = useState<CheckerState[]>([]);
  const [loading, setLoading] = useState(false);
  const [automatosLoading, setAutomatosLoading] = useState(false);
  const [message, setMessage] = useState("Checkers prontos para acompanhar MidiaSimples e proximas fontes.");

  async function refresh() {
    const data = await api.checkerStates();
    setItems(data.items);
    setMessage(data.items.length ? "Estados recentes dos checkers." : "Nenhum checker executado ainda.");
  }

  async function runCheckers() {
    if (!technician?.email) {
      setMessage("Entre com um tecnico para executar os checkers MidiaSimples.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.runMidiaCheckers(technician.email);
      setMessage(`Checkers executados: ${result.processed} modulo(s).`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao executar checkers.");
    } finally {
      setLoading(false);
    }
  }

  async function runAutomatos() {
    setAutomatosLoading(true);
    try {
      const result = await api.runAutomatosChecker();
      const statusText = result.status === "ok" ? "Automatos verificado." : "Automatos retornou alerta.";
      setMessage(`${statusText} ${result.processed} modulo(s).`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao executar checker Automatos.");
    } finally {
      setAutomatosLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch((err) => setMessage(err instanceof Error ? err.message : "Falha ao carregar checkers."));
  }, []);

  return (
    <section className="checkers-panel">
      <div className="checkers-header">
        <div>
          <span className="section-kicker">Fontes vivas</span>
          <h2>Checkers de integracao</h2>
        </div>
        <div className="checkers-actions">
          <button onClick={refresh} disabled={loading}>Atualizar</button>
          <button onClick={runCheckers} disabled={loading || automatosLoading || !technician?.email}>
            {loading ? "Verificando..." : "Rodar MidiaSimples"}
          </button>
          <button onClick={runAutomatos} disabled={loading || automatosLoading}>
            {automatosLoading ? "Verificando..." : "Rodar Automatos"}
          </button>
        </div>
      </div>

      <p>{message}</p>

      <div className="checkers-list">
        {items.length === 0 ? (
          <span className="empty-sync">Nenhum estado salvo. Rode os checkers apos login no MidiaSimples.</span>
        ) : (
          items.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.fonte.toUpperCase()} / {item.modulo.toUpperCase()}</strong>
                <span>{checkerDetail(item)}</span>
              </div>
              <div className="checker-metrics">
                <span>{item.ultima_contagem} lidos</span>
                <span>{item.total_registros} totais</span>
              </div>
              <small className={`sync-badge ${item.status}`}>{statusLabel(item)}</small>
              {item.ultimo_erro && <p className="checker-error">{item.ultimo_erro}</p>}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
