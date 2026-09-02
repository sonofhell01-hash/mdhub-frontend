import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PlugZap,
  RefreshCcw,
  Settings,
  UserRound
} from "lucide-react";
import type { SystemStatus, Technician } from "../../types";

export type WorkspaceSection = "operacao" | "documentos" | "integracoes" | "whatsapp" | "sync" | "configuracoes";

const APP_VERSION = "0.2.14";

type AppShellProps = {
  technician: Technician | null;
  status: SystemStatus;
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
  onLogout: () => void;
  children: ReactNode;
};

const sections: Array<{ key: WorkspaceSection; label: string; icon: typeof LayoutDashboard }> = [
  { key: "operacao", label: "Operacional", icon: LayoutDashboard },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "integracoes", label: "Integracoes", icon: PlugZap },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "sync", label: "Sync", icon: RefreshCcw }
];

export function AppShell({ technician, status, activeSection, onSectionChange, onLogout, children }: AppShellProps) {
  const online = status.api === "online" && status.database === "online";
  const currentSection =
    activeSection === "configuracoes"
      ? { key: "configuracoes" as const, label: "Configuracoes", icon: Settings }
      : sections.find((section) => section.key === activeSection) || sections[0];

  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Navegacao principal">
        <div className="rail-brand">
          <div className="rail-logo">MD</div>
          <strong>MD HUB</strong>
        </div>

        <nav className="rail-nav">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                className={activeSection === section.key ? "rail-item active" : "rail-item"}
                title={section.label}
                onClick={() => onSectionChange(section.key)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail-footer">
          <button
            className={activeSection === "configuracoes" ? "rail-item active" : "rail-item"}
            title="Configuracoes"
            onClick={() => onSectionChange("configuracoes")}
          >
            <Settings size={18} strokeWidth={1.8} />
            <span>Configuracoes</span>
          </button>
          <section className="rail-user" aria-label="Usuario conectado">
            <div className="avatar">
              <UserRound size={18} strokeWidth={2} />
            </div>
            <div>
              <strong>{technician?.display_name || "Sem tecnico"}</strong>
              <span>{online ? "Sistema online" : "Contingencia"}</span>
            </div>
          </section>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <section className="page-title">
            <span>{currentSection.label}</span>
            <h1>{currentSection.label === "Operacional" ? "Visao geral do ambiente." : currentSection.label}</h1>
          </section>

          <section className={online ? "status-pill online" : "status-pill warning"} aria-label="Status do sistema">
            <Activity size={16} strokeWidth={2} />
            <span>{online ? "Sistema online" : "Contingencia"}</span>
          </section>

          <span className="app-version">ver.: {APP_VERSION}</span>

          <button className="icon-action" aria-label="Notificacoes">
            <Bell size={18} strokeWidth={1.8} />
          </button>
        </header>

        {children}

        <footer className="activity-bar">
          <span>Atividade</span>
          <p>{status.message || "Pronto para operar."}</p>
          <button className="ghost-action" onClick={onLogout}>
            <LogOut size={16} strokeWidth={1.9} />
            Trocar usuario
          </button>
        </footer>
      </main>
    </div>
  );
}
