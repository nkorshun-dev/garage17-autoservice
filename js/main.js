import { DATA } from './data.js';
import { initCalculator } from './calculator.js';
import { initBooking, prefillServices } from './booking.js';

const $ = (s, r = document) => r.querySelector(s);

/* Карточки услуг из data.js */
function renderServices() {
  $('#services-grid').innerHTML = DATA.services.map((s) => `
    <article class="card">
      <svg class="icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <p class="price">${s.priceFrom == null ? 'по диагностике' : 'от <b>' + s.priceFrom + '</b> BYN'}</p>
    </article>`).join('');
}

/* Бургер-меню */
function initMenu() {
  const burger = $('#burger'), nav = $('#nav');
  const set = (open) => { nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  // Esc закрывает меню и возвращает фокус на бургер, если он был внутри меню
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !nav.classList.contains('open')) return;
    const inside = nav.contains(document.activeElement);
    set(false);
    if (inside) burger.focus();
  });
}

/* FAQ-аккордеон */
function initFaq() {
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      document.getElementById(btn.getAttribute('aria-controls')).hidden = open;
    });
  });
}

/* Слайдер отзывов: стрелки, точки, клавиатура, свайп (pointer events) */
function initSlider() {
  const root = $('#reviews'), viewport = $('.slider-viewport', root), track = $('.slider-track', root);
  const slides = [...track.children], dots = $('.dots', root), count = $('.slider-count', root);
  let per = 1, max = 0, index = 0, startX = null, dx = 0;

  const go = (i) => {
    index = Math.max(0, Math.min(i, max));
    track.style.transition = '';
    track.style.transform = `translateX(${(-index * 100) / per}%)`;
    [...dots.children].forEach((d, k) => d.setAttribute('aria-current', k === index));
    count.textContent = `${index + 1} / ${max + 1}`;
    $('.prev', root).disabled = index === 0;
    $('.next', root).disabled = index === max;
  };
  const layout = () => {
    per = innerWidth >= 1024 ? 3 : innerWidth >= 768 ? 2 : 1;
    max = slides.length - per;
    slides.forEach((s) => { s.style.flexBasis = 100 / per + '%'; });
    dots.innerHTML = Array.from({ length: max + 1 }, (_, k) => `<button type="button" aria-label="Отзыв ${k + 1}"></button>`).join('');
    go(index);
  };
  dots.addEventListener('click', (e) => {
    const k = [...dots.children].indexOf(e.target.closest('button'));
    if (k >= 0) go(k);
  });
  $('.prev', root).addEventListener('click', () => go(index - 1));
  $('.next', root).addEventListener('click', () => go(index + 1));
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  });
  viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; dx = 0; viewport.setPointerCapture(e.pointerId); });
  viewport.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    dx = e.clientX - startX;
    track.style.transition = 'none';
    track.style.transform = `translateX(calc(${(-index * 100) / per}% + ${dx}px))`;
  });
  const end = () => {
    if (startX === null) return;
    startX = null;
    go(Math.abs(dx) > 50 ? index + (dx < 0 ? 1 : -1) : index);
  };
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  addEventListener('resize', layout);
  layout();
}

/* Плавающая кнопка звонка: прячем, когда на экране кнопки формы, чтобы не перекрывать «Далее»/«Отправить» */
function initFab() {
  const fab = $('.fab'), actions = $('#booking-form .actions');
  if (!fab || !actions || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => fab.classList.toggle('is-hidden', e.isIntersecting)).observe(actions);
}

renderServices();
initMenu();
initFab();
initFaq();
initSlider();
initBooking();
initCalculator({ onBook: prefillServices });
