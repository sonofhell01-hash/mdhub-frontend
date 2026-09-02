import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import type { DocumentType, FechamentoRatCandidate, OperationalDocument, OperationalResult, Technician } from "../../types";
import { DEVOLUCAO_MODES, LAUDO_TEMPLATES } from "./documentTemplates";
import { RAT_TEMPLATES } from "./ratTemplates";

type DocumentWizardProps = {
  type: DocumentType;
  result: OperationalResult;
  technician: Technician | null;
  onClose: () => void;
  onCreated: (message: string, createdRat?: FechamentoRatCandidate) => void;
  preferredClosureRat?: FechamentoRatCandidate | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asText(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function ratCandidateFromDocument(item: OperationalDocument): FechamentoRatCandidate | null {
  if (item.tipo !== "rat") return null;
  const root = asRecord(item.payload);
  const dados = asRecord(root.dados);
  const colaborador = asRecord(root.colaborador || dados.colaborador);
  const tecnico = asRecord(root.tecnico || dados.tecnico);
  const rat = asRecord(root.rat || dados.rat);
  const atendimento = asRecord(rat.atendimento);
  const textos = asRecord(rat.textos);
  const closeText = asText(textos.close_text || rat.close_text);
  return {
    document_id: item.id,
    midiasimples_id: item.midiasimples_id,
    numero_chamado: item.numero_chamado,
    created_at: item.created_at,
    status: item.status,
    responsavel: asText(tecnico.display_name || tecnico.full_name || tecnico.username || tecnico.email) || "Tecnico nao identificado",
    colaborador: {
      matricula: asText(colaborador.matricula) || null,
      nome: asText(colaborador.nome) || null,
      email: asText(colaborador.email) || null,
      cargo: asText(colaborador.cargo) || null
    },
    rat: {
      problem_text: asText(textos.problem_text || rat.problem_text) || null,
      close_text: closeText || null,
      other: asText(atendimento.other || rat.other) || null,
      signature_status: asText(rat.signature_status) || null
    },
    suggested_script: closeText || "RAT localizada. Revise e informe o texto de fechamento."
  };
}

type EvidenceFile = {
  name: string;
  type: string;
  size: number;
  data_url: string;
};

const TITLES: Record<DocumentType, string> = {
  rat: "Criar RAT",
  laudo: "Criar Laudo",
  devolucao: "Criar Devolucao",
  substituicao: "Criar Substituicao",
  substituicao_headset: "Criar Sub/headset",
  concessao: "Criar Concessao",
  emprestimo: "Criar Emprestimo",
  rollout: "Novo Colaborador / Rollout",
  fechamento: "Fechamento Operacional"
};

const ACOMPANHADO_PADRAO = "Luiz Delfino Lisboa (11) 93618-3413, Kauan Mendes de Oliveira (11) 97189-2898";

function value(text?: string) {
  return text && text.trim() ? text : "";
}

function normalizeProfile(profile?: string) {
  return value(profile).toUpperCase().replace("PERFORMACE", "PERFORMANCE").replace(/\s+/g, " ");
}

function isTechnicalModel(model?: string) {
  const text = value(model).toUpperCase();
  return /^(20|21|22)[A-Z0-9]{5,}$/.test(text) || /^LA\d+[A-Z0-9]+$/.test(text);
}

function modelFromProfile(profile?: string) {
  const key = normalizeProfile(profile);
  if (key === "PERFORMANCE" || key === "PERFORMANCE G2") return "T14";
  if (key === "PERFORMANCE G4") return "T14 Gen4";
  if (key === "PERFORMANCE G6") return "T14Gen6";
  return "";
}

function modelFromTechnical(model?: string) {
  const text = value(model).toUpperCase();
  if (text.startsWith("20W")) return "T14";
  if (text.startsWith("21H")) return "T14 Gen4";
  return "";
}

function documentaryModelFromDados(dados: OperationalResult["dados"]) {
  const fromProfile = modelFromProfile(dados.perfil_documental);
  if (fromProfile) return fromProfile;
  if (value(dados.modelo) && !isTechnicalModel(dados.modelo)) return value(dados.modelo);
  return modelFromTechnical(dados.modelo_tecnico || dados.modelo) || "";
}

function normalizePtBrOperationalText(text: string) {
  const replacements: Array<[RegExp, string]> = [
    [/\bnao\b/gi, "não"],
    [/\bapos\b/gi, "após"],
    [/\btecnico\b/gi, "técnico"],
    [/\btecnica\b/gi, "técnica"],
    [/\banalise\b/gi, "análise"],
    [/\bdiagnostico\b/gi, "diagnóstico"],
    [/\bacao\b/gi, "ação"],
    [/\bacoes\b/gi, "ações"],
    [/\bsubstituicao\b/gi, "substituição"],
    [/\bsolicitacao\b/gi, "solicitação"],
    [/\breposicao\b/gi, "reposição"],
    [/\bconfiguracao\b/gi, "configuração"],
    [/\breconfiguracao\b/gi, "reconfiguração"],
    [/\batualizacao\b/gi, "atualização"],
    [/\badequacao\b/gi, "adequação"],
    [/\binicializacao\b/gi, "inicialização"],
    [/\btemporaria\b/gi, "temporária"],
    [/\bfisica\b/gi, "física"],
    [/\bconexao\b/gi, "conexão"],
    [/\bconexoes\b/gi, "conexões"],
    [/\bmemoria\b/gi, "memória"],
    [/\bmaquina\b/gi, "máquina"],
    [/\bmae\b/gi, "mãe"],
    [/\busuario\b/gi, "usuário"],
    [/\btermica\b/gi, "térmica"],
    [/\bverificacao\b/gi, "verificação"],
    [/\bmanutencao\b/gi, "manutenção"],
    [/\bergonomico\b/gi, "ergonômico"],
    [/\bsubstituido\b/gi, "substituído"],
    [/\bsubstituida\b/gi, "substituída"],
    [/\bconcluido\b/gi, "concluído"],
    [/\bconcluida\b/gi, "concluída"],
    [/\bnecessario\b/gi, "necessário"],
    [/\bsaida\b/gi, "saída"],
    [/\bhorario\b/gi, "horário"],
    [/\bantivirus\b/gi, "antivírus"],
    [/\bcorrecao\b/gi, "correção"],
    [/\bavaliacao\b/gi, "avaliação"],
    [/\boperacao\b/gi, "operação"],
    [/\bobservacao\b/gi, "observação"]
  ];

  return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}

function buildRatCloseText(
  template: (typeof RAT_TEMPLATES)[string][number],
  actionText: string,
  technician: Technician | null
) {
  const analyst = technician?.display_name || technician?.full_name || "Analista";
  const problem = normalizePtBrOperationalText(template.problema || "Atendimento técnico realizado.");
  const diagnostico = normalizePtBrOperationalText(template.diagnostico || template.outro || "Análise técnica");
  const causaRaiz = normalizePtBrOperationalText(template.causaRaiz || "Falha validada durante atendimento técnico.");
  const resultado = normalizePtBrOperationalText(template.resultado || "Atendimento concluído.");
  const normalizedActionText = normalizePtBrOperationalText(actionText);

  return normalizePtBrOperationalText([
    "Sintomas:",
    problem,
    "Análise / Diagnóstico:",
    diagnostico,
    `Causa raiz: ${causaRaiz}`,
    "Ação(ões) executada(s):",
    normalizedActionText,
    "Resultado obtido:",
    resultado,
    "Verificado Antivírus: (x) Sim ( ) Não",
    "Verificado SCCM Client: (x) Sim ( ) Não",
    "Eliminação de login administrador local irregular: ( ) Sim (x) Não necessário",
    `Nome do analista: ${analyst}`,
    "Horário de chegada: 09:00",
    "Horário de saída: 19:00",
    `Acompanhado por: ${ACOMPANHADO_PADRAO}`,
    "Atenciosamente."
  ].join("\n"));
}

function dateAfter(days: number) {
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.toISOString().slice(0, 10);
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Tauri/Windows may block the async clipboard API when focus changes.
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

function readFileAsDataUrl(file: File): Promise<EvidenceFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        data_url: String(reader.result || "")
      });
    };
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });
}

