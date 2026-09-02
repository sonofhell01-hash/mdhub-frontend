import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { OperationalDocument, Technician } from "../../types";

type DocumentsPanelProps = {
  technician: Technician | null;
};

type PayloadMap = Record<string, any>;

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

function asMap(value: unknown): PayloadMap {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as PayloadMap) : {};
}

function toText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function documentDisplayId(item: OperationalDocument) {
  return item.midiasimples_id || item.id;
}

function readPayloadAreas(item: OperationalDocument) {
  const root = asMap(item.payload);
  const dados = asMap(root.dados);
  const colaborador = asMap(dados.colaborador || root.colaborador);
  const equipamento = asMap(dados.equipamento_atual || dados.equipamento || root.equipamento_atual || root.equipamento);
  const rat = asMap(dados.rat || root.rat);
  const laudo = asMap(dados.laudo || root.laudo);
  const devolucao = asMap(dados.devolucao || root.devolucao);
  const emprestimo = asMap(dados.emprestimo || root.emprestimo);
  const fechamento = asMap(dados.fechamento || root.fechamento);
  const equipamentoNovo = asMap(dados.equipamento_novo || root.equipamento_novo);

  return {
    root,
    dados,
    colaborador,
    equipamento,
    rat,
    laudo,
    devolucao,
    emprestimo,
    fechamento,
    equipamentoNovo
  };
}

function readClosureScript(item: OperationalDocument) {
  const { dados, fechamento } = readPayloadAreas(item);
  const root = asMap(item.payload);
  const nestedDados = asMap(dados.dados);
  const nestedFechamento = asMap(nestedDados.fechamento);
  const raw =
    fechamento.texto ||
    fechamento.script ||
    nestedFechamento.texto ||
    nestedFechamento.script ||
    dados.fechamento_texto ||
    dados.script ||
    root.fechamento_texto ||
    root.script ||
    "";
  return toText(raw).trim();
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Tauri/Windows can deny the async clipboard API depending on focus.
    }
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "true");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  area.style.top = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  area.setSelectionRange(0, area.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }
  return copied;
}

