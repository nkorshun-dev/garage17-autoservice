import { DATA } from './data.js';
import * as V from './validation.js';
import { computeTotal, getCalcState, fmtNum, diagOnly } from './calculator.js';

const DRAFT_KEY = 'garage-17:booking-draft';
const $ = (s, r = document) => r.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

const form = $('#booking-form');
const state = { step: 1, date: '', time: '' };
const panels = [...form.querySelectorAll('[data-step]')];
const btnBack = $('#btn-back'), btnNext = $('#btn-next'), btnSubmit = $('#btn-submit');
const formError = $('#form-error');

/* ---------- значения и проверки ---------- */
function values() {
  const f = form.elements;
  return {
    brand: f.brand.value, model: f.model.value.trim(), year: f.year.value.trim(),
    plate: V.normalizePlate(f.plate.value), mileage: f.mileage.value.trim(),
    problem: f.problem.value.trim(), name: f['name'].value.trim(),
    phone: f.phone.value.trim(), contact: f.contact.value, consent: f.consent.checked,
    website: f.website.value,
    services: [...form.querySelectorAll('input[name=service]:checked')].map((i) => i.value),
  };
}
const checks = {
  brand: (v) => (v.brand ? '' : 'Выберите марку'),
  model: (v) => V.validateModel(v.model),
  year: (v) => V.validateYear(v.year),
  plate: (v) => V.validatePlate(v.plate),
  mileage: (v) => V.validateMileage(v.mileage),
  services: (v) => (v.services.length ? '' : 'Выберите хотя бы одну услугу'),
  slot: () => (state.date && state.time ? '' : 'Выберите дату и время'),
  name: (v) => V.validateName(v.name),
  phone: (v) => V.validatePhone(v.phone),
  consent: (v) => (v.consent ? '' : 'Нужно согласие на обработку данных'),
};
const stepFields = { 1: ['brand', 'model', 'year', 'plate', 'mileage'], 2: ['services'], 3: ['slot'], 4: ['name', 'phone', 'consent'] };

function showError(key, msg) {
  const el = $(`[data-error-for="${key}"]`, form);
  if (el) el.textContent = msg;
  const ctl = form.elements[key];
  if (ctl && ctl.setAttribute) ctl.setAttribute('aria-invalid', msg ? 'true' : 'false');
  const field = el && el.closest('.field');
  if (field) field.classList.toggle('invalid', !!msg);
}
function focusField(key) {
  const target = key === 'services' ? $('input[name=service]', form)
    : key === 'slot' ? ($('#calendar button:not(:disabled)') || $('#calendar'))
    : form.elements[key];
  if (target && target.focus) target.focus();
}
function validateStep(n) {
  const v = values();
  let first = null;
  for (const k of stepFields[n]) {
    const msg = checks[k](v);
    showError(k, msg);
    if (msg && !first) first = k;
  }
  if (first) focusField(first);
  return !first;
}

/* ---------- черновик ---------- */
function saveDraft() {
  try {
    const v = values();
    delete v.website;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...v, date: state.date, time: state.time, step: Math.min(state.step, 4) }));
  } catch { /* localStorage может быть недоступен — работаем без черновика */ }
}
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } }
function restoreDraft() {
  let d;
  try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { d = null; }
  if (!d || typeof d !== 'object') return;
  const f = form.elements;
  for (const k of ['brand', 'model', 'year', 'plate', 'mileage', 'problem', 'name', 'phone']) {
    if (typeof d[k] === 'string') f[k].value = d[k].slice(0, f[k].maxLength > 0 ? f[k].maxLength : 100);
  }
  if (['call', 'telegram', 'viber'].includes(d.contact)) f.contact.value = d.contact;
  f.consent.checked = d.consent === true;
  if (Array.isArray(d.services)) setServices(d.services, false);
  if (typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && dayAllowed(fromIso(d.date))) {
    state.date = d.date; state.time = typeof d.time === 'string' ? d.time : '';
  }
  state.step = Number.isInteger(d.step) && d.step >= 1 && d.step <= 4 ? d.step : 1;
  updateCounter();
}

/* ---------- услуги ---------- */
function setServices(ids, save = true) {
  form.querySelectorAll('input[name=service]').forEach((i) => { i.checked = ids.includes(i.value); });
  if (save) { showError('services', ''); saveDraft(); }
}

