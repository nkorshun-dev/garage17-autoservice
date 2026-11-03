import { DATA } from './data.js';

const state = { coef: 1, parts: false };
export const getCalcState = () => ({ ...state });

// 1240 → «1 240» (неразрывный пробел между разрядами)
export const fmtNum = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// Услуги «по диагностике» среди выбранных
export const diagOnly = (ids) => DATA.services.filter((s) => ids.includes(s.id) && s.priceFrom == null);

// Итог: работы × коэффициент типа авто + (по желанию) наши запчасти. Услуги «по диагностике» в сумму не входят.
export function computeTotal(ids, coef, parts) {
  let sum = 0;
  for (const s of DATA.services.filter((x) => ids.includes(x.id))) {
    if (s.priceFrom != null) sum += Math.round(s.priceFrom * coef);
    if (parts) sum += s.partsPrice || 0;
  }
  return sum;
}

const fmtTime = (m) =>
  m ? `${m >= 60 ? Math.floor(m / 60) + ' ч ' : ''}${m % 60 ? (m % 60) + ' мин' : ''}`.trim() : '—';

export function initCalculator({ onBook }) {
  const $ = (s) => document.querySelector(s);
  const totalEl = $('#calc-total'), timeEl = $('#calc-time'), noteEl = $('#calc-note'), btn = $('#calc-book');
  const sumEl = $('#calc-sum'), sumTextEl = $('#calc-sum-text');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown = 0, raf = 0;

  $('#calc-cartypes').innerHTML = DATA.carTypes.map((t, i) =>
    `<label class="seg"><input type="radio" name="cartype" value="${t.coef}"${i ? '' : ' checked'}><span>${t.name}<small>×${t.coef.toFixed(1)}</small></span></label>`).join('');
  $('#calc-services').innerHTML = DATA.services.map((s) =>
    `<label class="check"><input type="checkbox" value="${s.id}"><span class="check-name">${s.name}</span><span class="check-price">${s.priceFrom == null ? 'по диагностике' : 'от ' + s.priceFrom + ' BYN'}</span></label>`).join('');

  // Анимация числа от текущего значения к новому
  function animate(target) {
    cancelAnimationFrame(raf);
    // В фоновой вкладке requestAnimationFrame не срабатывает — там ставим число сразу
    if (reduce || document.hidden) { shown = target; totalEl.textContent = fmtNum(target); return; }
    const from = shown, t0 = performance.now(), dur = 400;
    const step = (now) => {
      const p = dur ? Math.min((now - t0) / dur, 1) : 1;
      shown = Math.round(from + (target - from) * p);
      totalEl.textContent = fmtNum(shown);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  const selected = () => [...document.querySelectorAll('#calc-services input:checked')].map((i) => i.value);

  function update() {
    state.coef = Number($('input[name=cartype]:checked').value);
    state.parts = $('input[name=parts]:checked').value === 'ours';
    const ids = selected();
    const list = DATA.services.filter((s) => ids.includes(s.id));
    const diag = diagOnly(ids), priced = list.length > diag.length;
    animate(computeTotal(ids, state.coef, state.parts));
    // Нет услуг с ценой — вместо «от 0 BYN» показываем понятный текст
    sumEl.hidden = !priced;
    sumTextEl.hidden = priced;
    sumTextEl.textContent = list.length ? 'По диагностике' : 'Выберите услуги';
    timeEl.textContent = fmtTime(list.reduce((a, s) => a + s.durationMin, 0));
    noteEl.textContent = !list.length
      ? 'Отметьте хотя бы одну услугу слева — итог посчитается сразу.'
      : diag.length
        ? `${diag.map((s) => s.name).join(', ')} — цена после диагностики, в сумму не входит.`
        : 'Ориентировочная цена. Точную назовём после осмотра.';
    btn.disabled = !ids.length;
  }

  $('#calculator').addEventListener('change', update);
  btn.addEventListener('click', () => onBook(selected()));
  update();
}
