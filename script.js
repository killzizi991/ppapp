// Основные переменные
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let selectedDay = null;
let massColoringMode = null;
let isKeyboardOpen = false;
let lastWindowHeight = window.innerHeight;

// Хранение данных
let calendarData = JSON.parse(localStorage.getItem('calendarData')) || {};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    try {
        generateCalendar();
        setupEventListeners();
        initPeriodSelector();
        
        if (!localStorage.getItem('firstRun')) {
            localStorage.setItem('firstRun', 'true');
            showWelcomeMessage();
        }
        
        window.addEventListener('resize', function() {
            const newHeight = window.innerHeight;
            const heightDifference = Math.abs(lastWindowHeight - newHeight);
            
            if (heightDifference > 200) {
                isKeyboardOpen = (newHeight < lastWindowHeight);
                lastWindowHeight = newHeight;
            }
        });
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});

// Генерация календаря
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error('Элемент calendar не найден');
        return;
    }
    
    calendar.innerHTML = '';
    
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-header';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    const startOffset = (firstDay.getDay() || 7) - 1;
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        calendar.appendChild(empty);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
        const dayData = calendarData[dateKey] || {};
        
        const formatSalesNumber = (value) => {
            if (value >= 100000) return (value/1000).toFixed(0) + 'k';
            if (value >= 10000) return (value/1000).toFixed(1) + 'k';
            return value;
        };
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${dayData.sales ? `<div class="day-sales">${formatSalesNumber(dayData.sales)} руб</div>` : ''}
        `;
        
        if (dayData.color) {
            dayElement.style.backgroundColor = dayData.color;
        }
        
        if (dayData.functionalBorder) {
            dayElement.classList.add('functional-border');
        }
        
        if (dayData.comment) {
            const commentIcon = document.createElement('div');
            commentIcon.className = 'day-comment';
            commentIcon.textContent = '💬';
            commentIcon.style.position = 'absolute';
            commentIcon.style.top = '5px';
            commentIcon.style.right = '5px';
            commentIcon.style.fontSize = '0.8em';
            dayElement.appendChild(commentIcon);
        }
        
        const today = new Date();
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', () => handleDayClick(day));
        calendar.appendChild(dayElement);
    }
    
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
      
    const currentMonthYear = document.getElementById('current-month-year');
    if (currentMonthYear) {
        currentMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    calculateSummary();
}

// ... остальной код script.js без изменений ...
// (остальной код остается как в предыдущей версии)

// Обработчик клика по дню
function handleDayClick(day) {
    if (massColoringMode === 'fill') {
        applyFillColor(day);
    } else if (massColoringMode === 'border') {
        toggleFunctionalBorder(day);
    } else {
        openModal(day);
    }
}

// Установка/снятие функциональной обводки
function toggleFunctionalBorder(day) {
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    let dayData = calendarData[dateKey] || {};
    
    if (dayData.functionalBorder) {
        dayData.functionalBorder = false;
        dayData.sales = 0;
        showNotification('Обводка снята');
    } else {
        if (dayData.sales && dayData.sales !== 0) {
            showNotification('Сначала обнулите значение');
            return;
        }
        dayData.functionalBorder = true;
        dayData.sales = 30000;
        showNotification('Обводка установлена');
    }
    
    calendarData[dateKey] = dayData;
    localStorage.setItem('calendarData', JSON.stringify(calendarData));
    generateCalendar();
}

// Применение цвета в режиме массового окрашивания
function applyFillColor(day) {
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    let dayData = calendarData[dateKey] || {};
    const activeColor = document.querySelector('.palette-tool.fill.active');
    
    if (activeColor) {
        dayData.color = activeColor.dataset.color;
        calendarData[dateKey] = dayData;
        localStorage.setItem('calendarData', JSON.stringify(calendarData));
        generateCalendar();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar();
    });
    
    document.querySelector('.close').addEventListener('click', closeModal);
    
    document.getElementById('save-data').addEventListener('click', saveDayData);
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(el => 
                el.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modal');
        const summaryModal = document.getElementById('summary-modal');
        const periodModal = document.getElementById('period-modal');
        
        if (isKeyboardOpen) return;
        
        if (event.target === modal) {
            closeModal();
        }
        if (event.target === summaryModal) {
            closeSummaryModal();
        }
        if (event.target === periodModal) {
            closePeriodModal();
        }
    });
    
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('calendarData', JSON.stringify(calendarData));
    });
    
    document.getElementById('summary-btn').addEventListener('click', showSummaryModal);
    
    document.getElementById('month-year-selector').addEventListener('click', openPeriodModal);
    
    document.getElementById('period-back').addEventListener('click', goBackToYears);
    
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        });
    });
    
    document.getElementById('palette-btn').addEventListener('click', togglePaletteMode);
    
    document.querySelectorAll('.palette-tool.fill').forEach(tool => {
        tool.addEventListener('click', function() {
            document.querySelectorAll('.palette-tool').forEach(t => 
                t.classList.remove('active'));
            this.classList.add('active');
            massColoringMode = 'fill';
        });
    });
    
    document.getElementById('palette-border').addEventListener('click', function() {
        document.querySelectorAll('.palette-tool').forEach(t => 
            t.classList.remove('active'));
        this.classList.add('active');
        massColoringMode = 'border';
    });
}

// Переключение режима палитры
function togglePaletteMode() {
    const paletteBtn = document.getElementById('palette-btn');
    const palettePanel = document.getElementById('palette-panel');
    
    if (palettePanel.style.display === 'flex') {
        palettePanel.style.display = 'none';
        paletteBtn.classList.remove('active');
        massColoringMode = null;
        document.querySelectorAll('.palette-tool').forEach(t => 
            t.classList.remove('active'));
    } else {
        palettePanel.style.display = 'flex';
        paletteBtn.classList.add('active');
    }
}

// Инициализация выбора периода
function initPeriodSelector() {
    const yearsContainer = document.getElementById('year-options');
    const monthsContainer = document.getElementById('month-options');
    
    for (let year = 2024; year <= 2030; year++) {
        const yearBtn = document.createElement('button');
        yearBtn.textContent = year;
        yearBtn.className = 'period-option';
        yearBtn.addEventListener('click', () => selectYear(year));
        yearsContainer.appendChild(yearBtn);
    }
    
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    months.forEach((month, index) => {
        const monthBtn = document.createElement('button');
        monthBtn.textContent = month;
        monthBtn.className = 'period-option';
        monthBtn.addEventListener('click', () => selectMonth(index));
        monthsContainer.appendChild(monthBtn);
    });
}

// Открытие модального окна выбора периода
function openPeriodModal() {
    document.getElementById('period-modal').style.display = 'block';
    document.getElementById('year-step').style.display = 'block';
    document.getElementById('month-step').style.display = 'none';
    document.getElementById('period-back').style.display = 'none';
    document.body.classList.add('modal-open');
}

// Выбор года
function selectYear(year) {
    currentYear = year;
    document.getElementById('year-step').style.display = 'none';
    document.getElementById('month-step').style.display = 'block';
    document.getElementById('period-back').style.display = 'block';
}

// Выбор месяца
function selectMonth(month) {
    currentMonth = month;
    generateCalendar();
    closePeriodModal();
}

// Кнопка "Назад" в выборе периода
function goBackToYears() {
    document.getElementById('year-step').style.display = 'block';
    document.getElementById('month-step').style.display = 'none';
    document.getElementById('period-back').style.display = 'none';
}

// Закрытие модального окна периода
function closePeriodModal() {
    document.getElementById('period-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Открытие модального окна дня
function openModal(day) {
    selectedDay = day;
    const modal = document.getElementById('modal');
    document.getElementById('modal-day').textContent = day;
    
    const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
    const dayData = calendarData[dateKey] || {};
    
    document.getElementById('sales-input').value = 
        dayData.functionalBorder ? 30000 : (dayData.sales || '');
    
    document.getElementById('comment-input').value = dayData.comment || '';
    
    document.querySelectorAll('.color-option').forEach(el => 
        el.classList.remove('selected'));
    
    if (dayData.color) {
        const colorOption = [...document.querySelectorAll('.color-option')].find(
            opt => opt.dataset.color === dayData.color
        );
        if (colorOption) colorOption.classList.add('selected');
    }
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    setTimeout(() => {
        const input = document.getElementById('sales-input');
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Сохранение данных дня
function saveDayData() {
    const dateKey = `${currentYear}-${currentMonth+1}-${selectedDay}`;
    const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || '#ffffff';
    const salesValue = parseInt(document.getElementById('sales-input').value) || 0;
    
    const hadFunctionalBorder = calendarData[dateKey]?.functionalBorder || false;
    const removeBorder = hadFunctionalBorder && salesValue !== 30000;
    
    calendarData[dateKey] = {
        ...calendarData[dateKey],
        sales: salesValue,
        comment: document.getElementById('comment-input').value || '',
        color: selectedColor,
        functionalBorder: hadFunctionalBorder && !removeBorder
    };
    
    localStorage.setItem('calendarData', JSON.stringify(calendarData));
    generateCalendar();
    closeModal();
    showNotification('Данные сохранены!');
}

// Расчет зарплаты
function calculateSummary() {
    let workDays = 0;
    let totalSales = 0;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${currentMonth+1}-${day}`;
        if (calendarData[dateKey] && calendarData[dateKey].sales > 0) {
            workDays++;
            totalSales += calendarData[dateKey].sales;
        }
    }
    
    const totalEarnedBeforeTax = (totalSales * 0.07) + (workDays * 1000);
    const totalEarned = totalEarnedBeforeTax * 0.87;
    const balance = totalEarned - 25000;
    const salary = balance + 10875;
    
    return {
        workDays,
        totalSales,
        totalEarned,
        salary,
        balance
    };
}

