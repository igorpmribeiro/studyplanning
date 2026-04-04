1. Visão Geral do Produto
Nome provisório

Gestor de Estudos Premium

Descrição

Aplicação web de uso pessoal voltada para candidatos de concursos da área de Direito, com foco em organização de matérias, cadastro de subtópicos e geração automática de planejamento semanal de estudos, considerando disponibilidade diária, prioridade das matérias e revisões.

Objetivo principal

Permitir que o usuário organize seu conteúdo programático e transforme esse conteúdo em um plano semanal prático, visual e inteligente, sem precisar montar cronogramas manualmente.

Objetivo do MVP

Entregar uma primeira versão funcional com:

cadastro manual de matérias
cadastro manual de subtópicos
configuração da disponibilidade semanal
geração automática de planejamento semanal
marcação de progresso
sugestão de revisão e dupla revisão
2. Problema

Estudantes de concursos da área de Direito normalmente enfrentam os seguintes problemas:

excesso de matérias e subtópicos
dificuldade para distribuir o conteúdo ao longo da semana
falta de clareza sobre o que estudar em cada dia
ausência de controle sobre revisões
necessidade de reorganizar o plano sempre que a rotina muda

Planilhas e listas simples resolvem apenas parte do problema, mas não automatizam a distribuição do conteúdo nem ajudam com revisões.

3. Proposta de Solução

Criar um sistema web leve, elegante e funcional que permita:

cadastrar matérias e subtópicos do edital manualmente
informar quanto tempo pode estudar por dia
gerar um cronograma semanal automático
equilibrar o estudo de diferentes matérias
incluir revisões de forma simples
acompanhar o que foi planejado e concluído
4. Escopo do MVP
Incluído no MVP
interface web com menu lateral
Home com visão geral
cadastro manual de matérias
cadastro manual de subtópicos
edição e exclusão de matérias e subtópicos
configuração de tempo disponível por dia da semana
geração automática de planejamento semanal
exibição do planejamento por dia
marcação de sessões como concluídas
indicação visual de sessões de:
estudo
revisão 1
revisão 2
persistência em banco de dados SQLite
backend API local
Fora do MVP
autenticação/login
múltiplos usuários
integração com APIs de concursos
importação por PDF
importação por IA
repetição espaçada avançada
relatórios estatísticos avançados
sincronização em nuvem
aplicativo mobile nativo
5. Público-Alvo
Público principal

Usuário individual que estuda para concursos da área de Direito e deseja um organizador de estudos simples, visual e inteligente.

Perfil inicial
uso pessoal
rotina de estudos semanal
preferência por planejamento claro e automatizado
necessidade de cadastrar conteúdos específicos de cada concurso
6. Objetivos de Produto
Objetivos de negócio

Mesmo sendo um produto pessoal inicialmente, o sistema deve nascer com base sólida para futura evolução.

Objetivos funcionais
centralizar matérias e subtópicos
reduzir o tempo gasto criando cronogramas manuais
melhorar a previsibilidade do estudo semanal
facilitar revisões básicas
manter experiência limpa e premium
Objetivos técnicos
arquitetura simples, organizada e escalável
baixo custo operacional
fácil manutenção
possibilidade futura de migração de SQLite para Postgres
7. Requisitos Funcionais
RF-01 — Home

O sistema deve exibir uma tela inicial com resumo do planejamento atual.

Deve mostrar
nome do planejamento atual
total de matérias cadastradas
total de subtópicos cadastrados
total de sessões planejadas para a semana
total de sessões concluídas
botão para gerar ou regenerar planejamento
RF-02 — Cadastro de Matérias

O sistema deve permitir o cadastro manual de matérias.

Campos da matéria
nome
prioridade
peso
observações
Ações
criar
editar
excluir
listar
RF-03 — Cadastro de Subtópicos

O sistema deve permitir cadastrar subtópicos vinculados a uma matéria.

Campos do subtópico
nome
tempo estimado em minutos
dificuldade
status
observações
Ações
criar
editar
excluir
listar dentro da matéria correspondente
RF-04 — Configuração de Disponibilidade Semanal

O sistema deve permitir informar o tempo disponível por dia da semana.

Campos
segunda-feira
terça-feira
quarta-feira
quinta-feira
sexta-feira
sábado
domingo

Cada campo será informado em minutos.

RF-05 — Geração Automática de Planejamento

O sistema deve gerar automaticamente um planejamento semanal com base em:

tempo disponível por dia
matérias cadastradas
subtópicos cadastrados
prioridade da matéria
peso da matéria
dificuldade do subtópico
tempo estimado do subtópico
RF-06 — Exibição do Planejamento por Dia

O sistema deve exibir o planejamento semanal organizado por dia.

Cada sessão deve mostrar
matéria
subtópico
tipo de sessão
duração
ordem dentro do dia
status
RF-07 — Tipos de Sessão

