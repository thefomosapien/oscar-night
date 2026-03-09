import { Category } from './types';

export const CATEGORIES: Category[] = [
  // Tier 1 — 1 point (Marquee)
  {
    id: 'best-picture',
    name: 'Best Picture',
    tier: 1,
    nominees: [
      'Bugonia', 'F1', 'Frankenstein', 'Hamnet', 'Marty Supreme',
      'One Battle After Another', 'The Secret Agent', 'Sentimental Value',
      'Sinners', 'Train Dreams',
    ],
  },
  {
    id: 'directing',
    name: 'Directing',
    tier: 1,
    nominees: [
      'Paul Thomas Anderson — One Battle After Another',
      'Ryan Coogler — Sinners',
      'Chloé Zhao — Hamnet',
      'Josh Safdie — Marty Supreme',
      'Joachim Trier — Sentimental Value',
    ],
  },
  {
    id: 'best-actor',
    name: 'Best Actor',
    tier: 1,
    nominees: [
      'Timothée Chalamet — Marty Supreme',
      'Leonardo DiCaprio — One Battle After Another',
      'Ethan Hawke — Blue Moon',
      'Michael B. Jordan — Sinners',
      'Wagner Moura — The Secret Agent',
    ],
  },
  {
    id: 'best-actress',
    name: 'Best Actress',
    tier: 1,
    nominees: [
      'Jessie Buckley — Hamnet',
      'Rose Byrne — If I Had Legs I\'d Kick You',
      'Renate Reinsve — Sentimental Value',
      'Emma Stone — Bugonia',
      'Kate Hudson — Song Sung Blue',
    ],
  },
  {
    id: 'supporting-actor',
    name: 'Supporting Actor',
    tier: 1,
    nominees: [
      'Jacob Elordi — Frankenstein',
      'Sean Penn — One Battle After Another',
      'Stellan Skarsgård — Sentimental Value',
      'Benicio del Toro — One Battle After Another',
      'Delroy Lindo — Sinners',
    ],
  },
  {
    id: 'supporting-actress',
    name: 'Supporting Actress',
    tier: 1,
    nominees: [
      'Elle Fanning — Sentimental Value',
      'Inga Ibsdotter Liljeaas — Sentimental Value',
      'Amy Madigan — Weapons',
      'Wunmi Mosaku — Sinners',
      'Teyana Taylor — One Battle After Another',
    ],
  },
  {
    id: 'animated-feature',
    name: 'Animated Feature',
    tier: 1,
    nominees: [
      'Arco', 'Elio', 'KPop Demon Hunters',
      'Little Amélie or the Character of Rain', 'Zootopia 2',
    ],
  },
  // Tier 2 — 2 points (Critics' Pick)
  {
    id: 'original-screenplay',
    name: 'Original Screenplay',
    tier: 2,
    nominees: [
      'Blue Moon', 'It Was Just an Accident', 'Marty Supreme',
      'Sentimental Value', 'Sinners',
    ],
  },
  {
    id: 'adapted-screenplay',
    name: 'Adapted Screenplay',
    tier: 2,
    nominees: [
      'Bugonia', 'Frankenstein', 'Hamnet',
      'One Battle After Another', 'Train Dreams',
    ],
  },
  {
    id: 'cinematography',
    name: 'Cinematography',
    tier: 2,
    nominees: [
      'Frankenstein', 'Marty Supreme', 'One Battle After Another',
      'Sinners', 'Train Dreams',
    ],
  },
  {
    id: 'film-editing',
    name: 'Film Editing',
    tier: 2,
    nominees: [
      'F1', 'Marty Supreme', 'One Battle After Another',
      'Sentimental Value', 'Sinners',
    ],
  },
  {
    id: 'original-score',
    name: 'Original Score',
    tier: 2,
    nominees: [
      'Bugonia — Jerskin Fendrix',
      'Frankenstein — Alexandre Desplat',
      'Hamnet — Max Richter',
      'One Battle After Another — Jonny Greenwood',
      'Sinners — Ludwig Göransson',
    ],
  },
  {
    id: 'original-song',
    name: 'Original Song',
    tier: 2,
    nominees: [
      '"Golden" — KPop Demon Hunters',
      '"Train Dreams" — Train Dreams',
      '"Dear Me" — Diane Warren: Relentless',
      '"I Lied To You" — Sinners',
      '"Sweet Dreams Of Joy" — Viva Verdi!',
    ],
  },
  {
    id: 'international-feature',
    name: 'International Feature',
    tier: 2,
    nominees: [
      'The Secret Agent (Brazil)',
      'It Was Just an Accident (France)',
      'Sentimental Value (Norway)',
      'Sirât (Spain)',
      'The Voice of Hind Rajab (Tunisia)',
    ],
  },
  {
    id: 'documentary-feature',
    name: 'Documentary Feature',
    tier: 2,
    nominees: [
      'The Perfect Neighbor', 'The Alabama Solution',
      'Come See Me in the Good Light', 'Cutting Through Rocks',
      'Mr. Nobody Against Putin',
    ],
  },
  {
    id: 'visual-effects',
    name: 'Visual Effects',
    tier: 2,
    nominees: [
      'Avatar: Fire and Ash', 'F1', 'Jurassic World Rebirth',
      'The Lost Bus', 'Sinners',
    ],
  },
  // Tier 3 — 3 points (Deep Cut)
  {
    id: 'production-design',
    name: 'Production Design',
    tier: 3,
    nominees: [
      'Frankenstein', 'Hamnet', 'Marty Supreme',
      'One Battle After Another', 'Sinners',
    ],
  },
  {
    id: 'costume-design',
    name: 'Costume Design',
    tier: 3,
    nominees: [
      'Avatar: Fire and Ash', 'Frankenstein', 'Hamnet',
      'Marty Supreme', 'Sinners',
    ],
  },
  {
    id: 'makeup-hairstyling',
    name: 'Makeup & Hairstyling',
    tier: 3,
    nominees: [
      'Frankenstein', 'Kokuho', 'Sinners',
      'The Smashing Machine', 'The Ugly Stepsister',
    ],
  },
  {
    id: 'sound',
    name: 'Sound',
    tier: 3,
    nominees: [
      'F1', 'Frankenstein', 'One Battle After Another',
      'Sinners', 'Sirât',
    ],
  },
  {
    id: 'casting',
    name: 'Casting',
    tier: 3,
    nominees: [
      'Hamnet', 'Marty Supreme', 'One Battle After Another',
      'The Secret Agent', 'Sinners',
    ],
  },
  {
    id: 'documentary-short',
    name: 'Documentary Short',
    tier: 3,
    nominees: [
      'All the Empty Rooms', 'Armed Only with a Camera',
      'Children No More', 'The Devil Is Busy',
      'Perfectly a Strangeness',
    ],
  },
  {
    id: 'live-action-short',
    name: 'Live Action Short',
    tier: 3,
    nominees: [
      'Butcher\'s Stain', 'A Friend of Dorothy',
      'Jane Austen\'s Period Drama', 'The Singers',
      'Two People Exchanging Saliva',
    ],
  },
  {
    id: 'animated-short',
    name: 'Animated Short',
    tier: 3,
    nominees: [
      'Butterfly', 'Forevergreen', 'The Girl Who Cried Pearls',
      'Retirement Plan', 'The Three Sisters',
    ],
  },
];

export const TIER_LABELS: Record<number, string> = {
  1: 'Marquee',
  2: "Critics' Pick",
  3: 'Deep Cut',
};

export const TIER_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
};

export const MAX_PLAYERS = 3;
export const TOTAL_CATEGORIES = CATEGORIES.length; // 24
