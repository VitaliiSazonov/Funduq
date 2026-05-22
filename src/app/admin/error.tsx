"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] error boundary:", error);
  }, [error]);

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Что-то пошло не так в админ-панели</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        {error.message || "Неизвестная ошибка"}
        {error.digest ? ` (digest: ${error.digest})` : null}
      </p>
      <button
        onClick={() => reset()}
        style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
      >
        Попробовать снова
      </button>
    </div>
  );
}
