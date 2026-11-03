// Функции валидации: каждая возвращает '' (ок) или текст ошибки.
const LAT = { 'А': 'A', 'В': 'B', 'Е': 'E', 'І': 'I', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X' };
// 4 цифры, пробел, 2 «номерные» буквы (A B E I K M H O P C T X или такая же кириллица), дефис, регион 1–8
const PLATE_RE = /^\d{4} [ABEIKMHOPCTX]{2}-[1-8]$/;
const PHONE_RE = /^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$/;

// Кириллица → латиница, лишние пробелы убираются: «1234  ав - 7» → «1234 AB-7». Мусор возвращается как есть.
export function normalizePlate(s) {
  const t = String(s).toUpperCase().replace(/[АВЕІКМНОРСТХ]/g, (c) => LAT[c]).replace(/\s+/g, ' ').trim();
  const m = t.match(/^(\d{4}) ?([A-Z]{2}) ?- ?(\d)$/);
  return m ? `${m[1]} ${m[2]}-${m[3]}` : t;
}

export function validatePlate(v) {
  if (!v || !v.trim()) return 'Укажите госномер';
  return PLATE_RE.test(normalizePlate(v)) ? '' : 'Формат номера: 1234 AB-7 (регион 1–8)';
}
export function validateModel(v) {
  return v.length >= 2 && v.length <= 40 ? '' : 'Укажите модель (2–40 символов)';
}
export function validateYear(v) {
  const n = Number(v), max = new Date().getFullYear();
  return /^\d{4}$/.test(v) && n >= 1990 && n <= max ? '' : `Год выпуска от 1990 до ${max}`;
}
export function validateMileage(v) {
  return /^\d{1,7}$/.test(v) && Number(v) <= 1000000 ? '' : 'Укажите пробег в км (0–1 000 000)';
}
export function validateName(v) {
  return /^[\p{L}][\p{L} '.\-]{1,49}$/u.test(v) ? '' : 'Укажите имя (2–50 букв)';
}
export function validatePhone(v) {
  return PHONE_RE.test(v) ? '' : 'Введите телефон полностью: +375 (XX) XXX-XX-XX';
}
// Маска телефона: +375 (XX) XXX-XX-XX; разделители добавляются, только когда есть следующая цифра
export function formatPhone(raw) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('375')) d = d.slice(3);
  else if (d.length >= 11 && d.startsWith('80')) d = d.slice(2); // вставка в местном формате 80 29 …
  d = d.slice(0, 9);
  if (!d) return '';
  let r = '+375 (' + d.slice(0, 2);
  if (d.length > 2) r += ') ' + d.slice(2, 5);
  if (d.length > 5) r += '-' + d.slice(5, 7);
  if (d.length > 7) r += '-' + d.slice(7, 9);
  return r;
}
