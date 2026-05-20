"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SessionCard from "@/components/SessionCard";
import QuestionCard from "@/components/QuestionCard";
import AnswerBox from "@/components/AnswerBox";
import FeedbackCard from "@/components/FeedbackCard";

// ── Global styles ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:        #070B12;
    --surface:   #0C1120;
    --card:      #101825;
    --border:    #1C2B40;
    --border2:   #243248;
    --lime:      #AAFF3C;
    --cyan:      #00E5C3;
    --violet:    #A78BFA;
    --coral:     #FF6B6B;
    --text:      #E8EFF8;
    --muted:     #5A6A85;
    --muted2:    #3A4D66;
    --font-head: 'Syne', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  .dot-grid {
    background-image: radial-gradient(circle, #1C2B40 1px, transparent 1px);
    background-size: 28px 28px;
  }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border); }
  textarea {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    color: var(--text) !important;
    border-radius: 12px !important;
    padding: 14px 16px !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
    width: 100% !important;
    outline: none !important;
    transition: all 0.2s !important;
    resize: vertical !important;
    min-height: 120px !important;
  }
  textarea:focus { border-color: var(--lime) !important; box-shadow: 0 0 0 3px rgba(170,255,60,0.1) !important; }
  textarea::placeholder { color: var(--muted) !important; }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: string;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

interface QuestionResponse {
  questionId: string;
  answerText: string;
  feedback?: Feedback;
  answered?: boolean;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params) as { id: string };
  const { data: session } = useSession();
  const router = useRouter();

  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // ── Fetch session ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/session/${id}`);
        if (!res.ok) {
          toast.error("Failed to load session");
          router.push("/dashboard/interview");
          return;
        }
        const data = await res.json();
        setSessionData(data.session);
        setLoading(false);
        setQuestionStartTime(Date.now());
      } catch (err) {
        console.error("Error loading session:", err);
        toast.error("Error loading session");
        router.push("/dashboard/interview");
      }
    };

    if (id) fetchSession();
  }, [id, router]);

  // ── Submit answer ─────────────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim()) {
      toast.error("Please provide an answer");
      return;
    }
    if (!sessionData) return;

    const currentQuestion: Question = sessionData.questions[currentQuestionIndex];
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

    setSubmitting(true);
    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          answerText: answer.trim(),
          timeTakenSecs: timeTaken,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to get feedback");
        return;
      }

      const data = await res.json();
      const newResponse: QuestionResponse = {
        questionId: currentQuestion.id,
        answerText: answer.trim(),
        feedback: data.feedback,
        answered: true,
      };

      setResponses((prev) => [...prev, newResponse]);
      setCurrentFeedback(data.feedback);
      setShowFeedback(true);

      if (data.progress.completed) setSessionCompleted(true);
    } catch (err) {
      console.error("Error submitting answer:", err);
      toast.error("Error processing your answer");
    } finally {
      setSubmitting(false);
    }
  }, [answer, sessionData, currentQuestionIndex, questionStartTime, id]);

  // ── Next question ─────────────────────────────────────────────────────────
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < sessionData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAnswer("");
      setShowFeedback(false);
      setCurrentFeedback(null);
      setQuestionStartTime(Date.now());
      answerInputRef.current?.focus();
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    } else {
      setSessionCompleted(true);
    }
  }, [currentQuestionIndex, sessionData]);

  const handleViewResult = useCallback(() => {
    router.push(`/dashboard/history?session=${id}`);
  }, [id, router]);

  // ── Loading / empty states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--bg)",
        }}
      >
        <style>{STYLES}</style>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "var(--lime)",
          }}
        />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--bg)",
        }}
      >
        <style>{STYLES}</style>
        <p style={{ color: "var(--muted)" }}>Session not found</p>
      </div>
    );
  }

  const currentQuestion: Question = sessionData.questions[currentQuestionIndex];
  const totalQuestions: number = sessionData.questions.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <style>{STYLES}</style>
      <ToastContainer position="bottom-right" theme="dark" />

      {/* ── Sidebar ── */}
      <SessionCard
        role={sessionData.role}
        difficulty={sessionData.difficulty}
        questions={sessionData.questions}
        responses={responses}
        currentQuestionIndex={currentQuestionIndex}
        showFeedback={showFeedback}
        startTime={startTime}
        onQuestionClick={(idx) => setCurrentQuestionIndex(idx)}
      />

      {/* ── Main ── */}
      <main
        className="dot-grid"
        style={{ flex: 1, display: "flex", flexDirection: "column", maxHeight: "100vh", overflow: "hidden" }}
      >
        {/* Question header */}
        <QuestionCard
          questionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          text={currentQuestion.text}
          category={currentQuestion.category}
          difficulty={currentQuestion.difficulty}
        />

        {/* Scrollable content */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
          <AnimatePresence mode="wait">
            {!showFeedback ? (
              /* ── Answer view ── */
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ maxWidth: 800 }}
              >
                <AnswerBox
                  answer={answer}
                  onChange={setAnswer}
                  onSubmit={handleSubmitAnswer}
                  inputRef={answerInputRef}
                />
              </motion.div>
            ) : sessionCompleted ? (
              /* ── Completed view ── */
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "60vh",
                  gap: 20,
                  maxWidth: 600,
                  margin: "0 auto",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h2
                  style={{
                    fontFamily: "var(--font-head)",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "var(--text)",
                    textAlign: "center",
                  }}
                >
                  Interview Completed!
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--muted)",
                    textAlign: "center",
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  Great job! You've completed all {totalQuestions} questions. Let's see how you performed.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewResult}
                  style={{
                    padding: "12px 32px",
                    background: "linear-gradient(90deg, var(--lime), var(--cyan))",
                    border: "none",
                    borderRadius: 10,
                    color: "#070B12",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  View Detailed Results
                </motion.button>
              </motion.div>
            ) : (
              /* ── Feedback view ── */
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ maxWidth: 800 }}
              >
                {currentFeedback && (
                  <FeedbackCard answer={answer} feedback={currentFeedback} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer actions ── */}
        <div
          style={{
            padding: "20px 40px",
            borderTop: "1px solid var(--border)",
            background: "rgba(7, 11, 18, 0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {!showFeedback ? (
            <>
              <button
                onClick={() => router.push("/dashboard/interview")}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--coral)";
                  (e.target as HTMLElement).style.color = "var(--coral)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--border)";
                  (e.target as HTMLElement).style.color = "var(--text)";
                }}
              >
                Exit Interview
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitAnswer}
                disabled={submitting || !answer.trim()}
                style={{
                  padding: "10px 28px",
                  background:
                    submitting || !answer.trim()
                      ? "var(--border)"
                      : "linear-gradient(90deg, var(--lime), var(--cyan))",
                  border: "none",
                  borderRadius: 10,
                  color: "#070B12",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting || !answer.trim() ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-body)",
                  opacity: submitting || !answer.trim() ? 0.6 : 1,
                }}
              >
                {submitting ? "Processing..." : "Submit Answer"}
              </motion.button>
            </>
          ) : sessionCompleted ? null : (
            <>
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setAnswer("");
                }}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--cyan)";
                  (e.target as HTMLElement).style.color = "var(--cyan)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--border)";
                  (e.target as HTMLElement).style.color = "var(--text)";
                }}
              >
                Edit Answer
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextQuestion}
                style={{
                  padding: "10px 28px",
                  background: "linear-gradient(90deg, var(--lime), var(--cyan))",
                  border: "none",
                  borderRadius: 10,
                  color: "#070B12",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                {currentQuestionIndex === totalQuestions - 1 ? "Complete Interview" : "Next Question"}
              </motion.button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}