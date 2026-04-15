"use client";

import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";

type Question = {
  id: string;
  enunciado: string;
  formato: string;
  alternativas: string[] | null;
};

type AnswerFeedback = {
  correto: boolean;
  respostaCorreta: string;
  explicacao: string;
} | null;

const LETTER_LABELS = ["A", "B", "C", "D", "E"];

export function QuizQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  feedback,
  onSelectAnswer,
  onConfirm,
}: {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string;
  feedback: AnswerFeedback;
  onSelectAnswer: (answer: string) => void;
  onConfirm: () => void;
}) {
  const isCertoErrado = question.formato === "certo_errado";
  const isAnswered = feedback !== null;

  return (
    <div className="space-y-6">
      {/* Question header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold tabular-nums">
          Questão {questionIndex + 1} de {totalQuestions}
        </span>
      </div>

      {/* Enunciado */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{question.enunciado}</p>
      </div>

      {/* Options */}
      {isCertoErrado ? (
        <div className="grid grid-cols-2 gap-3">
          {(["certo", "errado"] as const).map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = feedback?.respostaCorreta === option;
            let variant = "border-border bg-card";
            if (isAnswered) {
              if (isCorrectAnswer) variant = "border-green-500 bg-green-50 dark:bg-green-950/30";
              else if (isSelected && !feedback.correto)
                variant = "border-red-500 bg-red-50 dark:bg-red-950/30";
            } else if (isSelected) {
              variant = "border-primary bg-primary/5";
            }

            return (
              <button
                key={option}
                type="button"
                disabled={isAnswered}
                onClick={() => onSelectAnswer(option)}
                className={cn(
                  "rounded-xl border-2 px-6 py-4 text-center text-base font-semibold capitalize transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-default",
                  variant,
                  !isAnswered && "hover:shadow-md"
                )}
              >
                {option === "certo" ? "Certo" : "Errado"}
              </button>
            );
          })}
        </div>
      ) : (
        <RadioGroup
          value={selectedAnswer}
          onValueChange={onSelectAnswer}
          disabled={isAnswered}
          className="space-y-2"
        >
          {question.alternativas?.map((alt, i) => {
            const letter = LETTER_LABELS[i].toLowerCase();
            const isSelected = selectedAnswer === letter;
            const isCorrectAnswer = feedback?.respostaCorreta === letter;
            let variant = "border-border bg-card";
            if (isAnswered) {
              if (isCorrectAnswer) variant = "border-green-500 bg-green-50 dark:bg-green-950/30";
              else if (isSelected && !feedback.correto)
                variant = "border-red-500 bg-red-50 dark:bg-red-950/30";
            } else if (isSelected) {
              variant = "border-primary bg-primary/5";
            }

            return (
              <Label
                key={letter}
                htmlFor={`option-${letter}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all",
                  !isAnswered && "hover:shadow-sm",
                  variant,
                  isAnswered && "cursor-default"
                )}
              >
                <RadioGroupItem value={letter} id={`option-${letter}`} className="mt-0.5" />
                <div className="flex-1">
                  <span className="mr-2 font-bold text-muted-foreground">
                    {LETTER_LABELS[i]})
                  </span>
                  <span className="text-sm leading-relaxed">{alt}</span>
                </div>
                {isAnswered && isCorrectAnswer && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                )}
                {isAnswered && isSelected && !feedback.correto && !isCorrectAnswer && (
                  <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                )}
              </Label>
            );
          })}
        </RadioGroup>
      )}

      {/* Confirm button (before answering) */}
      {!isAnswered && selectedAnswer && (
        <Button onClick={onConfirm} className="w-full gap-2" size="lg">
          Confirmar Resposta
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}

      {/* Feedback */}
      {isAnswered && (
        <div
          className={cn(
            "rounded-xl border-2 p-5",
            feedback.correto
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            {feedback.correto ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
                <span className="font-semibold text-green-700 dark:text-green-400">
                  Resposta Correta!
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                <span className="font-semibold text-red-700 dark:text-red-400">
                  Resposta Incorreta
                </span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{feedback.explicacao}</p>
        </div>
      )}
    </div>
  );
}
