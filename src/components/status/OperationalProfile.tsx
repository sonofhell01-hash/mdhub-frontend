import type { OperationalResult } from "../../types";

type OperationalProfileProps = {
  result: OperationalResult | null;
};

function value(text?: string) {
  return text && text.trim() ? text : "-";
}

export function OperationalProfile({ result }: OperationalProfileProps) {
  if (!result) {
    return (
      <section className="empty-panel">
        <strong>Nenhuma consulta carregada</strong>
        <p>Pesquise matricula, serial ou hostname para montar o perfil operacional.</p>
      </section>
    );
  }

  const dados = result.dados || {};
  const usuarioId = dados.usuario_id ?? dados.midiasimples_id ?? dados.id;

  return (
    <section className="profile-grid">
      <article className="profile-card span-2">
        <div className="section-kicker">Perfil operacional</div>
        <div className="profile-summary">
          <div>
            <h2>{value(dados.nome)}</h2>
            <p>{value(dados.cargo)}</p>
          </div>
          <span className={result.found ? "status-badge success" : "status-badge pending"}>
            {result.found ? "Encontrado" : "Nao encontrado"}
          </span>
        </div>
        <div className="chips">
          <span>ID: {usuarioId ?? "-"}</span>
          <span>{value(dados.matricula)}</span>
          <span>{value(dados.email)}</span>
          <span>{value(dados.telefone)}</span>
        </div>
      </article>

      <article className="profile-card">
        <div className="section-kicker">Equipamento</div>
        <dl>
          <dt>Serial</dt>
          <dd>{value(dados.serial)}</dd>
          <dt>Hostname</dt>
          <dd>{value(dados.hostname)}</dd>
          <dt>Marca / Modelo</dt>
          <dd>{value(dados.marca)} / {value(dados.modelo)}</dd>
        </dl>
      </article>

      <article className="profile-card">
        <div className="section-kicker">Ativo</div>
        <dl>
          <dt>Patrimonio</dt>
          <dd>{value(dados.patrimonio)}</dd>
          <dt>Nota fiscal</dt>
          <dd>{value(dados.nota_fiscal)}</dd>
          <dt>Fonte</dt>
          <dd>{value(dados._prefill_source)}</dd>
        </dl>
      </article>

      <article className="profile-card span-2">
        <div className="section-kicker">Alertas</div>
        {result.alerts?.length ? (
          <ul className="alert-list">
            {result.alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        ) : (
          <p>Sem alertas para esta consulta.</p>
        )}
      </article>

      <article className="profile-card span-2">
        <div className="section-kicker">Resumo tecnico</div>
        <pre>{result.summary || "Sem resumo."}</pre>
      </article>
    </section>
  );
}
