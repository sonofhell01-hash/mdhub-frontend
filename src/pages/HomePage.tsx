import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Handshake,
  Headphones,
  Laptop,
  PackageCheck,
  Repeat2,
  RotateCcw,
  ScrollText
} from "lucide-react";
import { AppShell, type WorkspaceSection } from "../components/layout/AppShell";
import { CheckersPanel } from "../components/checkers/CheckersPanel";
import { DocumentsPanel } from "../components/documents/DocumentsPanel";
import { GlobalSearch } from "../components/search/GlobalSearch";
import { NocPanel } from "../components/noc/NocPanel";
import { OperationalProfile } from "../components/status/OperationalProfile";
import { SyncPanel } from "../components/sync/SyncPanel";
import { SettingsPanel } from "../components/settings/SettingsPanel";
import { WhatsAppPanel } from "../components/whatsapp/WhatsAppPanel";
import { DocumentWizard } from "../components/wizards/DocumentWizard";
import { api } from "../services/api";
import type { DocumentType, FechamentoRatCandidate, OperationalResult, SystemStatus, Technician } from "../types";

type HomePageProps = {
  technician: Technician | null;
  onLogout: () => void;
};

const modules: Array<{ type: DocumentType; title: string; description: string; needsSearch: boolean; icon: typeof FileText }> = [
  { type: "rat", title: "RAT", description: "Atendimento tecnico", needsSearch: true, icon: ClipboardCheck },
  { type: "laudo", title: "Laudo", description: "Analise tecnica", needsSearch: true, icon: FileCheck2 },
  { type: "substituicao", title: "Substituicao", description: "Troca de maquina", needsSearch: true, icon: Repeat2 },
  { type: "substituicao_headset", title: "Sub/headset", description: "Troca de headset", needsSearch: true, icon: Headphones },
  { type: "rollout", title: "Novo/Rollout", description: "Novo colaborador", needsSearch: true, icon: Laptop },
  { type: "concessao", title: "Concessao", description: "Termo de concessao", needsSearch: true, icon: Handshake },
  { type: "devolucao", title: "Devolucao", description: "Retirada de ativo", needsSearch: true, icon: RotateCcw },
  { type: "emprestimo", title: "Emprestimo", description: "Termo temporario", needsSearch: true, icon: PackageCheck },
  { type: "fechamento", title: "Fechamento", description: "Script de RAT", needsSearch: false, icon: ScrollText }
];

const EMPTY_OPERATIONAL_RESULT: OperationalResult = {
  found: true,
  query: "fechamento",
  dados: {},
  alerts: [],
  missing_required: [],
  summary: "Fechamento baseado em RAT sincronizada."
};

