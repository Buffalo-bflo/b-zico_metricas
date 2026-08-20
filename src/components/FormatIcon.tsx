const PATHS: Record<string, React.ReactNode> = {
  Reels: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l6 3.5-6 3.5v-7z" />
    </>
  ),
  Carrossel: (
    <>
      <rect x="4" y="7" width="13" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
    </>
  ),
  Imagem: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5-4 4-3-3-5 5" />
    </>
  ),
  Story: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

/** Ícone traçado de 1 peso, um por formato de post — nunca emoji/glifo genérico
    (ver craft floor). Cor sempre herdada da cor categórica do tipo (TIPO_COLORS). */
export function FormatIcon({ tipo, size = 18, color }: { tipo: string; size?: number; color: string }) {
  const path = PATHS[tipo];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
