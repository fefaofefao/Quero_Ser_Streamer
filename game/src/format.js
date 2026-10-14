// Big number formatting for idle values.
const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];
let decimalSep = ',';
let notation = 'short';

export function setNumberLocale(lang, mode) {
  decimalSep = lang === 'en' ? '.' : ',';
  notation = mode || 'short';
}

function letters(i) {
  // after the named suffixes: aa, ab, ac ...
  const n = i - SUFFIX.length;
  const a = String.fromCharCode(97 + Math.floor(n / 26) % 26);
  const b = String.fromCharCode(97 + (n % 26));
  return a + b;
}

export function fmt(x, digits = 2) {
  if (!isFinite(x)) return '∞';
  if (x < 0) return '-' + fmt(-x, digits);
  if (x < 1000) {
    if (x < 10 && x % 1 !== 0) return x.toFixed(1).replace('.', decimalSep);
    return Math.floor(x).toString();
  }
  if (notation === 'sci') {
    const e = Math.floor(Math.log10(x));
    return (x / 10 ** e).toFixed(2).replace('.', decimalSep) + 'e' + e;
  }
  const i = Math.floor(Math.log10(x) / 3);
  const v = x / 10 ** (i * 3);
  const d = v >= 100 ? 0 : v >= 10 ? 1 : digits;
  const suf = i < SUFFIX.length ? SUFFIX[i] : letters(i);
  return v.toFixed(d).replace('.', decimalSep) + suf;
}

export function fmtInt(x) {
  return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, decimalSep === ',' ? '.' : ',');
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function fmtMult(x) {
  return 'x' + (x >= 1000 ? fmt(x) : (Math.round(x * 100) / 100).toString().replace('.', decimalSep));
}
