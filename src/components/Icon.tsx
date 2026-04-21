import type { IconName } from '../types';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const PATHS: Record<IconName, JSX.Element> = {
  check:      <path d="M4 10l4 4 8-9" />,
  plus:       <path d="M10 4v12M4 10h12" />,
  x:          <path d="M5 5l10 10M15 5L5 15" />,
  chevron:    <path d="M7 4l6 6-6 6" />,
  chevronLeft:<path d="M13 4l-6 6 6 6" />,
  chevronDown:<path d="M4 7l6 6 6-6" />,
  back:       <path d="M9 4l-5 6 5 6M4 10h14" />,
  flame:      <path d="M10 2c2 3 5 4 5 8a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-5 1-7z" />,
  bell:       <path d="M10 3a4 4 0 00-4 4v3l-2 3h12l-2-3V7a4 4 0 00-4-4zM8 17a2 2 0 004 0" />,
  calendar:   <path d="M4 6h12v10H4zM7 3v4M13 3v4M4 9h12" />,
  stats:      <path d="M4 16V8M10 16V4M16 16v-6" />,
  moon:       <path d="M15 11a5 5 0 01-6-6 5 5 0 106 6z" />,
  sun:        <path d="M10 5V2M10 18v-3M5 10H2M18 10h-3M5.5 5.5L3.5 3.5M16.5 16.5l-2-2M5.5 14.5l-2 2M16.5 3.5l-2 2" />,
  profile:    <path d="M10 10a3 3 0 100-6 3 3 0 000 6zM4 17a6 6 0 0112 0" />,
  settings:   <path d="M10 12a2 2 0 100-4 2 2 0 000 4zM10 3v2M10 15v2M4.5 4.5l1.5 1.5M14 14l1.5 1.5M3 10h2M15 10h2M4.5 15.5L6 14M14 6l1.5-1.5" />,
  book:       <path d="M4 4h5a2 2 0 012 2v10a2 2 0 00-2-2H4zM16 4h-5a2 2 0 00-2 2v10a2 2 0 012-2h5z" />,
  run:        <path d="M7 4a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM6 17l2-5-3-2 2-3h3l2 2 2 1M11 11l1 3-1 3" />,
  droplet:    <path d="M10 3c-2 3-5 5-5 9a5 5 0 0010 0c0-4-3-6-5-9z" />,
  leaf:       <path d="M4 16c0-7 5-12 12-12-1 7-5 12-12 12zM4 16l6-6" />,
  clock:      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zM10 5v5l3 2" />,
  edit:       <path d="M13 3l4 4L7 17H3v-4L13 3z" />,
  trash:      <path d="M4 6h12M8 6V4h4v2M5 6l1 11h8l1-11" />,
  heart:      <path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" />,
  coffee:     <path d="M4 4h10v8a4 4 0 01-4 4H8a4 4 0 01-4-4V4zM14 6h2a2 2 0 010 4h-2M6 2v2M10 2v2" />,
  pen:        <path d="M15 3l2 2-10 10H5v-2L15 3zM13 5l2 2" />,
  music:      <path d="M8 17V5l9-2v12M8 12H6a2 2 0 100 4h2v-4zM17 10h-2a2 2 0 100 4h2v-4z" />,
  dumbbell:   <path d="M4 10h12M3 7h2v6H3zM15 7h2v6h-2zM6 8.5h2v3H6zM12 8.5h2v3h-2z" />,
};

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {PATHS[name]}
    </svg>
  );
}
