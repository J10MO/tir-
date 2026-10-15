import { footCm } from './format.js';

// Approximate age for each EU kids' size. Feet differ, so foot length is the real guide.
const AGES = {
  18: '6 إلى 9 أشهر', 19: '9 إلى 12 شهراً', 20: 'سنة', 21: 'سنة ونصف', 22: 'سنة ونصف إلى سنتين',
  23: 'سنتان', 24: 'سنتان ونصف', 25: '3 سنوات', 26: '3 سنوات ونصف', 27: '4 سنوات',
  28: '4 سنوات ونصف', 29: '5 سنوات', 30: '5 إلى 6 سنوات',
};

export const SIZE_CHART = Object.keys(AGES).map(Number).map(size => ({ size, cm: footCm(size), age: AGES[size] }));

export const ageFor = size => AGES[size];

// "23 إلى 30" for a contiguous run, otherwise the list: "18، 19، 22".
export function sizeSummary(sizes) {
  if (!sizes?.length) return '';
  const sorted = [...sizes].sort((a, b) => a - b);
  const contiguous = sorted.every((s, i) => i === 0 || s === sorted[i - 1] + 1);
  return contiguous && sorted.length > 2 ? `${sorted[0]} إلى ${sorted.at(-1)}` : sorted.join('، ');
}