export function DocumentWizard({ type, result, technician, onClose, onCreated, preferredClosureRat = null }: DocumentWizardProps) {
  const dados = result.dados || {};
  const usuarioId = dados.usuario_id ?? dados.midiasimples_id ?? dados.id;
  const [manualMatricula, setManualMatricula] = useState(value(dados.matricula));
  const [manualNome, setManualNome] = useState(value(dados.nome));
  const [manualEmail, setManualEmail] = useState(value(dados.email));
  const [manualTelefone, setManualTelefone] = useState(value(dados.telefone));
  const [manualCargo, setManualCargo] = useState(value(dados.cargo));
  const [manualRegional, setManualRegional] = useState("CEO");
  const [manualSerial, setManualSerial] = useState(value(dados.serial));
  const [manualPatrimonio, setManualPatrimonio] = useState(value(dados.patrimonio));
  const [manualHostname, setManualHostname] = useState(value(dados.hostname));
  const [manualMarca, setManualMarca] = useState(value(dados.marca));
  const [manualModelo, setManualModelo] = useState(documentaryModelFromDados(dados));
  const [manualNf, setManualNf] = useState(value(dados.nota_fiscal));
  const [manualCategoria, setManualCategoria] = useState(value(dados.categoria) || "NOTEBOOK");
  const [ticket, setTicket] = useState("");
  const [notes, setNotes] = useState("");
  const [extraSerial, setExtraSerial] = useState("");
  const [ratCategory, setRatCategory] = useState("headset");
  const [ratTemplateIndex, setRatTemplateIndex] = useState(0);
  const [ratSerial, setRatSerial] = useState("");
  const [editTexts, setEditTexts] = useState(false);
  const [manualOther, setManualOther] = useState("");
  const [manualProblem, setManualProblem] = useState("");
  const [manualClose, setManualClose] = useState("");
  const [newMachineProfile, setNewMachineProfile] = useState("PERFORMANCE");
  const [newMachineBrand, setNewMachineBrand] = useState("LENOVO");
  const [newMachineModel, setNewMachineModel] = useState(modelFromProfile("PERFORMANCE"));
  const [newMachineNf, setNewMachineNf] = useState("");
  const [newMachinePatrimony, setNewMachinePatrimony] = useState("");
  const [newMachineHostname, setNewMachineHostname] = useState(value(dados.matricula) ? `NAKRJ${value(dados.matricula)}` : "");
  const [newHeadsetModel, setNewHeadsetModel] = useState("POLY BW - 3220 USB-C");
  const [newHeadsetSerial, setNewHeadsetSerial] = useState("");
  const [loanReturnDate, setLoanReturnDate] = useState(dateAfter(30));
  const [loanLocal, setLoanLocal] = useState("Rio de Janeiro - RJ");
  const [loanEquipmentType, setLoanEquipmentType] = useState("NOTEBOOK");
  const [laudoTemplateIndex, setLaudoTemplateIndex] = useState(3);
  const [laudoUsoInadequado, setLaudoUsoInadequado] = useState(false);
  const [laudoEditTexts, setLaudoEditTexts] = useState(false);
  const [laudoActions, setLaudoActions] = useState("");
  const [laudoDefect, setLaudoDefect] = useState("");
  const [laudoAnalysis, setLaudoAnalysis] = useState("");
  const [laudoSolution, setLaudoSolution] = useState("");
  const [managerRegistration, setManagerRegistration] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerLookupLoading, setManagerLookupLoading] = useState(false);
  const [managerLookupMessage, setManagerLookupMessage] = useState("");
  const [imageNote, setImageNote] = useState("");
  const [laudoImages, setLaudoImages] = useState<EvidenceFile[]>([]);
  const [imageError, setImageError] = useState("");
  const [devolucaoMode, setDevolucaoMode] = useState<"total" | "equipamento" | "manual">("total");
  const [personalEmail, setPersonalEmail] = useState("");
  const [closureText, setClosureText] = useState("");
  const [closureResult, setClosureResult] = useState("CONCLUIDO");
  const [closureRatQuery, setClosureRatQuery] = useState("");
  const [closureRatCandidates, setClosureRatCandidates] = useState<FechamentoRatCandidate[]>([]);
  const [selectedClosureRat, setSelectedClosureRat] = useState<FechamentoRatCandidate | null>(null);
  const [loadingClosureRats, setLoadingClosureRats] = useState(false);
  const [closureRatMessage, setClosureRatMessage] = useState("");
  const [queueSync, setQueueSync] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function changeNewMachineProfile(profile: string) {
    setNewMachineProfile(profile);
    const model = modelFromProfile(profile);
    setNewMachineModel(model);
  }

  const preview = useMemo(
    () => ({
      colaborador: {
        matricula: manualMatricula,
        nome: manualNome,
        email: manualEmail,
        telefone: manualTelefone,
        cargo: manualCargo,
        regional: manualRegional
      },
      equipamento_atual: {
        serial: manualSerial,
        patrimonio: manualPatrimonio,
        hostname: manualHostname,
        marca: manualMarca,
        modelo: manualModelo,
        nota_fiscal: manualNf,
        categoria: manualCategoria
      }
    }),
    [
      manualCargo,
      manualCategoria,
      manualEmail,
      manualHostname,
      manualMarca,
      manualMatricula,
      manualModelo,
      manualNf,
      manualNome,
      manualPatrimonio,
      manualRegional,
      manualSerial,
      manualTelefone
    ]
  );

  const selectedRatTemplate = RAT_TEMPLATES[ratCategory]?.[ratTemplateIndex] || RAT_TEMPLATES.headset[0];
  const selectedLaudoTemplate = LAUDO_TEMPLATES[laudoTemplateIndex] || LAUDO_TEMPLATES[3];
  const selectedDevolucaoMode = DEVOLUCAO_MODES.find((mode) => mode.id === devolucaoMode) || DEVOLUCAO_MODES[0];
  const ratActionText = normalizePtBrOperationalText(selectedRatTemplate.fechamento.replace("{serial}", ratSerial.trim().toUpperCase() || "[SERIAL]"));
  const ratCloseText = ratActionText;
  const ratPayload = {
    atendimento: {
      substituition: "0",
      upgrade: "0",
      notebook: "0",
      desktop: "0",
      printer: "0",
      mobile: "0",
      other: editTexts ? manualOther || selectedRatTemplate.outro : selectedRatTemplate.outro
    },
    textos: {
      problem_text: editTexts ? manualProblem || selectedRatTemplate.problema : selectedRatTemplate.problema,
      close_text: editTexts ? manualClose || ratCloseText : ratCloseText,
      observations: notes
    },
    horario: {
      start_time: "09:00",
      end_time: "19:00"
    },
    validacoes: {
      backup: "0",
      user_profile: "",
      details_1: "",
      details_2: "",
      aim: "1",
      kace: "1",
      software_others: ""
    },
    template: {
      category: ratCategory,
      label: selectedRatTemplate.label,
      headset_serial: ratSerial.trim().toUpperCase() || null
    }
  };
  const laudoPayload = {
    template: selectedLaudoTemplate.label,
    uso_inadequado: laudoUsoInadequado,
    condicao_reparo: selectedLaudoTemplate.condicaoReparo,
    gerente_matricula: managerRegistration.trim(),
    gerente_nome: managerName.trim(),
    gerente_email: managerEmail.trim(),
    gerente: {
      matricula: managerRegistration.trim(),
      nome: managerName.trim(),
      email: managerEmail.trim()
    },
    imagens: {
      observacao: imageNote.trim(),
      files: laudoImages
    },
    textos: {
      acoes_executadas: laudoEditTexts ? laudoActions || selectedLaudoTemplate.acoes : selectedLaudoTemplate.acoes,
      defeito_detectado: laudoEditTexts ? laudoDefect || selectedLaudoTemplate.defeito : selectedLaudoTemplate.defeito,
      descricao_analise: laudoEditTexts ? laudoAnalysis || selectedLaudoTemplate.analise : selectedLaudoTemplate.analise,
      solucao: laudoEditTexts ? laudoSolution || selectedLaudoTemplate.solucao : selectedLaudoTemplate.solucao,
      peca_trocada: selectedLaudoTemplate.pecaTrocada
    },
    pecas_reaproveitaveis: {
      display: "Nao",
      teclado: "Nao",
      bateria: "Nao",
      carcaca: "Nao",
      hd: "Nao",
      memoria: "Nao"
    }
  };
  const devolucaoPayload = {
    modo: selectedDevolucaoMode.id,
    label: selectedDevolucaoMode.label,
    email_pessoal: personalEmail.trim(),
    observacao: notes || selectedDevolucaoMode.defaultObservation,
    regra_acessorios: selectedDevolucaoMode.description,
    equipamento_devolvido: preview.equipamento_atual
  };
  const emprestimoPayload = {
    return_date: loanReturnDate,
    local: loanLocal,
    tipo_equipamento: loanEquipmentType,
    regra: "Termo temporario com data prevista de devolucao."
  };
  const headsetPayload = {
    modelo: newHeadsetModel.trim(),
    serial: newHeadsetSerial.trim().toUpperCase(),
    headset_model: [newHeadsetModel.trim(), newHeadsetSerial.trim() ? `S/N ${newHeadsetSerial.trim().toUpperCase()}` : ""].filter(Boolean).join(" ")
  };

  async function loadClosureRats(query = closureRatQuery) {
    setLoadingClosureRats(true);
    setClosureRatMessage("");
    try {
      const [eligibleResult, documentsResult] = await Promise.allSettled([
        api.fechamentoRats(query),
        api.documents()
      ]);
      const eligible = eligibleResult.status === "fulfilled" ? eligibleResult.value.items : [];
      const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR").replace(/^#/, "");
      const recent = documentsResult.status === "fulfilled"
        ? documentsResult.value.items
            .map(ratCandidateFromDocument)
            .filter((item): item is FechamentoRatCandidate => Boolean(item))
            .filter((item) => !normalizedQuery || [
              item.document_id,
              item.midiasimples_id,
              item.numero_chamado,
              item.colaborador.matricula,
              item.colaborador.nome,
              item.colaborador.email,
              item.responsavel
            ].some((value) => asText(value).toLocaleLowerCase("pt-BR").includes(normalizedQuery)))
        : [];
      const combined = [...(preferredClosureRat ? [preferredClosureRat] : []), ...recent, ...eligible]
        .filter((item, index, items) => items.findIndex((candidate) => candidate.document_id === item.document_id) === index);
      setClosureRatCandidates(combined);
      if (combined.length === 0) {
        setClosureRatMessage("Nenhuma RAT encontrada. A busca considera RATs recentes do HUB e RATs sincronizadas.");
      }
    } catch (err) {
      setClosureRatMessage(err instanceof Error ? err.message : "Falha ao buscar RATs.");
    } finally {
      setLoadingClosureRats(false);
    }
  }

  function selectClosureRat(item: FechamentoRatCandidate) {
    setSelectedClosureRat(item);
    setTicket(item.numero_chamado || "");
    setExtraSerial(item.midiasimples_id ? `RAT #${item.midiasimples_id}` : `Documento #${item.document_id}`);
    setClosureText(item.suggested_script);
    setClosureRatMessage(`RAT #${item.midiasimples_id || item.document_id} selecionada para fechamento.`);
  }

  useEffect(() => {
    if (type === "fechamento") {
      if (preferredClosureRat) {
        selectClosureRat(preferredClosureRat);
      }
      void loadClosureRats("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function submit() {
    if (type === "fechamento" && !selectedClosureRat) {
      setError("Selecione uma RAT elegivel antes de criar o fechamento.");
      return;
    }
    const finalClosureText = selectedClosureRat?.suggested_script || closureText;
    if (type === "fechamento" && !finalClosureText.trim()) {
      setError("O texto de fechamento e obrigatorio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const isClosureScript = type === "fechamento";
      const response = await api.createDocumentDraft({
        tipo: type,
        numero_chamado: ticket.trim() || undefined,
        usuario_id: usuarioId ?? undefined,
        colaborador: preview.colaborador,
        payload: {
          ...preview,
          tecnico: technician,
          observacao: notes,
          rat: type === "rat" ? ratPayload : null,
          laudo: type === "laudo" ? laudoPayload : null,
          devolucao: type === "devolucao" ? devolucaoPayload : null,
          emprestimo: type === "emprestimo" ? emprestimoPayload : null,
          headset_novo: type === "substituicao_headset" ? headsetPayload : null,
          fechamento: type === "fechamento" ? {
            resultado: closureResult,
            referencia: extraSerial.trim().toUpperCase() || null,
            texto: finalClosureText.trim(),
            source_rat_document_id: selectedClosureRat?.document_id || null,
            source_rat_midiasimples_id: selectedClosureRat?.midiasimples_id || null,
            source_rat_status: selectedClosureRat?.status || null,
            source_rat_responsavel: selectedClosureRat?.responsavel || null
          } : null,
          profile: newMachineProfile,
          equipamento_novo: extraSerial && type !== "fechamento" && type !== "substituicao_headset" ? {
            serial: extraSerial.trim().toUpperCase(),
            profile: newMachineProfile,
            marca: newMachineBrand.trim(),
            modelo: newMachineModel.trim(),
            categoria: type === "emprestimo" ? loanEquipmentType : undefined,
            nota_fiscal: newMachineNf.trim(),
            patrimonio: newMachinePatrimony.trim(),
            hostname: newMachineHostname.trim().toUpperCase(),
            scheduled_time: "17:00",
            observacao: notes
          } : null,
          origem: "desktop_wizard"
        },
        queue_sync: isClosureScript ? false : queueSync,
        status: "pronto_envio"
      });
      const closureCopied = isClosureScript ? await copyTextToClipboard(finalClosureText.trim()) : false;
      const createdRat = type === "rat" ? ratCandidateFromDocument({
        id: response.document_id,
        tipo: "rat",
        status: response.status || "pronto_envio",
        numero_chamado: ticket.trim() || null,
        midiasimples_id: null,
        sync_pendente: Boolean(response.sync_id),
        sync_tentativas: 0,
        payload: {
          colaborador: preview.colaborador,
          tecnico: technician,
          rat: ratPayload
        }
      }) || undefined : undefined;
      onCreated(
        isClosureScript
          ? `Script de fechamento ${response.document_id} criado${closureCopied ? " e copiado para a area de transferencia" : ""}.`
          : `Documento ${response.document_id} pronto para envio${response.sync_id ? ` e fila #${response.sync_id}` : ""}.`,
        createdRat
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar documento.");
    } finally {
      setSaving(false);
    }
  }

  async function lookupManager() {
    const query = managerRegistration.trim();
    if (!query) {
      setManagerLookupMessage("");
      return;
    }
    setManagerLookupLoading(true);
    setManagerLookupMessage("");
    try {
      const response = await api.operationalSearch(query);
      const manager = response.dados || {};
      setManagerName(value(manager.nome) || managerName);
      setManagerEmail(value(manager.email) || managerEmail);
      setManagerRegistration(value(manager.matricula) || query);
      if (manager.nome || manager.email) {
        setManagerLookupMessage(`Gerente encontrado: ${manager.nome || query}`);
      } else {
        setManagerLookupMessage("Nao encontrei nome/e-mail para este registro. Preencha manualmente.");
      }
    } catch (err) {
      setManagerLookupMessage(err instanceof Error ? err.message : "Falha ao buscar gerente.");
    } finally {
      setManagerLookupLoading(false);
    }
  }

  async function handleLaudoImages(files: FileList | null) {
    setImageError("");
    if (!files || files.length === 0) {
      setLaudoImages([]);
      return;
    }
    const selected = Array.from(files).slice(0, 6);
    const invalid = selected.find((file) => file.size > 8 * 1024 * 1024);
    if (invalid) {
      setImageError(`Arquivo muito grande: ${invalid.name}. Limite de 8 MB por arquivo.`);
      return;
    }
    try {
      setLaudoImages(await Promise.all(selected.map(readFileAsDataUrl)));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Falha ao carregar imagens.");
    }
  }

  return (
    <div className="wizard-backdrop" role="presentation">
      <section className="wizard-modal" role="dialog" aria-modal="true" aria-label={TITLES[type]}>
        <header className="wizard-header">
          <div>
            <span className="section-kicker">Wizard operacional</span>
            <h2>{TITLES[type]}</h2>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>

        <div className="wizard-grid">
          <article>
            <div className="section-kicker">Colaborador</div>
            <strong>{preview.colaborador.nome || "-"}</strong>
            <span>{preview.colaborador.matricula || "-"}</span>
            <span>{preview.colaborador.email || "-"}</span>
            <span>{preview.colaborador.cargo || "-"}</span>
          </article>

          <article>
            <div className="section-kicker">Equipamento atual</div>
            <strong>{preview.equipamento_atual.serial || "-"}</strong>
            <span>{preview.equipamento_atual.hostname || "-"}</span>
            <span>{preview.equipamento_atual.marca || "-"} / {preview.equipamento_atual.modelo || "-"}</span>
            <span>Patrimonio {preview.equipamento_atual.patrimonio || "-"}</span>
          </article>
        </div>

        {type !== "fechamento" && (
        <section className="wizard-subpanel">
          <div className="section-kicker">Conferencia manual</div>
          <div className="wizard-preview-text">
            <strong>Complete aqui quando Automatos/MidiaSimples nao trouxer tudo.</strong>
            <span>Esses dados entram no documento antes de validar e enviar.</span>
          </div>
          <div className="wizard-two-cols">
            <label className="wizard-field compact">
              Matricula
              <input value={manualMatricula} onChange={(event) => setManualMatricula(event.target.value)} />
            </label>
            <label className="wizard-field compact">
              Nome
              <input value={manualNome} onChange={(event) => setManualNome(event.target.value)} />
            </label>
          </div>
          <div className="wizard-two-cols">
            <label className="wizard-field compact">
              E-mail
              <input value={manualEmail} onChange={(event) => setManualEmail(event.target.value)} />
            </label>
            <label className="wizard-field compact">
              Cargo
              <input value={manualCargo} onChange={(event) => setManualCargo(event.target.value)} />
            </label>
          </div>
          <div className="wizard-two-cols">
            <label className="wizard-field compact">
              Telefone
              <input value={manualTelefone} onChange={(event) => setManualTelefone(event.target.value)} />
            </label>
            <label className="wizard-field compact">
              Regional
              <input value={manualRegional} onChange={(event) => setManualRegional(event.target.value)} />
            </label>
          </div>
          <div className="wizard-two-cols">
            <label className="wizard-field compact">
              Serial
              <input value={manualSerial} onChange={(event) => setManualSerial(event.target.value.toUpperCase())} />
            </label>
            <label className="wizard-field compact">
              Hostname
              <input value={manualHostname} onChange={(event) => setManualHostname(event.target.value.toUpperCase())} />
            </label>
          </div>
          <div className="wizard-two-cols">
            <label className="wizard-field compact">
              Marca
              <input value={manualMarca} onChange={(event) => setManualMarca(event.target.value)} />
            </label>
            <label className="wizard-field compact">
              Modelo documental
              <input value={manualModelo} onChange={(event) => setManualModelo(event.target.value)} />
            </label>
          </div>
          {dados.modelo_tecnico && dados.modelo_tecnico !== manualModelo && (
            <p className="wizard-hint">
              Modelo tecnico Automatos: {dados.modelo_tecnico}. Use no documento apenas o modelo comercial/perfil.
            </p>
          )}
          <div className="wizard-two-cols">
            <label className="wizard-field compact">
              Categoria
              <input value={manualCategoria} onChange={(event) => setManualCategoria(event.target.value.toUpperCase())} />
            </label>
            <label className="wizard-field compact">
              Nota fiscal
              <input value={manualNf} onChange={(event) => setManualNf(event.target.value)} />
            </label>
          </div>
          <label className="wizard-field compact">
            Patrimonio
            <input value={manualPatrimonio} onChange={(event) => setManualPatrimonio(event.target.value)} />
          </label>
        </section>
        )}

        {type !== "fechamento" && (
        <label className="wizard-field">
          Numero do chamado{type === "rat" || type === "laudo" ? " *" : ""}
          <input value={ticket} onChange={(event) => setTicket(event.target.value.toUpperCase())} placeholder="INC, REQ ou LNR" />
        </label>
        )}

        {type === "substituicao_headset" && (
          <section className="wizard-subpanel">
            <div className="section-kicker">Headset novo</div>
            <div className="wizard-preview-text">
              <strong>Cria somente uma nova concessao.</strong>
              <span>O servidor busca o termo atual no MidiaSimples, mantem maquina e perifericos existentes, e troca apenas o headset.</span>
            </div>
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Modelo do headset *
                <input value={newHeadsetModel} onChange={(event) => setNewHeadsetModel(event.target.value)} placeholder="POLY BW - 3220 USB-C" />
              </label>
              <label className="wizard-field compact">
                Serial do headset *
                <input value={newHeadsetSerial} onChange={(event) => setNewHeadsetSerial(event.target.value.toUpperCase())} placeholder="S/N do headset novo" />
              </label>
            </div>
          </section>
        )}

        {(type === "substituicao" || type === "concessao" || type === "emprestimo" || type === "rollout") && (
          <section className="wizard-subpanel">
            <div className="section-kicker">{type === "emprestimo" ? "Equipamento do emprestimo" : "Equipamento novo"}</div>
            {type === "rollout" && (
              <div className="wizard-preview-text">
                <strong>Fluxo dedicado de rollout/novo colaborador</strong>
                <span>O envio real cria/atualiza colaborador, fecha a responsabilidade anterior quando existir e cria a concessao da maquina nova.</span>
              </div>
            )}
            {type === "emprestimo" && (
              <div className="wizard-two-cols">
                <label className="wizard-field compact">
                  Tipo do equipamento
                  <select value={loanEquipmentType} onChange={(event) => setLoanEquipmentType(event.target.value)}>
                    {["NOTEBOOK", "DESKTOP", "MONITOR", "HEADSET", "FONTE", "DOCK", "MOBILE"].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="wizard-field compact">
                  Data prevista de devolucao
                  <input type="date" value={loanReturnDate} onChange={(event) => setLoanReturnDate(event.target.value)} />
                </label>
              </div>
            )}
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Perfil / kit
                <select value={newMachineProfile} onChange={(event) => changeNewMachineProfile(event.target.value)}>
                  {["PERFORMANCE", "PERFORMANCE G4", "PERFORMANCE G6", "5G", "NOTEBOOK", "DESKTOP/MINI PC", "MOBILE"].map((profile) => (
                    <option key={profile} value={profile}>{profile}</option>
                  ))}
                </select>
              </label>
              <label className="wizard-field compact">
                Serial do equipamento *
                <input value={extraSerial} onChange={(event) => setExtraSerial(event.target.value)} placeholder="Ex.: PE0..." />
              </label>
            </div>
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Marca
                <input value={newMachineBrand} onChange={(event) => setNewMachineBrand(event.target.value)} />
              </label>
              <label className="wizard-field compact">
                Modelo documental
                <input value={newMachineModel} onChange={(event) => setNewMachineModel(event.target.value)} placeholder="Opcional: perfil preenche se vazio" />
              </label>
            </div>
            {newMachineProfile === "5G" && (
              <p className="wizard-hint">
                Perfil 5G pode ser LATITUDE 5450 ou LATITUDE 5440. Confirme pelo termo/documentacao anterior antes de enviar.
              </p>
            )}
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Nota Fiscal
                <input value={newMachineNf} onChange={(event) => setNewMachineNf(event.target.value)} />
              </label>
              <label className="wizard-field compact">
                Patrimonio
                <input value={newMachinePatrimony} onChange={(event) => setNewMachinePatrimony(event.target.value)} />
              </label>
            </div>
            <label className="wizard-field compact">
              Hostname
              <input value={newMachineHostname} onChange={(event) => setNewMachineHostname(event.target.value)} placeholder="NAKRJ + matricula" />
            </label>
            {type === "emprestimo" && (
              <label className="wizard-field compact">
                Local
                <input value={loanLocal} onChange={(event) => setLoanLocal(event.target.value)} />
              </label>
            )}
          </section>
        )}

        {type === "rat" && (
          <section className="wizard-subpanel">
            <div className="section-kicker">Template RAT</div>
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Categoria
                <select
                  value={ratCategory}
                  onChange={(event) => {
                    setRatCategory(event.target.value);
                    setRatTemplateIndex(0);
                  }}
                >
                  {Object.keys(RAT_TEMPLATES).map((category) => (
                    <option key={category} value={category}>
                      {category.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="wizard-field compact">
                Modelo
                <select value={ratTemplateIndex} onChange={(event) => setRatTemplateIndex(Number(event.target.value))}>
                  {(RAT_TEMPLATES[ratCategory] || []).map((template, index) => (
                    <option key={template.label} value={index}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedRatTemplate.needsSerial && (
              <label className="wizard-field compact">
                Serial do headset entregue
                <input value={ratSerial} onChange={(event) => setRatSerial(event.target.value)} placeholder="S/N do headset" />
              </label>
            )}

            <label className="wizard-check">
              <input type="checkbox" checked={editTexts} onChange={(event) => setEditTexts(event.target.checked)} />
              Editar textos antes de criar
            </label>

            {editTexts ? (
              <>
                <label className="wizard-field compact">
                  Outro
                  <input value={manualOther} onChange={(event) => setManualOther(event.target.value)} placeholder={selectedRatTemplate.outro} />
                </label>
                <label className="wizard-field compact">
                  Sintoma do Problema Relatado
                  <textarea value={manualProblem} onChange={(event) => setManualProblem(event.target.value)} placeholder={selectedRatTemplate.problema} />
                </label>
                <label className="wizard-field compact">
                  Relatorio Tecnico Fechamento
                  <textarea value={manualClose} onChange={(event) => setManualClose(event.target.value)} placeholder={ratCloseText} />
                </label>
              </>
            ) : (
              <div className="wizard-preview-text">
                <strong>{selectedRatTemplate.outro}</strong>
                <span>{selectedRatTemplate.problema}</span>
                <span>{ratCloseText}</span>
              </div>
            )}
          </section>
        )}

        {type === "laudo" && (
          <section className="wizard-subpanel">
            <div className="section-kicker">Template Laudo Tecnico</div>
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Modelo do laudo
                <select
                  value={laudoTemplateIndex}
                  onChange={(event) => {
                    const nextIndex = Number(event.target.value);
                    setLaudoTemplateIndex(nextIndex);
                    setLaudoUsoInadequado(LAUDO_TEMPLATES[nextIndex]?.usoInadequado ?? false);
                  }}
                >
                  {LAUDO_TEMPLATES.map((template, index) => (
                    <option key={template.label} value={index}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="wizard-field compact">
                Matricula do gerente TIM *
                <div className="wizard-inline-field">
                  <input
                    value={managerRegistration}
                    onBlur={lookupManager}
                    onChange={(event) => {
                      setManagerRegistration(event.target.value);
                      setManagerLookupMessage("");
                    }}
                    placeholder="Obrigatorio no envio real"
                  />
                  <button type="button" onClick={lookupManager} disabled={managerLookupLoading}>
                    {managerLookupLoading ? "..." : "Buscar"}
                  </button>
                </div>
              </label>
            </div>
            {managerLookupMessage && <div className="wizard-hint">{managerLookupMessage}</div>}
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Nome do gerente TIM *
                <input value={managerName} onChange={(event) => setManagerName(event.target.value)} placeholder="Obrigatorio no envio real" />
              </label>
              <label className="wizard-field compact">
                Email do gerente TIM
                <input value={managerEmail} onChange={(event) => setManagerEmail(event.target.value)} placeholder="Usado quando for uso inadequado" />
              </label>
            </div>

            <label className="wizard-check">
              <input
                type="checkbox"
                checked={laudoUsoInadequado}
                onChange={(event) => setLaudoUsoInadequado(event.target.checked)}
              />
              Marcar laudo como uso inadequado
            </label>

            <div className="wizard-tags">
              <span>{laudoUsoInadequado ? "USO INADEQUADO" : "FALHA/DESGASTE"}</span>
              <span>{selectedLaudoTemplate.condicaoReparo === "reparavel" ? "REPARAVEL" : "IRREPARAVEL"}</span>
            </div>

            <label className="wizard-check">
              <input type="checkbox" checked={laudoEditTexts} onChange={(event) => setLaudoEditTexts(event.target.checked)} />
              Editar textos do laudo
            </label>

            {laudoEditTexts ? (
              <>
                <label className="wizard-field compact">
                  Acoes executadas anteriormente
                  <textarea value={laudoActions} onChange={(event) => setLaudoActions(event.target.value)} placeholder={selectedLaudoTemplate.acoes} />
                </label>
                <label className="wizard-field compact">
                  Descricao do defeito detectado
                  <textarea value={laudoDefect} onChange={(event) => setLaudoDefect(event.target.value)} placeholder={selectedLaudoTemplate.defeito} />
                </label>
                <label className="wizard-field compact">
                  Descricao da analise
                  <textarea value={laudoAnalysis} onChange={(event) => setLaudoAnalysis(event.target.value)} placeholder={selectedLaudoTemplate.analise} />
                </label>
                <label className="wizard-field compact">
                  Solucao
                  <textarea value={laudoSolution} onChange={(event) => setLaudoSolution(event.target.value)} placeholder={selectedLaudoTemplate.solucao} />
                </label>
              </>
            ) : (
              <div className="wizard-preview-text">
                <strong>{selectedLaudoTemplate.label}</strong>
                <span>{selectedLaudoTemplate.acoes}</span>
                <span>{selectedLaudoTemplate.defeito}</span>
                <span>{selectedLaudoTemplate.solucao}</span>
              </div>
            )}

            <label className="wizard-field compact">
              Observacao sobre imagens/evidencias
              <input value={imageNote} onChange={(event) => setImageNote(event.target.value)} placeholder="Ex.: imagens anexadas manualmente no MidiaSimples" />
            </label>
            <label className="wizard-field compact">
              Imagens/evidencias do laudo *
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/bmp,application/pdf"
                onChange={(event) => void handleLaudoImages(event.target.files)}
              />
            </label>
            {imageError && <div className="form-error">{imageError}</div>}
            {laudoImages.length > 0 && (
              <div className="wizard-image-preview">
                {laudoImages.map((file) => (
                  <div className="wizard-image-item" key={`${file.name}-${file.size}`}>
                    {file.type.startsWith("image/") ? (
                      <img src={file.data_url} alt={file.name} />
                    ) : (
                      <span>PDF</span>
                    )}
                    <small>{file.name}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {type === "devolucao" && (
          <section className="wizard-subpanel">
            <div className="section-kicker">Termo de devolucao</div>
            <div className="wizard-two-cols">
              <label className="wizard-field compact">
                Tipo de devolucao
                <select value={devolucaoMode} onChange={(event) => setDevolucaoMode(event.target.value as "total" | "equipamento" | "manual")}>
                  {DEVOLUCAO_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="wizard-field compact">
                Email pessoal do colaborador
                <input value={personalEmail} onChange={(event) => setPersonalEmail(event.target.value)} placeholder="Obrigatorio no envio real da devolucao" />
              </label>
            </div>
            <div className="wizard-preview-text">
              <strong>{selectedDevolucaoMode.label}</strong>
              <span>{selectedDevolucaoMode.description}</span>
              <span>{selectedDevolucaoMode.defaultObservation}</span>
            </div>
          </section>
        )}

        {type === "fechamento" && (
          <section className="wizard-subpanel">
            <div className="section-kicker">RAT base do fechamento</div>
            <div className="wizard-preview-text">
              <strong>Selecione a RAT que originou este fechamento.</strong>
              <span>RATs criadas recentemente no HUB aparecem imediatamente, sem depender da proxima sincronizacao.</span>
            </div>
            <label className="wizard-field compact">
              Buscar RAT
              <div className="wizard-inline-field">
                <input
                  value={closureRatQuery}
                  onChange={(event) => setClosureRatQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void loadClosureRats();
                    }
                  }}
                  placeholder="Chamado, #RAT, ID, matricula, nome ou tecnico"
                />
                <button type="button" onClick={() => void loadClosureRats()} disabled={loadingClosureRats}>
                  {loadingClosureRats ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </label>
            {closureRatMessage && <div className="wizard-hint">{closureRatMessage}</div>}
            <div className="wizard-preview-text">
              {closureRatCandidates.slice(0, 8).map((item) => (
                <button
                  type="button"
                  className="mini-action"
                  key={`${item.document_id}-${item.midiasimples_id || "local"}`}
                  onClick={() => selectClosureRat(item)}
                >
                  RAT #{item.midiasimples_id || item.document_id} | {item.numero_chamado || "sem chamado"} | {item.colaborador.nome || "-"} | {item.responsavel}
                </button>
              ))}
            </div>
            {selectedClosureRat && (
              <div className="wizard-tags">
                <span>RAT #{selectedClosureRat.midiasimples_id || selectedClosureRat.document_id}</span>
                <span>{selectedClosureRat.numero_chamado || "SEM CHAMADO"}</span>
                <span>{selectedClosureRat.responsavel}</span>
              </div>
            )}
            {selectedClosureRat && (
              <div className="wizard-preview-text">
                <strong>Script gerado automaticamente pela RAT selecionada.</strong>
                <span>Ao criar, o texto ficara salvo no historico para copiar e colar no chamado.</span>
              </div>
            )}
          </section>
        )}

        <label className="wizard-field">
          Observacao operacional
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Resumo, decisao, detalhe tecnico ou instrucao para o modulo." />
        </label>

        {type === "fechamento" ? (
          <div className="wizard-note">
            Fechamento de RAT e um script para copiar e colar no chamado. Ele nao entra em DocuSign, WhatsApp ou fila de envio.
          </div>
        ) : (
          <label className="wizard-check">
            <input type="checkbox" checked={queueSync} onChange={(event) => setQueueSync(event.target.checked)} />
            Enviar para fila offline/sync
          </label>
        )}

        {error && <div className="form-error">{error}</div>}

        <footer className="wizard-actions">
          <button onClick={onClose}>Cancelar</button>
          <button className="primary-action" onClick={submit} disabled={saving}>
            {saving ? "Criando..." : type === "fechamento" ? "Criar script" : "Criar documento"}
          </button>
        </footer>
      </section>
    </div>
  );
}
