import { getDayData, getMonthData } from './storage.js';
import { openDayModal } from './modal.js';

const calendarModule = document.getElementById('calendar-module');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

export const initCalendar = async () => {
  prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
  nextMonthBtn.addEventListener('click', () => navigateMonth(1));
  await renderCalendar();
};

const navigateMonth = (direction) => {
  currentMonth += direction;
  
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  
  renderCalendar();
};

const renderCalendar = async () => {
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  currentMonthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  
  // Получаем данные за месяц
  const monthData = await getMonthData(currentYear, currentMonth);
  
  // Очищаем календарь
  calendarModule.innerHTML = '';
  
  // Создаем сетку календаря
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
  
  // Определяем первый день месяца
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Пустые ячейки для первого дня
  for (let i = 1; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Добавляем дни месяца
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    const dayData = monthData[dateString] || null;
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // Проверяем, сегодня ли это
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
    
    // Добавляем маркер если есть данные
    if (dayData) {
      const marker = document.createElement('div');
      marker.className = 'day-marker';
      marker.textContent = '•';
      dayElement.appendChild(marker);
    }
    
    // Добавляем краткую информацию о финансах
    if (dayData) {
      const summary = document.createElement('div');
      summary.className = 'day-summary';
      
      const revenueEl = document.createElement('div');
      revenueEl.style.color = 'var(--income-color)';
      revenueEl.textContent = `+${dayData.revenue || 0}`;
      
      const expensesEl = document.createElement('div');
      expensesEl.style.color = 'var(--expense-color)';
      expensesEl.textContent = `-${Object.values(dayData.expenses || {}).reduce((sum, val) => sum + val, 0)}`;
      
      summary.appendChild(revenueEl);
      summary.appendChild(expensesEl);
      dayElement.appendChild(summary);
    }
    
    // Добавляем обработчик клика
    dayElement.addEventListener('click', () => openDayModal(dateString, dayData));
    
    calendarGrid.appendChild(dayElement);
  }
  
  calendarModule.appendChild(calendarGrid);
};
