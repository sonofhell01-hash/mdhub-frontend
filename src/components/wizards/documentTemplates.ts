export type LaudoTemplate = {
  label: string;
  usoInadequado: boolean;
  acoes: string;
  defeito: string;
  analise: string;
  solucao: string;
  pecaTrocada: string;
  condicaoReparo: "reparavel" | "irreparavel";
};

export type DevolucaoMode = {
  id: "total" | "equipamento" | "manual";
  label: string;
  description: string;
  defaultObservation: string;
};

export const LAUDO_TEMPLATES: LaudoTemplate[] = [
  {
    label: "Derramamento de Liquido",
    usoInadequado: true,
    acoes:
      "Equipamento inspecionado internamente com sinais de oxidacao e residuos liquidos. Testes de alimentacao realizados sem sucesso.",
    defeito:
      "Notebook apresenta falha generalizada e nao realiza inicializacao. Foram identificados sinais caracteristicos de exposicao a liquidos.",
    analise:
      "A exposicao a liquido comprometeu componentes internos essenciais e o sistema nao responde a tentativa de inicializacao.",
    solucao: "Substituicao da placa-mae por unidade nova e compativel com o modelo do notebook.",
    pecaTrocada: "Placa-mae para notebook.",
    condicaoReparo: "irreparavel"
  },
  {
    label: "Queda",
    usoInadequado: true,
    acoes:
      "Equipamento inspecionado visualmente com identificacao de danos fisicos e desalinhamento estrutural.",
    defeito: "Notebook apresenta avarias estruturais evidentes e falhas intermitentes de funcionamento.",
    analise:
      "A queda comprometeu a integridade estrutural do equipamento e pode ter deslocado componentes internos.",
    solucao: "Substituicao completa do equipamento ou avaliacao tecnica para troca das pecas afetadas.",
    pecaTrocada: "Carcaca, dobradicas e componentes afetados conforme diagnostico complementar.",
    condicaoReparo: "irreparavel"
  },
  {
    label: "Tela Trincada",
    usoInadequado: true,
    acoes: "Equipamento testado com reinicializacao e monitor externo para isolar falha no painel.",
    defeito: "Tela do notebook apresenta dano fisico evidente, com trinca e distorcoes graficas.",
    analise: "O defeito indica dano fisico no LCD; testes com monitor externo isolam o problema na tela.",
    solucao: "Substituicao da tela LCD por uma nova compativel com o modelo do notebook.",
    pecaTrocada: "Tela LCD para notebook.",
    condicaoReparo: "reparavel"
  },
  {
    label: "Placa-mae com Defeito (Nao Liga)",
    usoInadequado: false,
    acoes:
      "Testes de alimentacao realizados com adaptador original e fontes externas, com e sem bateria, alem de reset de hardware.",
    defeito: "Notebook nao apresenta sinais de inicializacao mesmo com alimentacao direta.",
    analise: "Placa-mae nao responde aos comandos de inicializacao nem a alimentacao eletrica.",
    solucao: "Abertura de chamado junto a assistencia oficial para analise e substituicao da placa-mae.",
    pecaTrocada: "Placa-mae do notebook, conforme avaliacao da assistencia oficial.",
    condicaoReparo: "irreparavel"
  },
  {
    label: "Placa-mae com Defeito Fora de Garantia",
    usoInadequado: false,
    acoes:
      "Testes de alimentacao realizados com adaptador original e fontes externas, com e sem bateria, alem de reset de hardware.",
    defeito: "Notebook nao apresenta sinais de inicializacao mesmo com alimentacao direta.",
    analise: "Placa-mae nao responde aos comandos de inicializacao nem a alimentacao eletrica.",
    solucao: "Substituicao do notebook.",
    pecaTrocada: "Notebook completo, conforme diagnostico tecnico.",
    condicaoReparo: "irreparavel"
  },
  {
    label: "Porta USB com Defeito",
    usoInadequado: false,
    acoes: "Testes realizados com diferentes dispositivos USB em todas as portas do equipamento.",
    defeito: "Uma das portas USB esta inoperante e nao realiza leitura ou alimentacao.",
    analise: "Falha compromete funcionalidade do equipamento e recomenda avaliacao para substituicao.",
    solucao: "Substituicao completa do equipamento ou da placa-mae, conforme avaliacao.",
    pecaTrocada: "Equipamento completo ou placa-mae.",
    condicaoReparo: "irreparavel"
  },
  {
    label: "Headset Blackwire C3220 Parou de Funcionar",
    usoInadequado: false,
    acoes: "Testes realizados em diferentes computadores e portas USB.",
    defeito: "Headset nao e reconhecido e nao transmite audio ou microfone.",
    analise: "Headset apresenta falha no sistema de conexao, sem reparo em campo.",
    solucao: "Substituicao do headset por unidade nova do mesmo modelo ou similar.",
    pecaTrocada: "Headset Blackwire C3220 ou similar.",
    condicaoReparo: "irreparavel"
  },
  {
    label: "Fonte / Carregador com Defeito",
    usoInadequado: false,
    acoes: "Testes realizados com tomadas e equipamento compativel, alem de inspecao visual do cabo e conector.",
    defeito: "Fonte/carregador apresenta falha de alimentacao.",
    analise: "Constatada falha no adaptador de energia, sem possibilidade de reparo seguro em campo.",
    solucao: "Substituicao da fonte/carregador por unidade nova e compativel.",
    pecaTrocada: "Fonte/Carregador compativel.",
    condicaoReparo: "irreparavel"
  }
];

export const DEVOLUCAO_MODES: DevolucaoMode[] = [
  {
    id: "total",
    label: "Desligamento / devolucao total",
    description: "Equipamento e acessorios concedidos devem retornar.",
    defaultObservation: "DEVOLUCAO TOTAL DO EQUIPAMENTO E ACESSORIOS CONCEDIDOS."
  },
  {
    id: "equipamento",
    label: "Emprestimo / somente equipamento",
    description: "Devolve somente o equipamento principal; acessorios ficam como nao aplicavel ou nao retornados.",
    defaultObservation: "DEVOLUCAO DO EQUIPAMENTO PRINCIPAL. ACESSORIOS NAO RETORNADOS/NAO APLICAVEL."
  },
  {
    id: "manual",
    label: "Conferencia manual dos acessorios",
    description: "Caso para revisar perifericos um a um antes do envio real.",
    defaultObservation: "DEVOLUCAO COM CONFERENCIA MANUAL DOS ACESSORIOS."
  }
];