O sistema deve suportar os tipos:

estudo
revisão 1
revisão 2
RF-08 — Marcar Sessão como Concluída

O usuário deve poder marcar uma sessão planejada como concluída.

RF-09 — Regenerar Planejamento

O sistema deve permitir regenerar o planejamento semanal.

Regras
sessões futuras ainda não concluídas podem ser substituídas
sessões concluídas devem permanecer registradas
8. Requisitos Não Funcionais
RNF-01 — Desempenho

A aplicação deve responder rapidamente em operações comuns de cadastro, listagem e geração de planejamento.

RNF-02 — Usabilidade

A experiência deve ser simples, clara, organizada e agradável para uso diário.

RNF-03 — Persistência

Os dados devem ser persistidos em banco SQLite.

RNF-04 — Manutenibilidade

O projeto deve ser organizado em camadas claras e com tipagem forte.

RNF-05 — Escalabilidade futura

A estrutura deve permitir futura inclusão de:

importação por PDF
integração com IA
múltiplos planejamentos
relatórios
migração de banco
9. Regras de Negócio
RN-01

O sistema será inicialmente de uso pessoal e não exigirá autenticação.

RN-02

O cadastro de matérias será exclusivamente manual no MVP.

RN-03

Cada subtópico deve estar vinculado a uma única matéria.

RN-04

O planejamento será semanal.

RN-05

A geração do planejamento deve respeitar o tempo disponível por dia.

RN-06

Matérias com maior prioridade e maior peso devem ser favorecidas na geração.

RN-07

O sistema deve evitar, sempre que possível, concentração excessiva da mesma matéria em dias consecutivos.

RN-08

Cada sessão deve ocupar um bloco de tempo coerente com o tempo estimado do subtópico.

RN-09

Ao concluir um estudo, o sistema pode sugerir revisões futuras.

RN-10

Sessões de revisão devem ser identificadas visualmente de forma diferente das sessões de estudo.

10. Algoritmo Inicial de Planejamento
Objetivo

Distribuir subtópicos ao longo da semana respeitando disponibilidade e priorização.

Entrada
disponibilidade semanal por dia
lista de matérias
lista de subtópicos não concluídos
prioridade da matéria
peso da matéria
dificuldade do subtópico
tempo estimado do subtópico
Critérios de priorização

Pontuação inicial sugerida:

score = (peso da matéria * 3) + prioridade + fator de dificuldade + fator de status

Sugestão de pesos internos
prioridade baixa = 1
prioridade média = 2
prioridade alta = 3
dificuldade baixa = 1
dificuldade média = 2
dificuldade alta = 3
status não iniciado = 3
status em andamento = 2
status revisando = 1
status concluído = 0
Estratégia de distribuição
ordenar subtópicos por score
percorrer os dias da semana
preencher cada dia até o limite de minutos disponível
tentar alternar matérias
reservar pequena fatia para revisão, se aplicável
criar sessões com tipo:
estudo
revisão 1
revisão 2
Lógica inicial de revisão

Versão simplificada para MVP:

ao criar uma sessão de estudo para um subtópico, o sistema poderá prever:
uma revisão 1 em data futura
uma revisão 2 em outra data futura
Regra sugerida no MVP
revisão 1: primeiro dia útil disponível após o estudo
revisão 2: um novo dia posterior dentro da janela da semana seguinte ou replanejamento futuro

No MVP, isso pode ser mantido de forma simples, inclusive somente como “sessões sugeridas” sem automatização complexa de calendário.

11. Fluxo do Usuário
Fluxo principal
acessar Home
entrar em “Adicionar Matérias”
cadastrar matérias
cadastrar subtópicos em cada matéria
ir para “Planejamento”
informar minutos disponíveis por dia
clicar em “Gerar planejamento”
visualizar cronograma da semana
marcar sessões como concluídas
regenerar a semana quando necessário
12. Estrutura de Telas
12.1 Home
Objetivo

Apresentar visão consolidada da semana e atalhos principais.

Componentes
card de total de matérias
card de total de subtópicos
card de sessões planejadas
card de sessões concluídas
botão “Gerar planejamento”
bloco com resumo da semana
12.2 Adicionar Matérias
Objetivo

Cadastrar e organizar conteúdo programático.

Componentes
formulário de criação de matéria
lista de matérias
botão de expandir matéria
formulário de criação de subtópico dentro da matéria
ações de editar e excluir
UX esperada
visual limpo
feedback claro ao salvar
organização por blocos
expansão recolhível por matéria
12.3 Planejamento
Objetivo

Configurar disponibilidade e visualizar a semana.

Componentes
formulário de disponibilidade semanal
botão “Gerar planejamento”
agenda semanal dividida por dia
cards de sessão
botão para concluir sessão
botão para regenerar semana
Exibição por sessão
nome da matéria
nome do subtópico
duração
tipo da sessão
status
13. Modelo de Dados
Entidades principais
Planning

