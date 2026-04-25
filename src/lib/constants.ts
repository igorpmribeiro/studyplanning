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

// Intervalos de revisão (dias após conclusão do estudo original)
// REVISAO_1_DIAS: dias após o estudo original
// REVISAO_2_DIAS: dias após o estudo original — escolhido para que o intervalo
// entre Revisão 1 e Revisão 2 seja de 30 dias (10 + 30 = 40)
export const REVISAO_1_DIAS = 10;
export const REVISAO_2_DIAS = 40;

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

// ─── Subject colors ────────────────────────────────────────

export type SubjectColorKey =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "cyan"
  | "orange"
  | "pink"
  | "lime"
  | "teal"
  | "fuchsia"
  | "sky";

export const SUBJECT_COLOR_KEYS: SubjectColorKey[] = [
  "blue",
  "emerald",
  "amber",
  "rose",
  "violet",
  "cyan",
  "orange",
  "pink",
  "lime",
  "teal",
  "fuchsia",
  "sky",
];

export const SUBJECT_COLORS: Record<
  SubjectColorKey,
  {
    label: string;
    swatch: string; // solid background, e.g. dot/bar
    badge: string; // soft background + readable text for chips
    border: string; // strong border color
    softBg: string; // subtle tint for cards
  }
> = {
  blue: {
    label: "Azul",
    swatch: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
    border: "border-l-blue-500",
    softBg: "bg-blue-50/60 dark:bg-blue-950/30",
  },
  emerald: {
    label: "Verde",
    swatch: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
    border: "border-l-emerald-500",
    softBg: "bg-emerald-50/60 dark:bg-emerald-950/30",
  },
  amber: {
    label: "Âmbar",
    swatch: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
    border: "border-l-amber-500",
    softBg: "bg-amber-50/60 dark:bg-amber-950/30",
  },
  rose: {
    label: "Rosa",
    swatch: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900",
    border: "border-l-rose-500",
    softBg: "bg-rose-50/60 dark:bg-rose-950/30",
  },
  violet: {
    label: "Violeta",
    swatch: "bg-violet-500",
    badge: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900",
    border: "border-l-violet-500",
    softBg: "bg-violet-50/60 dark:bg-violet-950/30",
  },
  cyan: {
    label: "Ciano",
    swatch: "bg-cyan-500",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900",
    border: "border-l-cyan-500",
    softBg: "bg-cyan-50/60 dark:bg-cyan-950/30",
  },
  orange: {
    label: "Laranja",
    swatch: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
    border: "border-l-orange-500",
    softBg: "bg-orange-50/60 dark:bg-orange-950/30",
  },
  pink: {
    label: "Pink",
    swatch: "bg-pink-500",
    badge: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-900",
    border: "border-l-pink-500",
    softBg: "bg-pink-50/60 dark:bg-pink-950/30",
  },
  lime: {
    label: "Limão",
    swatch: "bg-lime-500",
    badge: "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-900",
    border: "border-l-lime-500",
    softBg: "bg-lime-50/60 dark:bg-lime-950/30",
  },
  teal: {
    label: "Turquesa",
    swatch: "bg-teal-500",
    badge: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-900",
    border: "border-l-teal-500",
    softBg: "bg-teal-50/60 dark:bg-teal-950/30",
  },
  fuchsia: {
    label: "Fúcsia",
    swatch: "bg-fuchsia-500",
    badge: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-900",
    border: "border-l-fuchsia-500",
    softBg: "bg-fuchsia-50/60 dark:bg-fuchsia-950/30",
  },
  sky: {
    label: "Azul-céu",
    swatch: "bg-sky-500",
    badge: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
    border: "border-l-sky-500",
    softBg: "bg-sky-50/60 dark:bg-sky-950/30",
  },
};

export function getSubjectColor(key: string | null | undefined) {
  if (!key) return SUBJECT_COLORS.blue;
  return SUBJECT_COLORS[key as SubjectColorKey] ?? SUBJECT_COLORS.blue;
}
