/**
 * The hand-drawn marker stroke under the wordmark, as on zerith.studio —
 * a thick two-hump wave in the brand's orange-to-red ramp.
 */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 170 22"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="squiggle-ramp" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brand-from)" />
          <stop offset="100%" stopColor="var(--brand-to)" />
        </linearGradient>
      </defs>
      <path
        d="M5 13.5C21 3 37 20.5 55 11.5S91 2.5 108 13 143 19 165 7"
        stroke="url(#squiggle-ramp)"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
