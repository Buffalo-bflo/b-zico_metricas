"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/designTokens";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.error || "Não foi possível entrar.");
        setCarregando(false);
        return;
      }
      router.push("/geral");
      router.refresh();
    } catch {
      setErro("Não foi possível conectar. Tenta de novo.");
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAFAFA",
        fontFamily: "'Montserrat', sans-serif",
        padding: 20,
      }}
    >
      <form
        onSubmit={entrar}
        style={{
          background: C.branco,
          border: `1px solid ${C.linha}`,
          borderRadius: 6,
          padding: "36px 32px",
          width: "100%",
          maxWidth: 340,
        }}
      >
        <img src="/logo-bazico.png" alt="BÁZICO" style={{ height: 22, marginBottom: 6 }} />
        <div
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 300,
            fontSize: 13,
            color: C.cinza,
            marginBottom: 24,
          }}
        >
          Métricas Orgânicas · Instagram
        </div>

        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: C.cinza,
            marginBottom: 6,
          }}
        >
          Senha de acesso
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={{
            display: "block",
            width: "100%",
            padding: "9px 10px",
            fontSize: 14,
            border: `1px solid ${C.linha}`,
            borderRadius: 3,
            color: C.preto,
            marginBottom: 16,
          }}
        />

        {erro && (
          <div style={{ fontSize: 12, color: "#B3261E", marginBottom: 12 }}>{erro}</div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="baz-btn-primary"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            padding: "10px 16px",
            width: "100%",
            background: C.preto,
            color: C.branco,
            border: "none",
            borderRadius: 3,
            cursor: carregando ? "default" : "pointer",
            opacity: carregando ? 0.6 : 1,
          }}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
