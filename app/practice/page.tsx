'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTestQuestions } from '@/lib/getTestQuestions';
import { Answer } from '@/types';

export default function PracticePage() {
  const router = useRouter();
  const questions = getTestQuestions();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerSelect = (questionId: string, selectedIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedIndex,
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    if (Object.keys(answers).length !== 10) {
      setError('Please answer all 10 questions before submitting.');
      return;
    }

    // Validate answer format
    const answerArray: Answer[] = [];
    for (const question of questions) {
      const selectedAnswer = answers[question.id];
      if (selectedAnswer === undefined || selectedAnswer < 0 || selectedAnswer > 3) {
        setError(`Invalid answer for question ${question.id}`);
        return;
      }
      answerArray.push({
        questionId: question.id,
        selectedAnswer: selectedAnswer,
      });
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/practice/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_alex', // Hardcoded for MVP
          answers: answerArray,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit practice test');
      }

      const data = await response.json();
      // Redirect to results page
      router.push(`/results/${data.resultId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-8">Practice Test</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-8 mb-8">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="mb-4 text-sm text-gray-600">
                Question {index + 1} of 10
              </div>
              <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      answers[question.id] === optionIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optionIndex}
                      checked={answers[question.id] === optionIndex}
                      onChange={() => handleAnswerSelect(question.id, optionIndex)}
                      className="mr-3"
                      disabled={isSubmitting}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length !== 10}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Test'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