export function HomePage({ technician, onLogout }: HomePageProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<OperationalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("operacao");
  const [status, setStatus] = useState<SystemStatus>({
    api: "checking",
    database: "checking"
  });
  const [wizard, setWizard] = useState<DocumentType | null>(null);
  const [latestCreatedRat, setLatestCreatedRat] = useState<FechamentoRatCandidate | null>(null);
  const checkerRunningRef = useRef(false);

  const resultReady = Boolean(result?.found);

  const operationHint = useMemo(() => {
    if (!result) {
      return "Pesquise uma matricula, serial, hostname, nome ou e-mail para liberar as rotinas.";
    }
    if (!result.found) {
      return "Consulta sem ativo consolidado. Revise os dados antes de criar qualquer documento.";
    }
    return "Dados carregados. Escolha a rotina operacional abaixo.";
  }, [result]);

  useEffect(() => {
    Promise.all([api.health(), api.databaseStatus()])
      .then(() => {
        setStatus({ api: "online", database: "online", message: "Backend e banco central respondendo." });
      })
      .catch((err) => setStatus({ api: "offline", database: "offline", message: err instanceof Error ? err.message : "Falha ao conectar." }));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      api.syncRun()
        .then((sync) => {
          if (sync.processed > 0) {
            setStatus((current) => ({
              ...current,
              message: `Sync automatico: ${sync.synced} enviados, ${sync.skipped} em contingencia, ${sync.failed} erro(s).`
            }));
          }
        })
        .catch(() => {
          setStatus((current) => ({ ...current, message: "Sync automatico indisponivel. Eventos continuam locais." }));
        });
    }, 120000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function runAutomaticCheckers() {
      if (checkerRunningRef.current) {
        return;
      }
      checkerRunningRef.current = true;
      try {
        const tasks: Array<Promise<unknown>> = [api.runAutomatosChecker()];
        if (technician?.email) {
          tasks.push(api.runMidiaCheckers(technician.email));
          tasks.push(api.syncMidiaRats(technician.email, true));
        }
        const results = await Promise.allSettled(tasks);
        const failed = results.filter((result) => result.status === "rejected").length;
        setStatus((current) => ({
          ...current,
          message: failed
            ? `Checkers automaticos executados com ${failed} alerta(s). Proxima rodada em 5 min.`
            : "Checkers automaticos executados. Proxima rodada em 5 min."
        }));
      } finally {
        checkerRunningRef.current = false;
      }
    }

    // Roda uma vez imediatamente ao abrir o app (nao so depois de 30 min) -
    // sem isso, um RAT feito no MidiaSimples so aparecia na Central NOC meia
    // hora depois de alguem abrir o HUB.
    void runAutomaticCheckers();

    const timer = window.setInterval(() => {
      void runAutomaticCheckers();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [technician?.email]);

  async function search() {
    const cleaned = query.trim();
    if (cleaned.length < 2) {
      return;
    }
    setLoading(true);
    try {
      const data = await api.operationalSearch(cleaned);
      setResult(data);
      setStatus((current) => ({
        ...current,
        message: data.found ? "Consulta operacional carregada." : "Consulta concluida sem ativo consolidado."
      }));
    } catch (err) {
      setStatus({
        api: "online",
        database: "offline",
        message: err instanceof Error ? err.message : "Falha na consulta operacional."
      });
    } finally {
      setLoading(false);
    }
  }

  function openWizard(type: DocumentType) {
    if (type !== "fechamento" && !result) {
      setStatus((current) => ({ ...current, message: "Pesquise um usuario ou ativo antes de abrir a rotina." }));
      return;
    }
    setWizard(type);
  }

  return (
    <AppShell
      technician={technician}
      status={status}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogout={onLogout}
    >
      {activeSection === "operacao" && (
        <>
          <section className="operation-panel">
            <div>
              <GlobalSearch value={query} loading={loading} onChange={setQuery} onSubmit={search} />
              <p className="operation-hint">{operationHint}</p>
            </div>
            <aside className="metric-strip" aria-label="Indicadores operacionais">
              <article>
                <strong>{result ? 1 : 0}</strong>
                <span>Consulta</span>
              </article>
              <article>
                <strong>{result?.alerts?.length || 0}</strong>
                <span>Alertas</span>
              </article>
              <article>
                <strong>{resultReady ? modules.length : 1}</strong>
                <span>Rotinas</span>
              </article>
            </aside>
          </section>

          <OperationalProfile result={result} />

          <section className="module-panel">
            <div className="section-heading">
              <div>
                <span className="section-kicker">Rotinas</span>
                <h2>Escolha o que vai fazer agora</h2>
              </div>
              <small className={resultReady ? "status-badge success" : "status-badge pending"}>
                {resultReady ? "Liberadas" : "Aguardando consulta"}
              </small>
            </div>

            <div className="module-grid">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.type}
                    className="module-card"
                    disabled={module.needsSearch && !result}
                    onClick={() => openWizard(module.type)}
                  >
                    <span className="module-icon">
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <span className="module-copy">
                      <strong>{module.title}</strong>
                      <small>{module.description}</small>
                    </span>
                    <ArrowRight className="module-arrow" size={17} strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overview-grid" aria-label="Resumo operacional">
            <article className="overview-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Atividade recente</span>
                  <h2>Ultimos movimentos</h2>
                </div>
              </div>
              <div className="compact-empty">
                <strong>Nenhuma atividade exibida</strong>
                <p>As proximas consultas, validacoes e sincronizacoes aparecem aqui.</p>
              </div>
            </article>

            <article className="overview-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Documentos recentes</span>
                  <h2>Fila operacional</h2>
                </div>
                <button className="ghost-action" onClick={() => setActiveSection("documentos")}>
                  Ver todos
                </button>
              </div>
              <div className="compact-empty">
                <strong>Historico em Documentos</strong>
                <p>Acesse a aba Documentos para validar, editar, enviar e acompanhar itens criados.</p>
              </div>
            </article>
          </section>
        </>
      )}

      {activeSection === "noc" && <NocPanel technician={technician} />}
      {activeSection === "documentos" && <DocumentsPanel technician={technician} />}
      {activeSection === "checkers" && (
        <>
          <CheckersPanel technician={technician} />
          <SyncPanel />
        </>
      )}
      {activeSection === "whatsapp" && <WhatsAppPanel technician={technician} />}
      {activeSection === "configuracoes" && <SettingsPanel />}

      {wizard && (result || wizard === "fechamento") && (
        <DocumentWizard
          type={wizard}
          result={result || EMPTY_OPERATIONAL_RESULT}
          technician={technician}
          preferredClosureRat={wizard === "fechamento" ? latestCreatedRat : null}
          onClose={() => setWizard(null)}
          onCreated={(message, createdRat) => {
            if (createdRat) {
              setLatestCreatedRat(createdRat);
            }
            setStatus((current) => ({ ...current, message }));
            setActiveSection("documentos");
          }}
        />
      )}
    </AppShell>
  );
}
