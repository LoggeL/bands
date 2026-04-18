import type { Visibility } from './db';

export const MOODS = [
  'voller energie',
  'nostalgisch',
  'chill',
  'melancholisch',
  'hyped',
  'nachdenklich',
] as const;
export type Mood = (typeof MOODS)[number];

export const DIARY_NOTES = [
  'Den ganzen Tag in Dauerschleife',
  'Zufällig entdeckt — und hängengeblieben',
  'Perfekt für den Morgen im Zug',
  'Trifft nachts anders',
  'Holt Festivalerinnerungen zurück',
  'Krieg den Track nicht mehr aus dem Kopf',
  'Die Energie in dem Song ist unreal',
  'So ein Vibe',
  'Dieser ist mir ans Herz gewachsen',
  'Für mich schon jetzt ein Klassiker',
];

export const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: 'public', label: 'ÖFFENTLICH', hint: 'Alle sehen dein Tagebuch, Live & Wunschliste.' },
  { value: 'friends', label: 'FREUNDE', hint: 'Nur bestätigte Freunde sehen deine Einträge.' },
  { value: 'private', label: 'PRIVAT', hint: 'Nur du. Nichts erscheint im Feed anderer.' },
];