/* ---------- календарь и слоты ---------- */
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
function dayAllowed(d) {
  const t = today0(), last = new Date(t);
  last.setDate(last.getDate() + DATA.hours.daysAhead - 1);
  return d >= t && d <= last && d.getDay() !== DATA.hours.dayOff;
}
// Детерминированная «занятость» слота от даты и часа (чтобы выглядело реалистично)
function isBusy(date, h) {
  let x = 7;
  for (const c of `${date}#${h}`) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  // перемешиваем биты, иначе соседние часы дают почти одинаковый результат
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x % 100 < 30;
}
function renderCalendar() {
  const cal = $('#calendar');
  const t = today0();
  const start = new Date(t); start.setDate(start.getDate() - ((t.getDay() + 6) % 7)); // понедельник текущей недели
  const end = new Date(t); end.setDate(end.getDate() + DATA.hours.daysAhead - 1);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7)); // до воскресенья
  let html = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((w) => `<span class="cal-wd">${w}</span>`).join('');
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = iso(d), ok = dayAllowed(d);
    const label = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    const mon = d.getDate() === 1 || +d === +start ? `<small>${d.toLocaleDateString('ru-RU', { month: 'short' })}</small>` : '';
    html += `<button type="button" class="cal-day${key === state.date ? ' sel' : ''}${+d === +t ? ' today' : ''}" data-date="${key}" aria-label="${label}${ok ? '' : ', недоступно'}" aria-pressed="${key === state.date}"${ok ? '' : ' disabled'}>${d.getDate()}${mon}</button>`;
  }
  cal.innerHTML = html;
  renderSlots();
}
function renderSlots() {
  const box = $('#slots');
  if (!state.date) { box.innerHTML = '<p class="muted">Сначала выберите день.</p>'; return; }
  const now = new Date(), isToday = state.date === iso(now);
  const { firstSlot } = DATA.hours;
  const lastSlot = fromIso(state.date).getDay() === 6 ? DATA.hours.satLastSlot : DATA.hours.lastSlot;
  let html = '', anyFree = false, timeOk = false;
  for (let h = firstSlot; h <= lastSlot; h++) {
    const busy = isBusy(state.date, h), past = isToday && h <= now.getHours();
    const val = `${pad(h)}:00`, off = busy || past;
    if (!off) anyFree = true;
    if (!off && val === state.time) timeOk = true;
    html += `<button type="button" class="slot${val === state.time && !off ? ' sel' : ''}" data-time="${val}" aria-pressed="${val === state.time && !off}"${off ? ' disabled' : ''} aria-label="${val}${busy ? ', занято' : past ? ', время прошло' : ''}">${val}${busy ? '<small>занято</small>' : ''}</button>`;
  }
  if (!timeOk) state.time = '';
  box.innerHTML = html + (anyFree ? '' : '<p class="muted slots-none">На этот день свободных мест нет, выберите другой.</p>');
}

