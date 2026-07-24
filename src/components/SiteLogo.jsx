import { useId } from 'react'

/** Logo nidham — badge noir/blanc, texte nid+ham, flèche dorée */
export default function SiteLogo({ className = '' }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `site-logo-arrow-grad-${uid}`

  return (
    <span className={`site-logo ${className}`.trim()} role="img" aria-label="Nidham">
      <svg
        className="site-logo-mark"
        viewBox="0 0 132 44"
        width="132"
        height="44"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8c547" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>
        <rect
          x="0.5"
          y="0.5"
          width="131"
          height="43"
          rx="9"
          fill="#0a0e1a"
          stroke="#f9fafb"
          strokeWidth="1"
        />
        <text
          x="66"
          y="24"
          textAnchor="middle"
          fontSize="14.5"
          fontWeight="800"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          letterSpacing="0.05em"
        >
          <tspan fill="#f9fafb">nid</tspan>
          <tspan fill="#d4af37">ham</tspan>
        </text>
        <path
          d="M 34 32.5 C 48 40, 84 40, 98 32.5"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M 92.5 30.2 L 99.5 32.5 L 92.5 34.8"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
