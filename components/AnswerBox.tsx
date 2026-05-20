"use client";
import { RefObject } from "react";

interface AnswerBoxProps {
  answer: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export default function AnswerBox({ answer, onChange, onSubmit, inputRef }: AnswerBoxProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 32,
      }}
    >
      <p
        style={{
          fontSize: 14,
          color: "var(--muted)",
          marginBottom: 16,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
        }}
      >
        YOUR ANSWER
      </p>
      <textarea
        ref={inputRef}
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here... Be thorough and clear."
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === "Enter") onSubmit();
        }}
      />
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
        {answer.length} characters • Ctrl+Enter to submit
      </p>
    </div>
  );
}