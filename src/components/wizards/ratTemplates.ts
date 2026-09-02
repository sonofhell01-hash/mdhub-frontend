export type RatTemplate = {
  label: string;
  outro: string;
  problema: string;
  fechamento: string;
  diagnostico?: string;
  causaRaiz?: string;
  resultado?: string;
  needsSerial?: boolean;
};

export const RAT_TEMPLATES: Record<string, RatTemplate[]> = {
  reposicao: [
    {
      label: "Reposicao de headset",
      outro: "Reposicao de headset",
      problema: "Headset com defeito, sem possibilidade de reparo em campo.",
      fechamento: "Efetuado laudo e solicitada a reposicao do headset. Aguardando envio do novo equipamento.",
      diagnostico: "Falha fisica confirmada no headset",
      causaRaiz: "Defeito fisico no equipamento.",
      resultado: "Laudo efetuado e reposicao solicitada."
    },
    {
      label: "Reposicao de fonte/carregador",
      outro: "Reposicao de fonte/carregador",
      problema: "Fonte/carregador com defeito e sem fornecimento adequado de energia.",
      fechamento: "Efetuado laudo e solicitada a reposicao da fonte/carregador. Aguardando envio.",
      diagnostico: "Falha confirmada na fonte/carregador",
      causaRaiz: "Defeito no adaptador de energia.",
      resultado: "Laudo efetuado e reposicao solicitada."
    },
    {
      label: "Reposicao de mochila",
      outro: "Reposicao de mochila",
      problema: "Mochila danificada e sem condicoes adequadas de uso.",
      fechamento: "Registrada a avaria e solicitada a reposicao da mochila. Aguardando envio.",
      diagnostico: "Avaria confirmada na mochila",
      causaRaiz: "Dano fisico no item.",
      resultado: "Reposicao solicitada."
    },
    {
      label: "Reposicao de mouse",
      outro: "Reposicao de mouse",
      problema: "Mouse com defeito de funcionamento.",
      fechamento: "Defeito validado e solicitada a reposicao do mouse. Aguardando envio.",
      diagnostico: "Falha confirmada no mouse",
      causaRaiz: "Defeito no periferico.",
      resultado: "Reposicao solicitada."
    },
    {
      label: "Reposicao de teclado",
      outro: "Reposicao de teclado",
      problema: "Teclado com defeito de funcionamento.",
      fechamento: "Defeito validado e solicitada a reposicao do teclado. Aguardando envio.",
      diagnostico: "Falha confirmada no teclado",
      causaRaiz: "Defeito no periferico.",
      resultado: "Reposicao solicitada."
    },
    {
      label: "Reposicao de equipamento",
      outro: "Reposicao de equipamento",
      problema: "Equipamento com falha de hardware e sem possibilidade de reparo em campo.",
      fechamento: "Efetuado laudo tecnico e solicitada a reposicao do equipamento. Aguardando substituicao.",
      diagnostico: "Falha de hardware com necessidade de reposicao",
      causaRaiz: "Defeito de hardware confirmado durante o atendimento.",
      resultado: "Laudo efetuado e reposicao solicitada."
    }
  ],
  headset: [
    {
      label: "Earpads desgastadas",
      outro: "Headset - Earpads desgastadas",
      problema: "Headset apresenta espumas (Earpads) desgastadas/rasgadas.",
      fechamento: "Realizada a troca das Earpads.",
      diagnostico: "Headset - Earpads desgastadas",
      causaRaiz: "Desgaste natural das espumas (Earpads).",
      resultado: "Equipamento em funcionamento normal."
    },
    {
      label: "Fio com mal contato",
      outro: "Headset - Fio com mal contato",
      problema: "Headset apresenta mal contato.",
      fechamento: "Efetuado laudo e solicitacao de um headset, aguardando envio.",
      diagnostico: "Headset - Fio com mal contato",
      causaRaiz: "Falha fisica no cabo/conexao do headset.",
      resultado: "Laudo efetuado e reposicao solicitada."
    },
    {
      label: "Avaria no headset",
      outro: "Headset - Avaria",
      problema: "Headset apresenta avaria.",
      fechamento: "Efetuado laudo e solicitacao de um headset, aguardando envio.",
      diagnostico: "Headset - Avaria",
      causaRaiz: "Avaria constatada no headset.",
      resultado: "Laudo efetuado e reposicao solicitada."
    },
    {
      label: "Configuracao / Driver",
      outro: "Headset - Configuracao/Driver",
      problema: "Drivers desatualizados.",
      fechamento: "Realizada a atualizacao de drivers, headset operacional.",
      diagnostico: "Headset - Configuracao/Driver",
      causaRaiz: "Configuracao ou driver inconsistente.",
      resultado: "Headset operacional apos ajuste."
    },
    {
      label: "Entrega/Substituicao de Headset",
      outro: "Headset - Laudo e substituicao",
      problema: "Headset substituido apos laudo tecnico.",
      fechamento: "Efetuado laudo e substituicao do headset.\nEntregue um headset POLY BW - 3220 S/N {serial}",
      diagnostico: "Headset - Substituicao",
      causaRaiz: "Substituicao autorizada conforme atendimento.",
      resultado: "Headset entregue e atendimento concluido.",
      needsSerial: true
    }
  ],
  notebook: [
    {
      label: "Nao liga - Master Reset",
      outro: "Notebook nao liga - Master Reset",
      problema: "Notebook nao liga.",
      fechamento: "Realizado o master-reset na placa mae, maquina operacional novamente.",
      diagnostico: "Notebook nao liga - Master Reset",
      causaRaiz: "Falha temporaria de inicializacao/energia residual.",
      resultado: "Equipamento operacional novamente."
    },
    {
      label: "Nao liga - Substituicao de equipamento",
      outro: "Notebook nao liga - Substituicao de equipamento",
      problema: "Notebook nao liga.",
      fechamento: "Efetuado laudo para substituicao de equipamento.",
      diagnostico: "Notebook sem inicializacao",
      causaRaiz: "Falha de hardware com necessidade de substituicao.",
      resultado: "Laudo realizado para substituicao do equipamento."
    },
    {
      label: "Nao liga - SSD com defeito",
      outro: "Notebook nao liga - SSD com defeito",
      problema: "SSD com defeito.",
      fechamento: "Realizada a troca do SSD e adequacao de imagem.",
      diagnostico: "SSD com defeito",
      causaRaiz: "Falha de armazenamento.",
      resultado: "SSD substituido e equipamento operacional."
    },
    {
      label: "Nao liga - Reconfiguracao de boot",
      outro: "Notebook nao liga - Reconfiguracao de boot",
      problema: "Notebook nao liga.",
      fechamento: "Realizada a reconfiguracao de boot.",
      diagnostico: "Falha de boot",
      causaRaiz: "Ordem/configuracao de boot inconsistente.",
      resultado: "Boot reconfigurado e equipamento operacional."
    },
    {
      label: "Esquentando - Manutencao preventiva",
      outro: "Notebook esquentando - Manutencao preventiva",
      problema: "Notebook esquentando.",
      fechamento: "Limpeza interna completa. Troca da pasta termica. Verificacao de conexoes."
    },
    {
      label: "Esquentando / Fazendo barulho - Cooler com defeito",
      outro: "Notebook esquentando/fazendo barulho - Cooler com defeito",
      problema: "Notebook esquentando/fazendo barulho.",
      fechamento: "Cooler com defeito, realizada a troca do cooler."
    },
    {
      label: "Tela azul",
      outro: "Notebook apresentando tela azul",
      problema: "Notebook apresentando tela azul.",
      fechamento: "Memoria com defeito, realizada a troca da memoria."
    },
    {
      label: "Retorno de garantia",
      outro: "Retorno de garantia",
      problema: "Retorno de garantia.",
      fechamento: "Retorno de garantia, maquina devolvida ao usuario."
    }
  ],
  carregamento: [
    {
      label: "Nao carrega - USB-C com defeito",
      outro: "Notebook nao carrega - USB-C com defeito",
      problema: "Notebook nao carrega.",
      fechamento: "USB-C com defeito, laudo para substituicao da maquina."
    },
    {
      label: "Nao carrega - Master Reset",
      outro: "Notebook nao carrega - Master Reset",
      problema: "Notebook nao carrega.",
      fechamento: "Realizado o master-reset na placa mae, maquina operacional novamente."
    },
    {
      label: "Fonte com defeito",
      outro: "Outro - Fonte",
      problema: "Fonte com defeito.",
      fechamento: "Realizada a troca da fonte."
    }
  ],
  teclado: [
    {
      label: "Teclado com defeito",
      outro: "Teclado com defeito",
      problema: "Teclado com defeito.",
      fechamento: "Realizada a troca do teclado."
    }
  ],
  webcam: [
    {
      label: "Webcam com defeito",
      outro: "Webcam com defeito",
      problema: "Webcam nao funciona.",
      fechamento: "Realizado o reparo da webcam."
    }
  ],
  mochila: [
    {
      label: "Mochila danificada",
      outro: "Mochila danificada",
      problema: "Mochila danificada.",
      fechamento: "Realizada a troca da mochila."
    }
  ],
  suporte: [
    {
      label: "Suporte ergonomico danificado",
      outro: "Suporte ergonomico danificado",
      problema: "Suporte ergonomico danificado.",
      fechamento: "Realizada a troca do suporte ergonomico."
    }
  ],
  tela: [
    {
      label: "Tela LCD trincada",
      outro: "Tela display danificado - LCD trincada",
      problema: "Tela LCD trincada.",
      fechamento: "Efetuado laudo para substituicao."
    },
    {
      label: "Tela LCD tremendo",
      outro: "Tela display danificado - LCD tremendo",
      problema: "Tela LCD tremendo.",
      fechamento: "Realizada a atualizacao de firmware."
    }
  ],
  mouse: [
    {
      label: "Mouse com defeito",
      outro: "Mouse com defeito",
      problema: "Mouse com defeito.",
      fechamento: "Realizada a troca do mouse."
    }
  ]
};