// Показать модальное окно с расчетами
function showSummaryModal() {
    const summaryData = calculateSummary();
    const modal = document.getElementById('summary-modal');
    
    document.getElementById('modal-work-days').textContent = summaryData.workDays;
    document.getElementById('modal-total-sales').textContent = summaryData.totalSales;
    document.getElementById('modal-total-earned').textContent = summaryData.totalEarned.toFixed(2);
    document.getElementById('modal-salary').textContent = summaryData.salary.toFixed(2);
    document.getElementById('modal-balance').textContent = summaryData.balance.toFixed(2);
    
    document.getElementById('summary-month-year').textContent = 
        document.getElementById('current-month-year').textContent;
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

// Закрыть модальное окно расчетов
function closeSummaryModal() {
    document.getElementById('summary-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translate(-50%, 0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
}

// Приветственное сообщение
function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('Добро пожаловать! Кликните на день для ввода данных');
    }, 1000);
}

// Проверка обновлений
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update().then(() => {
                console.log('Service Worker обновлен');
                if (registration.waiting) {
                    registration.waiting.postMessage('skipWaiting');
                    location.reload();
                }
            });
        });
    }
}

// Добавление CSS для уведомлений
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background-color: #4e73df;
            color: white;
            padding: 12px 25px;
            border-radius: 25px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            white-space: nowrap;
        }
    `;
    document.head.appendChild(style);
}

// Обработка PWA установки
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const installButton = document.createElement('button');
    installButton.textContent = 'Установить приложение';
    installButton.id = 'install-button';
    document.body.appendChild(installButton);
    
    installButton.addEventListener('click', () => {
        e.prompt();
        installButton.remove();
    });
});
