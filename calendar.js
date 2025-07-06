import { getDayData, getMonthData } from './storage.js';
import { openDayModal } from './modal.js';

const calendarModule = document.getElementById('calendar-module');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

// Установка текущего месяца и года из localStorage или текущей даты
let currentMonth = parseInt(localStorage.getItem('currentMonth') || new Date().getMonth());
let currentYear = parseInt(localStorage.getItem('currentYear') || new Date().getFullYear());

// Сохранение текущего состояния в localStorage
localStorage.setItem('currentMonth', currentMonth);
localStorage.setItem('currentYear', currentYear);

export const initCalendar = async () => {
  // Добавляем обработчики для кнопок навигации
  prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
  nextMonthBtn.addEventListener('click', () => navigateMonth(1));
  
  // Первоначальная отрисовка календаря
  await renderCalendar();
};

// Навигация по месяцам
const navigateMonth = (direction) => {
  currentMonth += direction;
  
  // Корректировка года при переходе через границы
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  
  // Сохраняем новое состояние
  localStorage.setItem('currentMonth', currentMonth);
  localStorage.setItem('currentYear', currentYear);
  
  // Отрисовываем календарь для нового месяца
  renderCalendar();
  
  // Отправляем событие об изменении месяца
  document.dispatchEvent(new CustomEvent('monthChanged'));
};

// Основная функция отрисовки календаря
const renderCalendar = async () => {
  // Русские названия месяцев
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  // Устанавливаем заголовок с текущим месяцем и годом
  currentMonthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  
  // Очищаем предыдущий календарь
  calendarModule.innerHTML = '';
  
  // Создаем контейнер для календаря
  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar-grid';
  
  // Добавляем заголовки дней недели
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekdays.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day weekday-header';
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  });
  
  // Определяем первый день месяца и его день недели
  const firstDay = new Date(currentYear, currentMonth, 1);
  const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // Воскресенье = 0 -> 7
  
  // Определяем количество дней в месяце
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Определяем текущую дату для сравнения
  const today = new Date();
  
  // Добавляем пустые ячейки для дней предыдущего месяца
  for (let i = 1; i < firstDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Загружаем данные за текущий месяц
  const monthData = await getMonthData(currentYear, currentMonth);
  
  // Создаем ячейки для каждого дня месяца
  for (let day = 1; day <= daysInMonth; day++) {
    // Форматируем дату в формате YYYY-MM-DD
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    
    // Получаем данные за день
    const dayData = monthData[dateString] || null;
    
    // Создаем элемент дня
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // Проверяем, является ли день текущим
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    // Добавляем номер дня
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // Добавляем маркер, если есть данные за день
    if (dayData) {
      const marker = document.createElement('div');
      marker.className = 'day-marker';
      marker.textContent = '•';
      dayElement.appendChild(marker);
    }
    
    // Добавляем финансовую сводку, если есть данные
    if (dayData) {
      const summary = document.createElement('div');
      summary.className = 'day-summary';
      
      // Доходы
      if (dayData.revenue && dayData.revenue > 0) {
        const revenueEl = document.createElement('div');
        revenueEl.style.color = 'var(--income-color)';
        revenueEl.textContent = `+${dayData.revenue}`;
        summary.appendChild(revenueEl);
      }
      
      // Расходы
      if (dayData.expenses) {
        const totalExpenses = Object.values(dayData.expenses).reduce((sum, val) => sum + val, 0);
        if (totalExpenses > 0) {
          const expensesEl = document.createElement('div');
          expensesEl.style.color = 'var(--expense-color)';
          expensesEl.textContent = `-${totalExpenses}`;
          summary.appendChild(expensesEl);
        }
      }
      
      dayElement.appendChild(summary);
    }
    
    // Добавляем обработчик клика для открытия модалки
    dayElement.addEventListener('click', () => openDayModal(dateString, dayData));
    
    // Добавляем день в сетку календаря
    calendarGrid.appendChild(dayElement);
  }
  
  // Добавляем календарь на страницу
  calendarModule.appendChild(calendarGrid);
};

// Обновляем календарь при сохранении данных
document.addEventListener('dataSaved', renderCalendar);
