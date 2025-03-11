/**
 * Модуль для рендерингу UI календаря
 */

// Кеш для зберігання вже відрендерених місяців
const renderedMonthsCache = {};

// Поточний активний місяць
let activeMonth = 'all';

/**
 * Рендеринг календаря
 * @param {Array} data - Масив подій
 * @param {string} selectedMonth - Вибраний місяць (формат "MM" або "all")
 */
const renderCalendar = (data, selectedMonth = 'all') => {
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    
    // Зберігаємо активний місяць
    activeMonth = selectedMonth;
    
    // Приховуємо індикатор завантаження
    const loadingIndicator = document.querySelector('.calendar-loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    console.log(`Рендеринг календаря з даними для місяця ${selectedMonth}:`, data);
    
    // Перевіряємо, чи є дані
    if (!data || !Array.isArray(data) || data.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.className = 'no-events';
        noEvents.textContent = selectedMonth === 'all' 
            ? 'Немає запланованих подій на цей рік' 
            : `Немає запланованих подій на ${getMonthName(selectedMonth)}`;
        calendarContainer.innerHTML = '';
        calendarContainer.appendChild(noEvents);
        return;
    }
    
    // Групуємо події за місяцями
    const eventsByMonth = groupEventsByMonth(data);
    console.log('Результат групування подій за місяцями:', eventsByMonth);
    
    // Створюємо DocumentFragment для оптимізації рендерингу
    const fragment = document.createDocumentFragment();
    
    // Визначаємо, які місяці потрібно відображати
    const monthsToRender = selectedMonth === 'all' 
        ? Object.keys(eventsByMonth) 
        : [selectedMonth];
    
    // Перевіряємо, які місяці вже відрендерені
    const existingMonthBlocks = {};
    document.querySelectorAll('.month-block').forEach(block => {
        existingMonthBlocks[block.id] = block;
    });
    
    // Рендеримо потрібні місяці
    monthsToRender.forEach(month => {
        // Пропускаємо місяці без подій
        if (!eventsByMonth[month] || eventsByMonth[month].length === 0) return;
        
        const monthId = `month-${month}`;
        
        // Перевіряємо, чи вже є цей місяць у DOM
        if (existingMonthBlocks[monthId]) {
            // Якщо місяць вже є в DOM, зберігаємо його
            fragment.appendChild(existingMonthBlocks[monthId]);
            delete existingMonthBlocks[monthId];
        } else {
            // Якщо місяця немає в DOM, створюємо новий блок
            const monthBlock = document.createElement('div');
            monthBlock.className = 'month-block';
            monthBlock.id = monthId;
            
            const monthTitle = document.createElement('h2');
            monthTitle.className = 'month-title';
            monthTitle.textContent = getMonthName(month);
            monthBlock.appendChild(monthTitle);
            
            // Додаємо кнопки навігації між місяцями
            addMonthNavigation(monthTitle, selectedMonth);
            
            // Створюємо контейнер для подій
            const eventsList = document.createElement('div');
            eventsList.className = 'events-list';
            
            // Додаємо події місяця
            eventsByMonth[month].forEach(event => {
                const eventItem = createEventItem(event);
                eventsList.appendChild(eventItem);
            });
            
            monthBlock.appendChild(eventsList);
            fragment.appendChild(monthBlock);
        }
    });
    
    // Очищаємо контейнер, зберігаючи тільки потрібні місяці
    calendarContainer.innerHTML = '';
    calendarContainer.appendChild(fragment);
    
    // Ініціалізуємо анімацію подій
    initEventAnimation();
};

/**
 * Групування подій за місяцями
 * @param {Array} events - Масив подій
 * @returns {Object} Об'єкт з подіями, згрупованими за місяцями
 */
const groupEventsByMonth = (events) => {
    const eventsByMonth = {};
    
    if (!events || !Array.isArray(events)) {
        console.error('Неправильний формат даних для групування за місяцями:', events);
        return eventsByMonth;
    }
    
    console.log('Групування подій за місяцями:', events);
    
    events.forEach(event => {
        if (!event || !event.dateStart) {
            console.error('Подія не містить дати початку:', event);
            return;
        }
        
        try {
            // Дата початку події
            const dateStart = new Date(event.dateStart);
            if (isNaN(dateStart.getTime())) {
                console.error('Неправильний формат дати початку:', event.dateStart);
                return;
            }
            
            // Дата закінчення події
            const dateEnd = new Date(event.dateEnd); 
            if (isNaN(dateEnd.getTime())) {
                console.error('Неправильний формат дати закінчення:', event.dateEnd);
                return;
            }
            
            // Місяць початку події
            const monthStart = (dateStart.getMonth() + 1).toString().padStart(2, '0');
            
            // Додаємо подію до місяця початку
            if (!eventsByMonth[monthStart]) {
                eventsByMonth[monthStart] = [];
            }
            eventsByMonth[monthStart].push(event);
            
            // Якщо подія переходить на інший місяць, додаємо її і до місяця закінчення
            const monthEnd = (dateEnd.getMonth() + 1).toString().padStart(2, '0');
            if (monthStart !== monthEnd) {
                console.log(`Подія ${event.id} переходить з місяця ${monthStart} в місяць ${monthEnd}`);
                
                if (!eventsByMonth[monthEnd]) {
                    eventsByMonth[monthEnd] = [];
                }
                
                // Перевіряємо, чи не додана вже ця подія до місяця закінчення
                const alreadyAdded = eventsByMonth[monthEnd].some(e => e.id === event.id);
                if (!alreadyAdded) {
                    eventsByMonth[monthEnd].push(event);
                }
            }
        } catch (error) {
            console.error('Помилка при обробці події:', error, event);
        }
    });
    
    console.log('Результат групування подій за місяцями:', eventsByMonth);
    
    return eventsByMonth;
};

/**
 * Отримання назви місяця
 * @param {number} month - Номер місяця (1-12)
 * @returns {string} Назва місяця
 */
const getMonthName = (month) => {
    const monthNames = [
        'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    
    return monthNames[month - 1];
};

/**
 * Створення елемента події
 * @param {Object} event - Об'єкт події
 * @returns {HTMLElement} HTML елемент події
 */
const createEventItem = (event) => {
    const eventItem = document.createElement('div');
    eventItem.className = 'event-item';
    eventItem.dataset.type = event.type;
    eventItem.dataset.id = event.id;
    
    // Форматуємо дати
    const dateStart = new Date(event.dateStart);
    
    // Форматуємо повну дату для тега
    const day = dateStart.getDate();
    const month = getMonthNameGenitive(dateStart.getMonth() + 1);
    const year = dateStart.getFullYear();
    
    // Створюємо HTML для події
    eventItem.innerHTML = `
        <div class="event-svg"></div>
        <div class="event-details">
            <div class="tags-container">
                <span class="date-tag">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                    <span class="year">${year}</span>
                </span>
                <span class="event-type ${event.type}">${getEventTypeName(event.type)}</span>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-location">${event.location}</p>
        </div>
    `;
    
    return eventItem;
};

/**
 * Отримання назви місяця в родовому відмінку (червня, липня і т.д.)
 * @param {number} month - Номер місяця (1-12)
 * @returns {string} Назва місяця в родовому відмінку
 */
const getMonthNameGenitive = (month) => {
    const monthNamesGenitive = [
        'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
        'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
    ];
    
    return monthNamesGenitive[month - 1];
};

/**
 * Форматування діапазону дат
 * @param {Date} dateStart - Дата початку
 * @param {Date} dateEnd - Дата кінця
 * @returns {string} Відформатований діапазон дат
 */
const formatDateRange = (dateStart, dateEnd) => {
    // Якщо дати однакові, повертаємо тільки день
    if (dateStart.getTime() === dateEnd.getTime()) {
        return dateStart.getDate().toString();
    }
    
    // Якщо місяці однакові, повертаємо діапазон днів
    if (dateStart.getMonth() === dateEnd.getMonth()) {
        return `${dateStart.getDate()}-${dateEnd.getDate()}`;
    }
    
    // Якщо місяці різні, повертаємо повний діапазон з днями та місяцями
    return `${dateStart.getDate()}.${(dateStart.getMonth() + 1).toString().padStart(2, '0')}-${dateEnd.getDate()}.${(dateEnd.getMonth() + 1).toString().padStart(2, '0')}`;
};

/**
 * Отримання назви типу події
 * @param {string} type - Тип події
 * @returns {string} Назва типу події
 */
const getEventTypeName = (type) => {
    const typeNames = {
        'international': 'Міжнародний',
        'national': 'Національний',
        'regional': 'Регіональний',
        'training': 'Тренувальний'
    };
    
    return typeNames[type] || type;
};

/**
 * Анімація появи подій
 */
const initEventAnimation = () => {
    const eventItems = document.querySelectorAll('.event-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    eventItems.forEach((item, index) => {
        // Додаємо клас для анімації
        item.classList.add('animate-on-scroll');
        // Додаємо затримку в залежності від індексу
        item.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(item);
    });
};

/**
 * Додавання стилів для анімації
 */
const addAnimationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-on-scroll.animate {
            opacity: 1;
            transform: translateY(0);
        }
        
        .no-events {
            padding: 2rem;
            text-align: center;
            color: var(--gray-color);
            font-style: italic;
            background-color: white;
            border-radius: var(--card-border-radius);
            box-shadow: var(--box-shadow);
        }
    `;
    document.head.appendChild(style);
};

/**
 * Відображення сповіщення
 * @param {string} message - Текст сповіщення
 * @param {string} type - Тип сповіщення (info, success, error)
 */
const showNotification = (message, type = 'info') => {
    // Створюємо елемент сповіщення
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Стилізуємо сповіщення
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '1000',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease'
    });
    
    // Встановлюємо колір в залежності від типу сповіщення
    if (type === 'success') {
        notification.style.backgroundColor = '#2ecc71';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    } else {
        notification.style.backgroundColor = '#3498db';
    }
    
    // Додаємо сповіщення в DOM
    document.body.appendChild(notification);
    
    // Анімуємо появу
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Видаляємо сповіщення через 3 секунди
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        // Видаляємо елемент з DOM після завершення анімації
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
};

/**
 * Додає кнопки навігації між місяцями
 * @param {HTMLElement} monthTitle - Елемент заголовка місяця
 * @param {string} currentMonth - Поточний місяць у форматі "MM"
 */
const addMonthNavigation = (monthTitle, currentMonth) => {
    // Якщо це режим "всі місяці", не додаємо навігацію
    if (currentMonth === 'all') return;
    
    // Очищаємо заголовок від тексту
    monthTitle.textContent = '';
    
    // Створюємо елемент для назви місяця та року
    const monthYear = document.createElement('span');
    monthYear.className = 'month-year';
    
    // Створюємо елемент для назви місяця
    const monthName = document.createElement('span');
    monthName.className = 'month-name';
    monthName.textContent = getMonthName(currentMonth);
    
    // Створюємо елемент для року
    const year = document.createElement('span');
    year.className = 'year';
    year.textContent = '2025';
    
    // Додаємо елементи до заголовка
    monthYear.appendChild(monthName);
    monthYear.appendChild(year);
    monthTitle.appendChild(monthYear);
    
    // Створюємо контейнер для кнопок навігації
    const navContainer = document.createElement('div');
    navContainer.className = 'month-navigation';
    
    // Конвертуємо місяць в число
    const monthNum = parseInt(currentMonth, 10);
    
    // Функція для переходу до попереднього місяця
    const goToPrevMonth = () => {
        if (monthNum <= 1) return; // Не робимо нічого для січня
        const prevMonth = (monthNum - 1).toString().padStart(2, '0');
        navigateToMonth(prevMonth);
    };
    
    // Функція для переходу до наступного місяця
    const goToNextMonth = () => {
        if (monthNum >= 12) return; // Не робимо нічого для грудня
        const nextMonth = (monthNum + 1).toString().padStart(2, '0');
        navigateToMonth(nextMonth);
    };
    
    // Створюємо кнопку "Попередній місяць"
    const prevBtn = document.createElement('a');
    prevBtn.className = 'month-nav-btn prev-month';
    prevBtn.innerHTML = '&#10094;'; // Стрілка
    prevBtn.title = 'Попередній місяць';
    prevBtn.href = 'javascript:void(0);'; // Робимо посиланням для кращої кликабельності
    prevBtn.setAttribute('role', 'button');
    prevBtn.setAttribute('tabindex', '0');
    
    if (monthNum <= 1) {
        prevBtn.classList.add('disabled');
        prevBtn.setAttribute('aria-disabled', 'true');
    } else {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToPrevMonth();
        };
        
        // Додаємо обробник для клавіатури
        prevBtn.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToPrevMonth();
            }
        };
    }
    
    // Створюємо кнопку "Наступний місяць"
    const nextBtn = document.createElement('a');
    nextBtn.className = 'month-nav-btn next-month';
    nextBtn.innerHTML = '&#10095;'; // Стрілка
    nextBtn.title = 'Наступний місяць';
    nextBtn.href = 'javascript:void(0);'; // Робимо посиланням для кращої кликабельності
    nextBtn.setAttribute('role', 'button');
    nextBtn.setAttribute('tabindex', '0');
    
    if (monthNum >= 12) {
        nextBtn.classList.add('disabled');
        nextBtn.setAttribute('aria-disabled', 'true');
    } else {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToNextMonth();
        };
        
        // Додаємо обробник для клавіатури
        nextBtn.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToNextMonth();
            }
        };
    }
    
    // Додаємо кнопки до контейнера
    navContainer.appendChild(prevBtn);
    navContainer.appendChild(nextBtn);
    
    // Додаємо контейнер до заголовка місяця
    monthTitle.appendChild(navContainer);
};

/**
 * Функція для навігації до вказаного місяця
 * @param {string} month - Місяць у форматі "MM"
 */
const navigateToMonth = (month) => {
    console.log(`Навігація до місяця: ${month}`);
    
    // Знаходимо кнопку місяця в селекторі
    const monthBtn = document.querySelector(`.month-btn[data-month="${month}"]`);
    if (monthBtn) {
        console.log(`Знайдено кнопку для місяця ${month}, виконуємо клік`);
        monthBtn.click();
    } else {
        console.error(`Не знайдено кнопку для місяця ${month}`);
        
        // Альтернативний спосіб - завантажуємо дані для місяця напряму
        import('./calendar-data.js').then(module => {
            const { lazyLoadMonth } = module;
            
            // Показуємо індикатор завантаження
            const loadingIndicator = document.querySelector('.calendar-loading');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'flex';
            }
            
            // Завантажуємо дані для місяця
            lazyLoadMonth(month)
                .then(events => {
                    // Рендеримо календар з подіями місяця
                    renderCalendar(events, month);
                    
                    // Ховаємо індикатор завантаження
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error(`Помилка завантаження даних для місяця ${month}:`, error);
                    
                    // Ховаємо індикатор завантаження
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                });
        });
    }
};

// Експортуємо функції модуля
export {
    renderCalendar,
    groupEventsByMonth,
    getMonthName,
    createEventItem,
    formatDateRange,
    getEventTypeName,
    initEventAnimation,
    addAnimationStyles,
    showNotification,
    addMonthNavigation,
    navigateToMonth
}; 