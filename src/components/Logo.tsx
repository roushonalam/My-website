interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 34 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#1E1B4B" />
      {/* Open Book */}
      <path
        d="M13 24c6.5-3.2 13.5-2.2 19 2.2C37.5 21.8 44.5 20.8 51 24v22.5c-6.5-3.2-13.5-2.2-19 2.2-5.5-4.4-12.5-5.4-19-2.2V24z"
        stroke="#E0E7FF"
        strokeWidth="2.8"
        strokeLinejoin="round"
        fill="#312E81"
      />
      <path d="M32 26.2V48.7" stroke="#A5B4FC" strokeWidth="2.2" strokeLinecap="round" />
      {/* Neural Network Nodes */}
      <circle cx="17" cy="16" r="2.7" fill="#10B981" />
      <circle cx="47" cy="16" r="2.7" fill="#10B981" />
      <circle cx="23" cy="34" r="2" fill="#A5B4FC" />
      <circle cx="41" cy="34" r="2" fill="#A5B4FC" />
      <path
        d="M19.5 16.8L26.5 18.2M44.5 16.8L37.5 18.2M23 34L32 26.2M41 34L32 26.2"
        stroke="#10B981"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* AI Sparkle */}
      <path
        d="M32 9.5l2.6 5.6 5.6 2.6-5.6 2.6L32 26l-2.6-5.7-5.6-2.6 5.6-2.6L32 9.5z"
        fill="#7C3AED"
        stroke="#DDD6FE"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
