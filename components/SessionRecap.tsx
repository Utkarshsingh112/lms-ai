"use client";

import React, { useEffect, useState } from "react";

import { generateSessionRecap } from "@/lib/actions/recap.action";
import { cn } from "@/lib/utils";
import type { RecapResult } from "@/lib/validations/recap";
import type { SavedMessage } from "@/types/companion";

interface SessionRecapProps {
  companionId: string;
  messages: SavedMessage[];
}

// The call can emit its last transcript lines just after it ends, so wait for
// the transcript to settle before asking for a recap.
const SETTLE_MS = 1200;

const SessionRecap = ({ companionId, messages }: SessionRecapProps) => {
  const [result, setResult] = useState<RecapResult | "loading" | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setAnswers({});

    const timer = setTimeout(() => {
      setResult("loading");
      generateSessionRecap({ companionId, messages })
        .then((next) => {
          if (!cancelled) setResult(next);
        })
        .catch((error) => {
          console.error("Failed to generate recap:", error);
          if (!cancelled) {
            setResult({
              status: "error",
              message: "We couldn't build a recap this time.",
            });
          }
        });
    }, SETTLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [companionId, messages]);

  if (result === null) {
    return null;
  }

  if (result === "loading") {
    return (
      <div
        className="flex items-center gap-3 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <span className="size-3 animate-pulse rounded-full bg-primary" />
        Writing your recap and quiz…
      </div>
    );
  }

  if (result.status !== "ok") {
    return <p className="text-sm text-muted-foreground">{result.message}</p>;
  }

  const { recap } = result;
  const answered = Object.keys(answers).length;
  const score = recap.quiz.filter(
    (question, index) => answers[index] === question.answer_index
  ).length;

  return (
    <div className="flex flex-col gap-5 border-t border-black/10 pt-5">
      <section aria-labelledby="recap-heading" className="flex flex-col gap-3">
        <h3 id="recap-heading" className="text-xl font-bold">
          Your recap
        </h3>
        <p>{recap.summary}</p>
        <ul className="list-disc pl-5">
          {recap.key_points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="quiz-heading" className="flex flex-col gap-4">
        <h3 id="quiz-heading" className="text-xl font-bold">
          Quick quiz
        </h3>

        {recap.quiz.map((question, questionIndex) => {
          const chosen = answers[questionIndex];
          const hasAnswered = chosen !== undefined;

          return (
            <fieldset key={question.question} className="flex flex-col gap-2">
              <legend className="mb-1 font-medium">
                {questionIndex + 1}. {question.question}
              </legend>

              {question.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.answer_index;
                const isChosen = chosen === optionIndex;

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={hasAnswered}
                    aria-pressed={isChosen}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [questionIndex]: optionIndex,
                      }))
                    }
                    className={cn(
                      "rounded-xl border px-4 py-2 text-left transition-colors",
                      !hasAnswered && "border-black hover:bg-gray-100",
                      hasAnswered && isCorrect && "border-green-700 bg-green-100",
                      hasAnswered &&
                        isChosen &&
                        !isCorrect &&
                        "border-red-700 bg-red-100",
                      hasAnswered && !isCorrect && !isChosen && "border-gray-300 text-gray-500"
                    )}
                  >
                    {option}
                    {hasAnswered && isCorrect ? " ✓" : ""}
                  </button>
                );
              })}

              {hasAnswered ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {chosen === question.answer_index ? "Correct. " : "Not quite. "}
                  {question.explanation}
                </p>
              ) : null}
            </fieldset>
          );
        })}

        {answered === recap.quiz.length ? (
          <p className="font-bold" role="status">
            You scored {score} out of {recap.quiz.length}.
          </p>
        ) : null}
      </section>

      {!result.saved ? (
        <p className="text-xs text-muted-foreground">
          This recap wasn&apos;t saved to your account.
        </p>
      ) : null}
    </div>
  );
};

export default SessionRecap;