/* ---------- шаги ---------- */
function showStep(n, scroll = true) {
  state.step = n;
  panels.forEach((p) => { p.hidden = Number(p.dataset.step) !== n; });
  document.querySelectorAll('#progress li').forEach((li, i) => {
    li.classList.toggle('done', i + 1 < n);
    li.classList.toggle('active', i + 1 === Math.min(n, 4));
    if (i + 1 === Math.min(n, 4)) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  btnBack.hidden = n === 1;
  btnNext.hidden = n === 5;
  btnSubmit.hidden = n !== 5;
  btnNext.textContent = n === 4 ? 'Проверить заявку' : 'Далее';
  formError.textContent = '';
  if (n === 5) renderSummary();
  if (n === 3) renderCalendar();
  saveDraft();
  if (scroll) {
    const legend = $(`[data-step="${n}"] .step-title`, form);
    if (legend) { legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
    $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function estimate(v) {
  const c = getCalcState();
  return computeTotal(v.services, c.coef, c.parts);
}
function serviceNames(ids) { return DATA.services.filter((s) => ids.includes(s.id)).map((s) => s.name); }
const CONTACT = { call: 'Звонок', telegram: 'Telegram', viber: 'Viber' };

function totalText(ids, total) {
  const diag = diagOnly(ids);
  if (!total) return 'по диагностике';
  return `от ${fmtNum(total)} BYN` + (diag.length ? ' + ' + diag.map((s) => s.name.toLowerCase()).join(', ') + ' по диагностике' : '');
}

function renderSummary() {
  const v = values(), box = $('#summary'), c = getCalcState();
  const total = estimate(v);
  const carType = DATA.carTypes.find((t) => t.coef === c.coef);
  const rows = [
    ['Автомобиль', `${v.brand} ${v.model}, ${v.year}`],
    ['Госномер', v.plate],
    ['Расчёт по калькулятору', `${carType ? carType.name : 'Легковой'}, ${c.parts ? 'наши запчасти' : 'свои запчасти'}`],
    ['Пробег', `${fmtNum(v.mileage)} км`],
    ['Услуги', serviceNames(v.services).join(', ')],
    ['Проблема', v.problem || '—'],
    ['Дата и время', `${fromIso(state.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}, ${state.time}`],
    ['Клиент', `${v.name}, ${v.phone}`],
    ['Способ связи', CONTACT[v.contact]],
  ];
  box.textContent = '';
  for (const [k, val] of rows) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = k; dd.textContent = val;
    box.append(dt, dd);
  }
  $('#summary-total').textContent = totalText(v.services, total);
}

/* ---------- отправка ---------- */
// G17- + время (base36) + 4 случайных символа: например G17-MH2K9QAB7F
function makeRequestId() {
  const rnd = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(4, '0').slice(-4);
  return 'G17-' + Date.now().toString(36).toUpperCase() + rnd;
}
// Демо-проект: заявка никуда не уходит, имитируем запрос с задержкой ~1 сек.
function send(payload) {
  console.info('[Демо] Заявка (никуда не отправлена):', payload);
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
let sending = false;
async function submit() {
  if (sending) return; // защита от двойной заявки (двойной клик, Enter)
  sending = true;
  const v = values();
  const payload = {
    requestId: makeRequestId(),
    car: { brand: v.brand, model: v.model, year: Number(v.year), plate: v.plate, mileage: Number(v.mileage) },
    services: serviceNames(v.services),
    problem: v.problem, date: state.date, time: state.time,
    name: v.name, phone: v.phone, contact: v.contact,
    total: estimate(v), consent: true, website: v.website,
  };
  btnSubmit.disabled = true; btnSubmit.setAttribute('aria-busy', 'true'); btnSubmit.textContent = 'Отправляем…';
  formError.textContent = '';
  btnBack.disabled = true;
  await send(payload);
  sending = false;
  btnSubmit.disabled = false; btnSubmit.removeAttribute('aria-busy'); btnSubmit.textContent = 'Отправить заявку';
  btnBack.disabled = false;
  clearDraft();
  form.hidden = true;
  $('#progress').hidden = true;
  $('#success-id').textContent = payload.requestId;
  const ok = $('#success');
  ok.hidden = false;
  ok.setAttribute('tabindex', '-1'); ok.focus();
}

/* ---------- инициализация ---------- */
function updateCounter() { $('#problem-count').textContent = `${form.elements.problem.value.length} / 500`; }

export function initBooking() {
  const f = form.elements;
  f.brand.insertAdjacentHTML('beforeend', DATA.brands.map((b) => `<option>${b}</option>`).join(''));
  $('#booking-services').innerHTML = DATA.services.map((s) =>
    `<label class="check"><input type="checkbox" name="service" value="${s.id}"><span class="check-name">${s.name}</span><span class="check-price">${s.priceFrom == null ? 'по диагностике' : 'от ' + s.priceFrom + ' BYN'}</span></label>`).join('');
  f.year.placeholder = `например, ${new Date().getFullYear() - 6}`;

  restoreDraft();

  // маски и счётчики
  f.plate.addEventListener('input', () => { f.plate.value = f.plate.value.toUpperCase(); });
  f.plate.addEventListener('change', () => { f.plate.value = V.normalizePlate(f.plate.value); });
  for (const k of ['year', 'mileage']) f[k].addEventListener('input', () => { f[k].value = f[k].value.replace(/\D/g, ''); });
  // Маска телефона с сохранением позиции курсора при правке в середине
  f.phone.addEventListener('input', () => {
    const el = f.phone, atEnd = el.selectionStart === el.value.length;
    const digitsBefore = el.value.slice(0, el.selectionStart).replace(/\D/g, '').length;
    el.value = V.formatPhone(el.value);
    if (atEnd || document.activeElement !== el) return;
    let pos = 0, seen = 0;
    while (pos < el.value.length && seen < Math.max(digitsBefore, 3)) { if (/\d/.test(el.value[pos])) seen++; pos++; }
    el.setSelectionRange(pos, pos);
  });
  f.problem.addEventListener('input', () => {
    if (f.problem.value.length > 500) f.problem.value = f.problem.value.slice(0, 500); // на случай вставки в обход maxlength
    updateCounter();
  });

  // проверка поля при уходе из него
  form.addEventListener('focusout', (e) => {
    const k = e.target.name;
    if (checks[k] && k !== 'slot') showError(k, checks[k](values()));
  });
  form.addEventListener('change', (e) => { if (e.target.name === 'service') showError('services', ''); });
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  // календарь и слоты (делегирование)
  $('#calendar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-date]');
    if (!b || b.disabled) return;
    state.date = b.dataset.date; state.time = '';
    showError('slot', ''); renderCalendar(); saveDraft();
    $(`#calendar [data-date="${state.date}"]`).focus();
  });
  $('#slots').addEventListener('click', (e) => {
    const b = e.target.closest('[data-time]');
    if (!b || b.disabled) return;
    state.time = b.dataset.time;
    showError('slot', ''); renderSlots(); saveDraft();
    $(`#slots [data-time="${state.time}"]`).focus();
  });

  btnNext.addEventListener('click', () => { if (validateStep(state.step)) showStep(state.step + 1); });
  btnBack.addEventListener('click', () => showStep(state.step - 1));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.step < 5) { if (validateStep(state.step)) showStep(state.step + 1); return; }
    // перед отправкой перепроверяем все шаги (и что выбранное время ещё не прошло)
    if (state.date) renderSlots();
    for (let n = 1; n <= 4; n++) if (!validateStep(n)) { showStep(n); validateStep(n); return; }
    submit();
  });

  showStep(state.step, false);
}

// Вызывается из калькулятора: отмечаем услуги в шаге 2 и открываем нужный шаг.
// Если данные авто уже заполнены — сразу шаг 2 (услуги), иначе шаг 1.
export function prefillServices(ids) {
  setServices(ids);
  if (!form.hidden) {
    const v = values(), carOk = stepFields[1].every((k) => !checks[k](v));
    showStep(carOk ? 2 : 1);
    return;
  }
  $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