export function DocumentsPanel({ technician }: DocumentsPanelProps) {
  const [items, setItems] = useState<OperationalDocument[]>([]);
  const [message, setMessage] = useState("Carregando documentos recentes.");
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [syncingSource, setSyncingSource] = useState<"automatos" | "midia" | null>(null);
  const [editing, setEditing] = useState<OperationalDocument | null>(null);
  const [editTicket, setEditTicket] = useState("");
  const [editObservation, setEditObservation] = useState("");
  const [editPayload, setEditPayload] = useState("");
  const [editAdvanced, setEditAdvanced] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState<OperationalDocument | null>(null);
  const [showAllDocuments, setShowAllDocuments] = useState(false);

  const [editMatricula, setEditMatricula] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [editRegional, setEditRegional] = useState("");

  const [editSerial, setEditSerial] = useState("");
  const [editPatrimonio, setEditPatrimonio] = useState("");
  const [editHostname, setEditHostname] = useState("");
  const [editMarca, setEditMarca] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editNf, setEditNf] = useState("");
  const [editCategoria, setEditCategoria] = useState("");

  const [editRatOther, setEditRatOther] = useState("");
  const [editRatProblem, setEditRatProblem] = useState("");
  const [editRatClose, setEditRatClose] = useState("");

  const [editLaudoManagerReg, setEditLaudoManagerReg] = useState("");
  const [editLaudoManagerName, setEditLaudoManagerName] = useState("");
  const [editLaudoManagerEmail, setEditLaudoManagerEmail] = useState("");
  const [editLaudoActions, setEditLaudoActions] = useState("");
  const [editLaudoDefect, setEditLaudoDefect] = useState("");
  const [editLaudoAnalysis, setEditLaudoAnalysis] = useState("");
  const [editLaudoSolution, setEditLaudoSolution] = useState("");

  const [editPersonalEmail, setEditPersonalEmail] = useState("");
  const [editNewSerial, setEditNewSerial] = useState("");
  const [editNewProfile, setEditNewProfile] = useState("");
  const [editNewBrand, setEditNewBrand] = useState("");
  const [editNewModel, setEditNewModel] = useState("");
  const [editNewNf, setEditNewNf] = useState("");
  const [editNewPatrimony, setEditNewPatrimony] = useState("");
  const [editNewHostname, setEditNewHostname] = useState("");
  const [editLoanReturnDate, setEditLoanReturnDate] = useState("");
  const [editClosureText, setEditClosureText] = useState("");
  const [editClosureResult, setEditClosureResult] = useState("");
  const visibleItems = showAllDocuments ? items : items.slice(0, 10);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);

  async function refresh() {
    try {
      const data = await api.documents();
      setItems(data.items);
      setMessage(data.items.length ? "Ultimos documentos operacionais." : "Nenhum documento operacional criado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao carregar documentos.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function send(id: number) {
    setSendingId(id);
    try {
      const response = await api.sendDocument(id);
      setMessage(response.message);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao tentar enviar documento.");
    } finally {
      setSendingId(null);
    }
  }

  async function validate(id: number) {
    setValidatingId(id);
    try {
      const response = await api.validateDocument(id);
      const details = [...response.issues, ...response.warnings].filter(Boolean);
      setMessage(details.length ? `${response.message} ${details.join(" | ")}` : response.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao validar documento.");
    } finally {
      setValidatingId(null);
    }
  }

  async function copyClosureScript(item: OperationalDocument) {
    const script = readClosureScript(item);
    if (!script) {
      setMessage("Fechamento sem texto para copiar. Edite o item e preencha o script operacional.");
      return;
    }
    setCopyingId(item.id);
    try {
      const copied = await copyTextToClipboard(script);
      setMessage(
        copied
          ? `Script de fechamento #${documentDisplayId(item)} copiado para a area de transferencia.`
          : "Nao consegui copiar automaticamente. Clique em Editar e copie o texto exibido."
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Nao consegui copiar automaticamente. Clique em Editar e copie o texto exibido.");
    } finally {
      setCopyingId(null);
    }
  }

  function openClosurePreview(item: OperationalDocument) {
    const script = readClosureScript(item);
    if (!script) {
      setMessage("Fechamento sem texto para preview. Edite o item e preencha o script operacional.");
      return;
    }
    setPreviewing(item);
  }

  function openEdit(item: OperationalDocument) {
    const { dados, colaborador, equipamento, rat, laudo, devolucao, emprestimo, fechamento, equipamentoNovo } = readPayloadAreas(item);
    const ratAtendimento = asMap(rat.atendimento);
    const ratTextos = asMap(rat.textos);
    const laudoGerente = asMap(laudo.gerente);
    const laudoTextos = asMap(laudo.textos);

    setEditing(item);
    setEditTicket(item.numero_chamado || toText(dados.numero_chamado));
    setEditObservation(toText(dados.observacao));
    setEditPayload(JSON.stringify(item.payload || {}, null, 2));
    setEditAdvanced(false);

    setEditMatricula(toText(colaborador.matricula || dados.matricula));
    setEditNome(toText(colaborador.nome || dados.nome));
    setEditEmail(toText(colaborador.email || dados.email));
    setEditTelefone(toText(colaborador.telefone || dados.telefone));
    setEditCargo(toText(colaborador.cargo || dados.cargo));
    setEditRegional(toText(colaborador.regional || dados.regional || "CEO"));

    setEditSerial(toText(equipamento.serial || dados.serial));
    setEditPatrimonio(toText(equipamento.patrimonio || dados.patrimonio));
    setEditHostname(toText(equipamento.hostname || dados.hostname));
    setEditMarca(toText(equipamento.marca || dados.marca));
    setEditModelo(toText(equipamento.modelo || dados.modelo));
    setEditNf(toText(equipamento.nota_fiscal || equipamento.nf || dados.nota_fiscal));
    setEditCategoria(toText(equipamento.categoria || dados.categoria || "NOTEBOOK"));

    setEditRatOther(toText(ratAtendimento.other || rat.outro));
    setEditRatProblem(toText(ratTextos.problem_text || rat.sintoma || dados.sintoma));
    setEditRatClose(toText(ratTextos.close_text || rat.fechamento || dados.fechamento_texto));

    setEditLaudoManagerReg(toText(laudoGerente.matricula || laudo.gerente_matricula));
    setEditLaudoManagerName(toText(laudoGerente.nome || laudo.gerente_nome));
    setEditLaudoManagerEmail(toText(laudoGerente.email || laudo.gerente_email));
    setEditLaudoActions(toText(laudoTextos.actions || laudo.acoes));
    setEditLaudoDefect(toText(laudoTextos.defect || laudo.defeito));
    setEditLaudoAnalysis(toText(laudoTextos.analysis || laudo.analise));
    setEditLaudoSolution(toText(laudoTextos.solution || laudo.solucao));

    setEditPersonalEmail(toText(devolucao.email_pessoal || devolucao.personal_email));
    setEditNewSerial(toText(equipamentoNovo.serial));
    setEditNewProfile(toText(equipamentoNovo.perfil));
    setEditNewBrand(toText(equipamentoNovo.marca));
    setEditNewModel(toText(equipamentoNovo.modelo));
    setEditNewNf(toText(equipamentoNovo.nota_fiscal || equipamentoNovo.nf));
    setEditNewPatrimony(toText(equipamentoNovo.patrimonio));
    setEditNewHostname(toText(equipamentoNovo.hostname));
    setEditLoanReturnDate(toText(emprestimo.data_prevista_devolucao || emprestimo.return_date));
    setEditClosureText(toText(fechamento.texto || fechamento.script));
    setEditClosureResult(toText(fechamento.resultado || fechamento.result));
  }

  function buildEditedPayload() {
    if (!editing) {
      return {};
    }

    const parsedPayload = editAdvanced ? JSON.parse(editPayload || "{}") as PayloadMap : { ...(editing.payload as PayloadMap) };
    const dados = { ...asMap(parsedPayload.dados) };
    const colaborador = {
      ...asMap(dados.colaborador || parsedPayload.colaborador),
      matricula: editMatricula.trim(),
      nome: editNome.trim(),
      email: editEmail.trim(),
      telefone: editTelefone.trim(),
      cargo: editCargo.trim(),
      regional: editRegional.trim() || "CEO"
    };
    const equipamentoAtual = {
      ...asMap(dados.equipamento_atual || dados.equipamento || parsedPayload.equipamento_atual || parsedPayload.equipamento),
      categoria: editCategoria.trim(),
      serial: editSerial.trim().toUpperCase(),
      patrimonio: editPatrimonio.trim(),
      hostname: editHostname.trim().toUpperCase(),
      marca: editMarca.trim(),
      modelo: editModelo.trim(),
      nota_fiscal: editNf.trim()
    };

    dados.colaborador = colaborador;
    dados.equipamento_atual = equipamentoAtual;
    dados.observacao = editObservation;
    parsedPayload.dados = dados;
    parsedPayload.colaborador = colaborador;

    if (editing.tipo === "rat") {
      const rat = { ...asMap(dados.rat || parsedPayload.rat) };
      rat.atendimento = { ...asMap(rat.atendimento), other: editRatOther.trim() };
      rat.textos = {
        ...asMap(rat.textos),
        problem_text: editRatProblem,
        close_text: editRatClose
      };
      dados.rat = rat;
      parsedPayload.rat = rat;
    }

    if (editing.tipo === "laudo") {
      const laudo = { ...asMap(dados.laudo || parsedPayload.laudo) };
      laudo.gerente = {
        ...asMap(laudo.gerente),
        matricula: editLaudoManagerReg.trim(),
        nome: editLaudoManagerName.trim(),
        email: editLaudoManagerEmail.trim()
      };
      laudo.gerente_matricula = editLaudoManagerReg.trim();
      laudo.gerente_nome = editLaudoManagerName.trim();
      laudo.gerente_email = editLaudoManagerEmail.trim();
      laudo.textos = {
        ...asMap(laudo.textos),
        actions: editLaudoActions,
        defect: editLaudoDefect,
        analysis: editLaudoAnalysis,
        solution: editLaudoSolution
      };
      dados.laudo = laudo;
      parsedPayload.laudo = laudo;
    }

    if (editing.tipo === "devolucao") {
      const devolucao = { ...asMap(dados.devolucao || parsedPayload.devolucao), email_pessoal: editPersonalEmail.trim() };
      dados.devolucao = devolucao;
      parsedPayload.devolucao = devolucao;
    }

    if (["substituicao", "concessao", "rollout", "emprestimo"].includes(editing.tipo)) {
      const equipamentoNovo = {
        ...asMap(dados.equipamento_novo || parsedPayload.equipamento_novo),
        serial: editNewSerial.trim().toUpperCase(),
        profile: editNewProfile.trim(),
        perfil: editNewProfile.trim(),
        marca: editNewBrand.trim(),
        modelo: editNewModel.trim(),
        nota_fiscal: editNewNf.trim(),
        patrimonio: editNewPatrimony.trim(),
        hostname: editNewHostname.trim().toUpperCase()
      };
      dados.equipamento_novo = equipamentoNovo;
      parsedPayload.equipamento_novo = equipamentoNovo;
    }

    if (editing.tipo === "emprestimo") {
      const emprestimo = {
        ...asMap(dados.emprestimo || parsedPayload.emprestimo),
        data_prevista_devolucao: editLoanReturnDate.trim(),
        return_date: editLoanReturnDate.trim()
      };
      dados.emprestimo = emprestimo;
      parsedPayload.emprestimo = emprestimo;
    }

    if (editing.tipo === "fechamento") {
      const fechamento = {
        ...asMap(dados.fechamento || parsedPayload.fechamento),
        texto: editClosureText,
        script: editClosureText,
        resultado: editClosureResult,
        result: editClosureResult
      };
      dados.fechamento = fechamento;
      parsedPayload.fechamento = fechamento;
    }

    return parsedPayload;
  }

  async function saveEdit() {
    if (!editing) {
      return;
    }
    setSavingEdit(true);
    try {
      const response = await api.updateDocument(editing.id, {
        numero_chamado: editTicket.trim().toUpperCase() || null,
        status: editing.tipo === "fechamento" ? undefined : "pronto_envio",
        observacao: editObservation,
        payload: buildEditedPayload()
      });
      setMessage(response.message);
      setEditing(null);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao editar documento.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteDocument(item: OperationalDocument) {
    const confirmed = window.confirm(
      `Excluir ${item.tipo.toUpperCase()} #${item.id} e limpar filas de sync/WhatsApp relacionadas?`
    );
    if (!confirmed) {
      return;
    }
    setDeletingId(item.id);
    try {
      const response = await api.deleteDocument(item.id);
      setMessage(
        `${response.message} Sync removido: ${response.deleted_sync}. WhatsApp removido: ${response.deleted_whatsapp_queue}.`
      );
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao excluir documento.");
    } finally {
      setDeletingId(null);
    }
  }

  async function syncAutomatos() {
    setSyncingSource("automatos");
    try {
      const response = await api.runAutomatosChecker();
      const first = response.results?.[0] || {};
      const total = first.records_total || first.operational_snapshot || "";
      const latestCollect = typeof first.latest_collect_date === "string" ? first.latest_collect_date : "";
      const collectText = latestCollect ? ` Ultima coleta: ${latestCollect}.` : "";
      setMessage(`Automatos atualizado. ${total ? `${total} registros processados.` : ""}${collectText}`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao atualizar Automatos.");
    } finally {
      setSyncingSource(null);
    }
  }

  async function syncMidiaSimples() {
    if (!technician?.email) {
      setMessage("Faca login com tecnico MidiaSimples para atualizar a API MidiaSimples.");
      return;
    }
    setSyncingSource("midia");
    try {
      const [response, ratSync] = await Promise.all([
        api.runMidiaCheckers(technician.email),
        api.syncMidiaRats(technician.email, true)
      ]);
      const errors = (response.results || []).filter((item) => item.status === "erro");
      if (errors.length) {
        const first = errors[0];
        const detail = first.detail || "erro nao informado";
        setMessage(
          `MidiaSimples atualizou RATs ate #${ratSync.max_seen_midiasimples_id}, mas falhou em ${errors.length}/${response.processed} modulo(s). ${detail}.`
        );
      } else {
        setMessage(
          `MidiaSimples sincronizado. RATs lidas: ${ratSync.scanned}; novas: ${ratSync.created}; atualizadas: ${ratSync.updated}; maior ID: #${ratSync.max_seen_midiasimples_id}.`
        );
      }
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Falha ao atualizar MidiaSimples.");
    } finally {
      setSyncingSource(null);
    }
  }

  return (
    <section className="documents-panel">
      <div className="documents-header">
        <div>
          <span className="section-kicker">Documentos</span>
          <h2>Historico recente</h2>
        </div>
        <div className="documents-header-actions">
          <button onClick={syncAutomatos} disabled={syncingSource !== null}>
            {syncingSource === "automatos" ? "Atualizando..." : "Atualizar Automatos"}
          </button>
          <button onClick={syncMidiaSimples} disabled={syncingSource !== null || !technician?.email}>
            {syncingSource === "midia" ? "Atualizando..." : "Atualizar MidiaSimples"}
          </button>
          <button onClick={refresh}>Atualizar tela</button>
        </div>
      </div>

      <p>{message}</p>

      <div className="documents-list">
        {visibleItems.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.tipo.toUpperCase()} #{documentDisplayId(item)}</strong>
              <span>{item.numero_chamado || "Sem chamado"} - {formatDate(item.created_at)}</span>
            </div>
            <div className="documents-tags">
              <small>{item.tipo === "fechamento" ? "script" : item.status}</small>
              {item.sync_pendente && <small className="pending">sync</small>}
            </div>
            <div className="documents-actions">
              <button className="mini-action" onClick={() => openEdit(item)} disabled={item.midiasimples_id !== null || item.status === "enviado"}>
                Editar
              </button>
              <button className="mini-action danger-action" onClick={() => deleteDocument(item)} disabled={deletingId === item.id || item.midiasimples_id !== null || item.status === "enviado"}>
                {deletingId === item.id ? "..." : "Excluir"}
              </button>
              {item.tipo === "fechamento" ? (
                <button className="mini-action" onClick={() => openClosurePreview(item)}>
                  Preview
                </button>
              ) : (
                <>
                  <button className="mini-action" onClick={() => validate(item.id)} disabled={validatingId === item.id}>
                    {validatingId === item.id ? "..." : "Validar"}
                  </button>
                  <button className="mini-action" onClick={() => send(item.id)} disabled={sendingId === item.id || item.midiasimples_id !== null}>
                    {sendingId === item.id ? "..." : "Enviar"}
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {items.length > 10 && (
        <div className="documents-more">
          <button onClick={() => setShowAllDocuments((current) => !current)}>
            {showAllDocuments ? "Mostrar somente os 10 mais recentes" : `Mostrar mais ${hiddenCount} documento(s)`}
          </button>
        </div>
      )}

      {previewing && (
        <div className="wizard-backdrop" role="presentation">
          <section className="script-preview-modal" role="dialog" aria-modal="true" aria-label="Preview do fechamento">
            <header className="wizard-header">
              <div>
                <span className="section-kicker">Preview do fechamento</span>
                <h2>FECHAMENTO #{documentDisplayId(previewing)}</h2>
              </div>
              <button onClick={() => setPreviewing(null)}>Fechar</button>
            </header>

            <pre className="closure-script-preview">{readClosureScript(previewing)}</pre>

            <footer className="wizard-actions">
              <button onClick={() => setPreviewing(null)}>Cancelar</button>
              <button className="primary-action" onClick={() => copyClosureScript(previewing)} disabled={copyingId === previewing.id}>
                {copyingId === previewing.id ? "Copiando..." : "Copiar script"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {editing && (
        <div className="wizard-backdrop" role="presentation">
          <section className="edit-modal" role="dialog" aria-modal="true" aria-label="Editar documento">
            <header className="wizard-header">
              <div>
                <span className="section-kicker">Editar documento</span>
                <h2>{editing.tipo.toUpperCase()} #{editing.id}</h2>
              </div>
              <button onClick={() => setEditing(null)}>Fechar</button>
            </header>

            <div className="wizard-two-cols">
              <label className="wizard-field">
                Numero do chamado
                <input value={editTicket} onChange={(event) => setEditTicket(event.target.value.toUpperCase())} placeholder="INC, REQ ou LNR" />
              </label>
              <div className="wizard-field">
                Status
                <input value="PRONTO PARA ENVIO" disabled />
              </div>
            </div>

            <div className="wizard-subpanel">
              <h3>Colaborador</h3>
              <div className="wizard-two-cols">
                <label className="wizard-field compact">Matricula<input value={editMatricula} onChange={(event) => setEditMatricula(event.target.value)} /></label>
                <label className="wizard-field compact">Nome<input value={editNome} onChange={(event) => setEditNome(event.target.value)} /></label>
                <label className="wizard-field compact">E-mail<input value={editEmail} onChange={(event) => setEditEmail(event.target.value)} /></label>
                <label className="wizard-field compact">Telefone<input value={editTelefone} onChange={(event) => setEditTelefone(event.target.value)} /></label>
                <label className="wizard-field compact">Cargo<input value={editCargo} onChange={(event) => setEditCargo(event.target.value)} /></label>
                <label className="wizard-field compact">Regional<input value={editRegional} onChange={(event) => setEditRegional(event.target.value)} /></label>
              </div>
            </div>

            <div className="wizard-subpanel">
              <h3>Equipamento atual</h3>
              <div className="wizard-two-cols">
                <label className="wizard-field compact">Categoria<input value={editCategoria} onChange={(event) => setEditCategoria(event.target.value)} /></label>
                <label className="wizard-field compact">Serial<input value={editSerial} onChange={(event) => setEditSerial(event.target.value.toUpperCase())} /></label>
                <label className="wizard-field compact">Patrimonio<input value={editPatrimonio} onChange={(event) => setEditPatrimonio(event.target.value)} /></label>
                <label className="wizard-field compact">Hostname<input value={editHostname} onChange={(event) => setEditHostname(event.target.value.toUpperCase())} /></label>
                <label className="wizard-field compact">Marca<input value={editMarca} onChange={(event) => setEditMarca(event.target.value)} /></label>
                <label className="wizard-field compact">Modelo<input value={editModelo} onChange={(event) => setEditModelo(event.target.value)} /></label>
                <label className="wizard-field compact">NF<input value={editNf} onChange={(event) => setEditNf(event.target.value)} /></label>
              </div>
            </div>

            {editing.tipo === "rat" && (
              <div className="wizard-subpanel">
                <h3>RAT</h3>
                <label className="wizard-field compact">Campo Outro<input value={editRatOther} onChange={(event) => setEditRatOther(event.target.value)} /></label>
                <label className="wizard-field compact">Sintoma do problema<textarea value={editRatProblem} onChange={(event) => setEditRatProblem(event.target.value)} /></label>
                <label className="wizard-field compact">Relatorio tecnico / fechamento<textarea value={editRatClose} onChange={(event) => setEditRatClose(event.target.value)} /></label>
              </div>
            )}

            {editing.tipo === "laudo" && (
              <div className="wizard-subpanel">
                <h3>Laudo tecnico</h3>
                <div className="wizard-two-cols">
                  <label className="wizard-field compact">Registro gerente<input value={editLaudoManagerReg} onChange={(event) => setEditLaudoManagerReg(event.target.value)} /></label>
                  <label className="wizard-field compact">Nome gerente<input value={editLaudoManagerName} onChange={(event) => setEditLaudoManagerName(event.target.value)} /></label>
                  <label className="wizard-field compact">E-mail gerente<input value={editLaudoManagerEmail} onChange={(event) => setEditLaudoManagerEmail(event.target.value)} /></label>
                </div>
                <label className="wizard-field compact">Acoes executadas<textarea value={editLaudoActions} onChange={(event) => setEditLaudoActions(event.target.value)} /></label>
                <label className="wizard-field compact">Defeito detectado<textarea value={editLaudoDefect} onChange={(event) => setEditLaudoDefect(event.target.value)} /></label>
                <label className="wizard-field compact">Analise conclusiva<textarea value={editLaudoAnalysis} onChange={(event) => setEditLaudoAnalysis(event.target.value)} /></label>
                <label className="wizard-field compact">Solucao<textarea value={editLaudoSolution} onChange={(event) => setEditLaudoSolution(event.target.value)} /></label>
              </div>
            )}

            {editing.tipo === "devolucao" && (
              <div className="wizard-subpanel">
                <h3>Devolucao</h3>
                <label className="wizard-field compact">E-mail pessoal<input value={editPersonalEmail} onChange={(event) => setEditPersonalEmail(event.target.value)} /></label>
              </div>
            )}

            {["substituicao", "concessao", "rollout", "emprestimo"].includes(editing.tipo) && (
              <div className="wizard-subpanel">
                <h3>Equipamento novo / concessao</h3>
                <div className="wizard-two-cols">
                  <label className="wizard-field compact">Serial novo<input value={editNewSerial} onChange={(event) => setEditNewSerial(event.target.value.toUpperCase())} /></label>
                  <label className="wizard-field compact">Perfil<input value={editNewProfile} onChange={(event) => setEditNewProfile(event.target.value)} /></label>
                  <label className="wizard-field compact">Marca<input value={editNewBrand} onChange={(event) => setEditNewBrand(event.target.value)} /></label>
                  <label className="wizard-field compact">Modelo<input value={editNewModel} onChange={(event) => setEditNewModel(event.target.value)} /></label>
                  <label className="wizard-field compact">NF<input value={editNewNf} onChange={(event) => setEditNewNf(event.target.value)} /></label>
                  <label className="wizard-field compact">Patrimonio<input value={editNewPatrimony} onChange={(event) => setEditNewPatrimony(event.target.value)} /></label>
                  <label className="wizard-field compact">Hostname<input value={editNewHostname} onChange={(event) => setEditNewHostname(event.target.value.toUpperCase())} /></label>
                </div>
              </div>
            )}

            {editing.tipo === "emprestimo" && (
              <div className="wizard-subpanel">
                <h3>Emprestimo</h3>
                <label className="wizard-field compact">Data prevista de devolucao<input value={editLoanReturnDate} onChange={(event) => setEditLoanReturnDate(event.target.value)} placeholder="dd/mm/aaaa" /></label>
              </div>
            )}

            {editing.tipo === "fechamento" && (
              <div className="wizard-subpanel">
                <h3>Fechamento operacional</h3>
                <label className="wizard-field compact">Texto de fechamento<textarea value={editClosureText} onChange={(event) => setEditClosureText(event.target.value)} /></label>
                <label className="wizard-field compact">Resultado<textarea value={editClosureResult} onChange={(event) => setEditClosureResult(event.target.value)} /></label>
              </div>
            )}

            <label className="wizard-field">
              Observacao operacional
              <textarea value={editObservation} onChange={(event) => setEditObservation(event.target.value)} />
            </label>

            <label className="wizard-check">
              <input type="checkbox" checked={editAdvanced} onChange={(event) => setEditAdvanced(event.target.checked)} />
              Modo avancado: editar JSON completo
            </label>

            {editAdvanced && (
              <label className="wizard-field">
                Documento completo (JSON)
                <textarea
                  className="payload-editor"
                  value={editPayload}
                  onChange={(event) => setEditPayload(event.target.value)}
                  spellCheck={false}
                />
              </label>
            )}

            <footer className="wizard-actions">
              <button onClick={() => setEditing(null)}>Cancelar</button>
              <button className="primary-action" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
