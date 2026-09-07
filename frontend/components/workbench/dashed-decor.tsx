/**
 * The dashed route that sweeps across zerith.studio's hero — a thin
 * rounded-corner path in the decor grey. Purely decorative and inert.
 */
export function DashedDecor() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-decor"
      preserveAspectRatio="none"
      viewBox="0 0 1000 600"
      fill="none"
      aria-hidden
    >
      {/* Drops in from the top right, turns, and runs off to the right. */}
      <path
        d="M760 -40 V150 Q760 210 820 210 H1040"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="7 9"
      />
      {/* Comes in low from the left, turns, and drops off the bottom. */}
      <path
        d="M-40 430 H470 Q530 430 530 490 V660"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="7 9"
      />
    </svg>
  );
}
