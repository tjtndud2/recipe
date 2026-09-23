"use client";

// 원본 세 화면 하단에 공통으로 있던 토스트.

export default function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 20,
        transform: "translateX(-50%)",
        background: "#3b2418",
        color: "#fff1d6",
        border: "4px solid #f7b733",
        padding: "10px 18px",
        fontFamily: "'Galmuri11','Galmuri9',monospace",
        fontWeight: 700,
        fontSize: 14,
        zIndex: 10,
        maxWidth: 1000,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}
