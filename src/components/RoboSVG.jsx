// Robô fofo desenhado em SVG (usado no picker de avatar e no menu).
// Recebe uma cor (ex.: "#51cf66"). Mesma cara do robô do jogo (Phaser).
export default function RoboSVG({ cor = "#51cf66", tamanho = 64 }) {
  const c = /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : "#51cf66";
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-hidden="true">
      {/* Antena */}
      <line x1="60" y1="18" x2="60" y2="8" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="7" r="6" fill="#ffd43b" />
      {/* Orelhas */}
      <rect x="8" y="52" width="12" height="30" rx="6" fill={c} opacity="0.8" />
      <rect x="100" y="52" width="12" height="30" rx="6" fill={c} opacity="0.8" />
      {/* Corpo/cabeça */}
      <rect x="18" y="20" width="84" height="92" rx="22" fill={c} />
      {/* Tela do rosto */}
      <rect x="30" y="34" width="60" height="42" rx="14" fill="#1e293b" />
      {/* Olhos */}
      <circle cx="48" cy="52" r="8" fill="#ffffff" />
      <circle cx="72" cy="52" r="8" fill="#ffffff" />
      <circle cx="50" cy="54" r="4" fill="#0b1120" />
      <circle cx="74" cy="54" r="4" fill="#0b1120" />
      {/* Sorriso */}
      <path d="M48 64 Q60 74 72 64" stroke="#ffd43b" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Painel da barriga */}
      <rect x="42" y="86" width="36" height="18" rx="8" fill="#ffffff" opacity="0.85" />
      <circle cx="50" cy="95" r="3" fill="#ffd43b" />
      <circle cx="60" cy="95" r="3" fill="#ffd43b" />
      <circle cx="70" cy="95" r="3" fill="#ffd43b" />
    </svg>
  );
}