Representa o planejamento principal do usuário.

Campos:

id
nome
descricao
createdAt
updatedAt
Subject

Representa a matéria.

Campos:

id
planningId
nome
prioridade
peso
observacoes
createdAt
updatedAt
Topic

Representa o subtópico da matéria.

Campos:

id
subjectId
nome
tempoEstimadoMin
dificuldade
status
observacoes
createdAt
updatedAt
WeeklyAvailability

Representa disponibilidade da semana.

Campos:

id
planningId
segundaMin
tercaMin
quartaMin
quintaMin
sextaMin
sabadoMin
domingoMin
createdAt
updatedAt
PlannedSession

Representa cada sessão planejada.

Campos:

id
planningId
data
diaSemana
subjectId
topicId
tipoSessao
duracaoMin
ordemNoDia
status
createdAt
updatedAt
14. Sugestão de Schema Relacional
Planning
id PK
nome
descricao
created_at
updated_at
Subject
id PK
planning_id FK
nome
prioridade
peso
observacoes
created_at
updated_at
Topic
id PK
subject_id FK
nome
tempo_estimado_min
dificuldade
status
observacoes
created_at
updated_at
WeeklyAvailability
id PK
planning_id FK
segunda_min
terca_min
quarta_min
quinta_min
sexta_min
sabado_min
domingo_min
created_at
updated_at
PlannedSession
id PK
planning_id FK
data
dia_semana
subject_id FK
topic_id FK
tipo_sessao
duracao_min
ordem_no_dia
status
created_at
updated_at
15. API — Endpoints Sugeridos
Planning
GET /planning
POST /planning
PUT /planning/:id
Subjects
GET /subjects
POST /subjects
PUT /subjects/:id
DELETE /subjects/:id
Topics
GET /subjects/:subjectId/topics
POST /subjects/:subjectId/topics
PUT /topics/:id
DELETE /topics/:id
Weekly Availability
GET /weekly-availability/:planningId
PUT /weekly-availability/:planningId
Planning Sessions
POST /planning/:planningId/generate
GET /planning/:planningId/sessions
PATCH /sessions/:id/complete
POST /planning/:planningId/regenerate
16. Stack Técnica Recomendada
Frontend
React
TypeScript
Vite
Tailwind CSS
React Router
React Query
React Hook Form
Zod
Backend
Node.js
Express
TypeScript
Prisma ou Drizzle
SQLite
Motivo da escolha
leveza
produtividade
boa manutenção
baixa complexidade inicial
fácil evolução futura
17. Arquitetura Recomendada
Frontend
pages
components
hooks
services
types
utils
Backend
controllers
services
repositories
routes
schemas
database
Padrão sugerido

Controller → Service → Repository

Assim você mantém:

regra de negócio em Service
acesso a dados em Repository
request/response em Controller
18. Critérios de Aceite do MVP

O MVP será considerado aceito quando:

o usuário conseguir cadastrar matérias
o usuário conseguir cadastrar subtópicos
o usuário conseguir editar e excluir ambos
o usuário conseguir informar a disponibilidade semanal
o sistema gerar um plano semanal automaticamente
o sistema exibir as sessões organizadas por dia
o usuário conseguir concluir sessões
o sistema diferenciar estudo, revisão 1 e revisão 2
os dados permanecerem salvos entre usos
a interface estiver organizada, limpa e funcional
19. Riscos do MVP
Risco 1

Algoritmo de planejamento simples demais gerar cronogramas pouco naturais.

Mitigação

Começar com lógica simples e previsível, evoluindo depois com ajustes finos.

Risco 2

Subtópicos com tempos mal cadastrados gerarem distribuição ruim.

Mitigação

Permitir edição rápida e exibir claramente o tempo total por dia.

Risco 3

Usuário cadastrar muitas matérias sem organização.

Mitigação

Adicionar filtros, ordenação e agrupamento por matéria.

20. Melhorias Futuras
Fase 2
importação de edital por PDF
extração por IA
revisão da estrutura antes de salvar
Fase 3
base própria de concursos
concursos pré-cadastrados
múltiplos planejamentos
Fase 4
dashboard de evolução
relatórios por matéria
revisão espaçada mais inteligente
histórico completo de semanas
Fase 5
sincronização em nuvem
autenticação
multi-dispositivo
21. Resumo Executivo

O MVP do Gestor de Estudos Premium será uma aplicação web de uso pessoal para concursos de Direito, focada em:

cadastro manual de matérias e subtópicos
configuração de tempo disponível por dia
geração automática de cronograma semanal
revisões simples
experiência premium e organizada

A solução será construída com React + TypeScript + Tailwind no frontend e Node.js + Express + SQLite no backend, com arquitetura simples, sólida e preparada para crescer.
