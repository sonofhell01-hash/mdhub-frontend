import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { api } from "../../services/api";
import type { DocumentType, NocMeResponse, NocModule, NocModuleState, NocOverviewResponse, Technician } from "../../types";

// Ordem de exibicao dos modulos - casa com `NOC_MODULES` em
// src/services/noc/overview.py no backend.
const MODULE_ORDER: DocumentType[] = [
  "rat",
  "laudo",
  "concessao",
  "devolucao",
  "emprestimo",
  "substituicao",
  "substituicao_headset",
  "rollout",
  "fechamento"
];

const STATE_LABEL: Record<NocModuleState, string> = {
  synced: "Sincronizado",
  syncing: "Sincronizando",
  stale: "Desatualizado",
  error: "Erro",
  not_synced: "Sem sincronizacao"
};

const STATE_BADGE_CLASS: Record<NocModuleState, string> = {
  synced: "status-badge success",
  syncing: "status-badge pending",
  stale: "status-badge pending",
  error: "status-badge error",
  not_synced: "status-badge muted"
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function moduleValueLabel(module: NocModule) {
  if (module.total !== null) {
    return String(module.total);
  }
  // Nunca mostrar "0" quando o modulo simplesmente nao tem dados
  // sincronizados ainda - ver README_IMPLEMENTACAO_NOC_POR_EQUIPES.md.
  return module.state === "error" ? "Aguardando sincronizacao" : "Sem dados sincronizados";
}

type NocPanelProps = {
  technician: Technician | null;
};

export function NocPanel({ technician }: NocPanelProps) {
  const [me, setMe] = useState<NocMeResponse | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [overview, setOverview] = useState<NocOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .nocMe()
      .then((data) => {
        setMe(data);
        setSelectedTeamId(data.default_team_id);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Falha ao carregar equipes da Central NOC."));
  }, []);

  const refreshOverview = useCallback(() => {
    setLoading(true);
    return api
      .nocOverview(selectedTeamId)
      .then((data) => {
        setOverview(data);
        setMessage(null);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Falha ao carregar a Central NOC."))
      .finally(() => setLoading(false));
  }, [selectedTeamId]);

  useEffect(() => {
    if (!me) {
      return;
    }
    void refreshOverview();
  }, [me, selectedTeamId, refreshOverview]);

  async function syncNow() {
    setSyncing(true);
    try {
      // Sincronizacao MidiaSimples e sob demanda aqui (nunca em polling
      // curto/automatico) - a fonte e uma sessao autenticada por scraping,
      // nao uma API oficial, entao repetir isso a cada poucos segundos
      // arrisca invalidar a sessao ou sobrecarregar o MidiaSimples. Ver
      // conversa com o usuario sobre a cadencia de sincronizacao.
      if (technician?.email) {
        await api.syncMidiaRats(technician.email, false);
      }
      await refreshOverview();
      setMessage("Sincronizacao MidiaSimples executada agora.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao sincronizar com o MidiaSimples.");
    } finally {
      setSyncing(false);
    }
  }

  const canSwitch = Boolean(me?.can_switch_teams) && (me?.teams.length || 0) > 1;

  return (
    <section className="noc-panel">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Central NOC</span>
          <h2>{overview?.team ? overview.team.name : "Sem equipe vinculada"}</h2>
        </div>

        {canSwitch && me && (
          <select
            className="noc-team-select"
            value={selectedTeamId ?? ""}
            onChange={(event) => setSelectedTeamId(Number(event.target.value))}
          >
            {me.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        )}

        {!canSwitch && overview?.team && <small className="status-badge">{overview.team.code}</small>}

        <button className="ghost-action" onClick={syncNow} disabled={syncing || loading}>
          <RefreshCcw size={15} strokeWidth={1.9} className={syncing ? "spin" : undefined} />
          {syncing ? "Sincronizando..." : "Atualizar agora"}
        </button>
      </div>

      {message && <p className="operation-hint">{message}</p>}

      {!overview?.team && !loading && (
        <div className="compact-empty">
          <strong>Nenhuma equipe vinculada</strong>
          <p>Este usuario ainda nao tem uma equipe ativa em usuario_equipes. Fale com um admin da Central NOC.</p>
        </div>
      )}

      {overview?.team && (
        <>
          <aside className="metric-strip" aria-label="Indicadores da equipe">
            <article>
              <strong>{overview.technicians.active}</strong>
              <span>Tecnicos ativos</span>
            </article>
            <article>
              <strong>{overview.alerts.length}</strong>
              <span>Alertas</span>
            </article>
            <article>
              <strong>{overview.scope.role}</strong>
              <span>Perfil NOC</span>
            </article>
          </aside>

          <div className="noc-module-grid">
            {MODULE_ORDER.map((key) => {
              const module = overview.modules[key];
              if (!module) {
                return null;
              }
              const lastSynced = formatDate(module.last_synced_at);
              return (
                <article key={key} className="noc-module-card">
                  <div className="noc-module-card-head">
                    <strong>{module.label}</strong>
                    <small className={STATE_BADGE_CLASS[module.state]}>{STATE_LABEL[module.state]}</small>
                  </div>
                  <div className="noc-module-value">{moduleValueLabel(module)}</div>
                  <div className="noc-module-meta">
                    {module.pending !== null && module.pending > 0 && <span>{module.pending} pendente(s)</span>}
                    {module.failed !== null && module.failed > 0 && <span className="noc-module-failed">{module.failed} falha(s)</span>}
                    {lastSynced && <span>Ultima sync: {lastSynced}</span>}
                    {module.checker_scope === "global" && <span className="noc-module-scope">Fonte global (MidiaSimples)</span>}
                  </div>
                </article>
              );
            })}
          </div>

          {overview.alerts.length > 0 && (
            <div className="module-panel">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Atencao</span>
                  <h2>Alertas da equipe</h2>
                </div>
              </div>
              <ul className="alert-list">
                {overview.alerts.map((alert, index) => (
                  <li key={`${alert.type}-${index}`}>
                    <AlertTriangle size={14} strokeWidth={2} style={{ marginRight: 6, verticalAlign: "middle" }} />
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
