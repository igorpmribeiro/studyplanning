// Enums como objetos const (serializáveis, funcionam no client e server)

export const Prioridade = {
  BAIXA: "baixa",
  MEDIA: "media",
  ALTA: "alta",
} as const;

export const Dificuldade = {
  BAIXA: "baixa",
  MEDIA: "media",
  ALTA: "alta",
} as const;

export const TopicStatus = {
  NAO_INICIADO: "nao_iniciado",
  EM_ANDAMENTO: "em_andamento",
  REVISANDO: "revisando",
  CONCLUIDO: "concluido",
} as const;

export const TipoSessao = {
  ESTUDO: "estudo",
  REVISAO_1: "revisao_1",
  REVISAO_2: "revisao_2",
} as const;

export const SessionStatus = {
  PENDENTE: "pendente",
  CONCLUIDA: "concluida",
} as const;

export const DiaSemana = {
  SEGUNDA: 0,
  TERCA: 1,
  QUARTA: 2,
  QUINTA: 3,
  SEXTA: 4,
  SABADO: 5,
  DOMINGO: 6,
} as const;

export const DIA_SEMANA_LABELS: Record<number, string> = {
  0: "Segunda-feira",
  1: "Terça-feira",
  2: "Quarta-feira",
  3: "Quinta-feira",
  4: "Sexta-feira",
  5: "Sábado",
  6: "Domingo",
};

export const DIA_SEMANA_SHORT: Record<number, string> = {
  0: "Seg",
  1: "Ter",
  2: "Qua",
  3: "Qui",
  4: "Sex",
  5: "Sáb",
  6: "Dom",
};

// Scores para o algoritmo de planejamento
export const PRIORIDADE_SCORE = { baixa: 1, media: 2, alta: 3 } as const;
export const DIFICULDADE_SCORE = { baixa: 1, media: 2, alta: 3 } as const;
export const STATUS_SCORE = {
  nao_iniciado: 3,
  em_andamento: 2,
  revisando: 1,
  concluido: 0,
} as const;

// Labels em português
export const PRIORIDADE_LABELS = { baixa: "Baixa", media: "Média", alta: "Alta" } as const;
export const DIFICULDADE_LABELS = { baixa: "Baixa", media: "Média", alta: "Alta" } as const;
export const STATUS_LABELS = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  revisando: "Revisando",
  concluido: "Concluído",
} as const;
export const TIPO_SESSAO_LABELS = {
  estudo: "Estudo",
  revisao_1: "Revisão 1",
  revisao_2: "Revisão 2",
} as const;
export const SESSION_STATUS_LABELS = {
  pendente: "Pendente",
  concluida: "Concluída",
} as const;

// ─── Simulado ──────────────────────────────────────────────

export const Banca = {
  CESPE: "cespe",
  FCC: "fcc",
  FGV: "fgv",
  VUNESP: "vunesp",
  GENERICA: "generica",
} as const;

export const BANCA_LABELS = {
  cespe: "CESPE/CEBRASPE",
  fcc: "FCC",
  fgv: "FGV",
  vunesp: "VUNESP",
  generica: "Genérica",
} as const;

export const BANCA_FORMATS = {
  cespe: "certo_errado",
  fcc: "multipla_escolha",
  fgv: "multipla_escolha",
  vunesp: "multipla_escolha",
  generica: "multipla_escolha",
} as const;

export const QuizMode = {
  POR_MATERIA: "por_materia",
  POR_TOPICO: "por_topico",
  MISTO: "misto",
  REVISAO: "revisao",
} as const;

export const QUIZ_MODE_LABELS = {
  por_materia: "Por Matéria",
  por_topico: "Por Tópico",
  misto: "Misto (Simulado)",
  revisao: "Revisão",
} as const;
