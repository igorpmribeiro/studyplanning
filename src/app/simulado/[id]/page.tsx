"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizQuestionCard } from "@/components/simulado/quiz-question-card";
import { QuizNavigation } from "@/components/simulado/quiz-navigation";
import { QuizTimer } from "@/components/simulado/quiz-timer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  submitQuizAnswer,
  completeQuizSession,
  getQuizSession,
  getQuizQuestionsBySession,
} from "@/actions/simulado";
import { BANCA_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

type Question = {
  id: string;
  enunciado: string;
  formato: string;
  alternativas: string[] | null;
  topicId: string;
  subjectId: string;
};

type AnswerFeedback = {
  correto: boolean;
  respostaCorreta: string;
  explicacao: string;
};

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [banca, setBanca] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, AnswerFeedback>>({});
  const [loading, setLoading] = useState(true);

  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    async function load() {
      // 1. Try sessionStorage first (fresh start from config form)
      const stored = sessionStorage.getItem(`quiz-${params.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Question[];
          setQuestions(parsed);
          sessionStorage.removeItem(`quiz-${params.id}`);

          // Get banca from session
          const session = await getQuizSession(params.id);
          if (session) setBanca(session.banca);
          setLoading(false);
          return;
        } catch {
          // fall through to server load
        }
      }

      // 2. Load from server (page refresh or resume)
      const session = await getQuizSession(params.id);
      if (!session) {
        toast.error("Simulado não encontrado");
        router.push("/simulado");
        return;
      }

      if (session.completedAt) {
        router.push(`/simulado/${params.id}/resultado`);
        return;
      }

      setBanca(session.banca);

      // Restore answers if any
      if (session.answers.length > 0) {
        const qs = session.answers.map((a) => ({
          id: a.question.id,
          enunciado: a.question.enunciado,
          formato: a.question.formato,
          alternativas: a.question.alternativas
            ? (JSON.parse(a.question.alternativas) as string[])
            : null,
          topicId: a.question.topicId,
          subjectId: a.question.subjectId,
        }));

        const restoredAnswers: Record<string, string> = {};
        const restoredFeedbacks: Record<string, AnswerFeedback> = {};
        for (const a of session.answers) {
          restoredAnswers[a.questionId] = a.respostaUsuario;
          restoredFeedbacks[a.questionId] = {
            correto: a.correto === 1,
            respostaCorreta: a.question.respostaCorreta,
            explicacao: a.question.explicacao,
          };
        }

        setQuestions(qs);
        setAnswers(restoredAnswers);
        setFeedbacks(restoredFeedbacks);
        // Go to first unanswered
        const firstUnanswered = qs.findIndex((q) => !restoredFeedbacks[q.id]);
        if (firstUnanswered >= 0) setCurrentIndex(firstUnanswered);
      } else {
        // No answers yet - load questions from cache
        const qs = await getQuizQuestionsBySession(params.id);
        if (qs && qs.length > 0) {
          setQuestions(qs);
        } else {
          toast.error("Questões não encontradas");
          router.push("/simulado");
          return;
        }
      }

      setLoading(false);
    }
    load();
  }, [params.id, router]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(feedbacks).length;

  function handleSelectAnswer(answer: string) {
    if (!currentQuestion || feedbacks[currentQuestion.id]) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  }

  function handleConfirm() {
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.id];
    if (!answer) return;

    startTransition(async () => {
      const result = await submitQuizAnswer({
        quizSessionId: params.id,
        questionId: currentQuestion.id,
        respostaUsuario: answer,
      });

      if (result.success) {
        setFeedbacks((prev) => ({
          ...prev,
          [currentQuestion.id]: result.data,
        }));
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleFinish() {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    startTransition(async () => {
      const result = await completeQuizSession(params.id, elapsed);
      if (result.success) {
        router.push(`/simulado/${params.id}/resultado`);
      } else {
        toast.error("Erro ao finalizar simulado");
      }
    });
  }

  if (loading || questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-10 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Simulado</h1>
            <Badge variant="secondary" className="text-xs">
              {BANCA_LABELS[banca as keyof typeof BANCA_LABELS] || banca}
            </Badge>
          </div>
        </div>
        <QuizTimer />
      </div>

      {/* Question */}
      {currentQuestion && (
        <QuizQuestionCard
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestion.id] ?? ""}
          feedback={feedbacks[currentQuestion.id] ?? null}
          onSelectAnswer={handleSelectAnswer}
          onConfirm={handleConfirm}
        />
      )}

      {/* Navigation */}
      <QuizNavigation
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        isCurrentAnswered={!!currentQuestion && !!feedbacks[currentQuestion.id]}
        onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
        onFinish={handleFinish}
      />
    </div>
  );
}
