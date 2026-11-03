// Все данные сайта одним объектом: услуги, цены, коэффициенты, марки, часы работы.
// Цены работ = норматив × нормо-час 55 BYN (округлено). Полный прайс — в index.html, секция #services.
export const DATA = {
  phone: '+375 (29) 361-48-27',
  phoneHref: '+375293614827',
  // Коэффициент цены работ по типу авто
  carTypes: [
    { id: 'sedan', name: 'Легковой', coef: 1.0 },
    { id: 'crossover', name: 'Кроссовер', coef: 1.2 },
    { id: 'van', name: 'Микроавтобус', coef: 1.4 },
  ],
  // priceFrom: null = цена по диагностике; partsPrice — ориентировочная стоимость наших запчастей/материалов
  services: [
    { id: 'diag', name: 'Компьютерная диагностика', priceFrom: 44, partsPrice: 0, durationMin: 50,
      desc: 'Все блоки, живые параметры датчиков, распечатка ошибок. 0,8 н/ч. При ремонте у нас в течение 7 дней — вычитаем из счёта.',
      icon: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 21h10M12 17v4M7 11h3l2-3 2 5 1-2h2"/>' },
    { id: 'oil', name: 'Замена масла и фильтра', priceFrom: 38, partsPrice: 97, durationMin: 40,
      desc: 'Масло ДВС и масляный фильтр, 0,7 н/ч. С нашими материалами — 4,5 л масла по допуску производителя и фильтр.',
      icon: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>' },
    { id: 'tires', name: 'Шиномонтаж (4 колеса)', priceFrom: 48, partsPrice: 0, durationMin: 60,
      desc: 'Снятие, монтаж, балансировка. Цена за комплект R13; до R18 — по таблице ниже.',
      icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>' },
    { id: 'suspension', name: 'Ремонт ходовой', priceFrom: 71, partsPrice: 164, durationMin: 150,
      desc: 'Стойки, рычаги, сайлентблоки, ступичные подшипники. Цена — за замену одной стойки, от 1,3 н/ч.',
      icon: '<path d="M8 3h8M8 21h8M12 3v18M9 7l6 2-6 2 6 2-6 2 6 2"/>' },
    { id: 'brakes', name: 'Тормозная система', priceFrom: 38, partsPrice: 118, durationMin: 60,
      desc: 'Колодки, диски, суппорты, замена жидкости. Цена — колодки на одну ось, 0,7 н/ч.',
      icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3a9 9 0 0 1 6 2.3M12 21a9 9 0 0 1-6-2.3"/>' },
    { id: 'alignment', name: 'Развал-схождение', priceFrom: 54, partsPrice: 0, durationMin: 60,
      desc: '3D-стенд Hunter, обе оси, распечатка «до/после». Если что-то закисло — скажем до начала работ.',
      icon: '<path d="M4 20 10 4M20 20 14 4M7 14h10"/>' },
    { id: 'electric', name: 'Автоэлектрика', priceFrom: 55, partsPrice: 0, durationMin: 60,
      desc: 'Поиск утечки тока, проводка, генератор, стартер. Почасовая оплата, от 1 н/ч.',
      icon: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>' },
    { id: 'ac', name: 'Заправка кондиционера', priceFrom: 61, partsPrice: 29, durationMin: 70,
      desc: 'Проверка давлением, вакуум, заправка по массе из паспорта авто. 1,1 н/ч, фреон R134a — 5,8 BYN за 100 г.',
      icon: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/>' },
    { id: 'engine', name: 'Ремонт двигателя', priceFrom: null, partsPrice: 0, durationMin: 480,
      desc: 'ГРМ, прокладки, сальники, капремонт. Смету даём письменно после диагностики и разборки.',
      icon: '<path d="M4 9h3l2-2h5l1 2h3v3h2v4h-2v2H8l-2-3H4z"/>' },
  ],
  brands: ['Volkswagen', 'Renault', 'Geely', 'Skoda', 'Toyota', 'Hyundai', 'Kia', 'Lada', 'Audi', 'BMW',
    'Opel', 'Ford', 'Belgee', 'Другая'],
  // Часы: Пн–Пт 8:30–20:00, Сб 9:00–17:00, Вс — выходной. Слоты — начало ЗАПИСИ:
  // будни 9:00–18:00 (последняя работа до 19:00), суббота 9:00–15:00 (до 16:00, чтобы успеть выдать авто)
  hours: { firstSlot: 9, lastSlot: 18, satLastSlot: 15, daysAhead: 14, dayOff: 0 },
};
