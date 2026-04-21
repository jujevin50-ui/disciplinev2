export interface Tokens {
  paper: string;
  paperAlt: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  inkFaint: string;
  rule: string;
  ruleStrong: string;
  accent: string;
  accentSoft: string;
  done: string;
  doneSoft: string;
  canvas: string;
}

export const LIGHT: Tokens = {
  paper: '#F6F2EB',
  paperAlt: '#EFE9DE',
  ink: '#1A1613',
  inkSoft: '#4A423A',
  inkMuted: '#8B8277',
  inkFaint: '#C9C1B4',
  rule: 'rgba(26,22,19,0.08)',
  ruleStrong: 'rgba(26,22,19,0.18)',
  accent: '#B8532B',
  accentSoft: '#E8C9B5',
  done: '#4A5D3A',
  doneSoft: '#D8DBC4',
  canvas: '#E8E4DB',
};

export const DARK: Tokens = {
  paper: '#0E0C0A',
  paperAlt: '#1A1714',
  ink: '#F2EEE6',
  inkSoft: '#C9C1B4',
  inkMuted: '#8B8277',
  inkFaint: '#544B40',
  rule: 'rgba(242,238,230,0.08)',
  ruleStrong: 'rgba(242,238,230,0.18)',
  accent: '#D97757',
  accentSoft: '#3A2218',
  done: '#6B8F5A',
  doneSoft: '#2A3D24',
  canvas: '#050403',
};
