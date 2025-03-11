/**
 * Головний файл календаря, який імпортує всі модулі
 */

// Імпортуємо функції з модулів
import { 
    loadMetadata, 
    loadMonthData, 
    loadAllMonths, 
    loadSelectedMonths,
    lazyLoadMonth,
    preloadNextMonth 
} from './modules/calendar-data.js';

import { 
    renderCalendar, 
    initEventAnimation, 
    addAnimationStyles, 
    showNotification 
} from './modules/calendar-ui.js';

import { 
    initMonthFilter, 
    initTypeFilter
} from './modules/calendar-filters.js';

import { 
    initAddToCalendar, 
    initDownloadPDF 
} from './modules/calendar-export.js';

// Ініціалізуємо календар при завантаженні сторінки
document.addEventListener('DOMContentLoaded', initCalendar);

/**
 * Ініціалізація календаря
 */
function initCalendar() {
    // Додаємо стилі для анімації
    addAnimationStyles();
    
    // Показуємо індикатор завантаження
    const loadingIndicator = document.querySelector('.calendar-loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    // Отримуємо поточний місяць
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Поточний місяць у форматі "MM"
    
    // Отримуємо активний місяць з URL, якщо він є, або використовуємо поточний місяць
    const urlParams = new URLSearchParams(window.location.search);
    const activeMonth = urlParams.get('month') || currentMonth;
    
    loadMetadata()
        .then(metadata => {
            if (['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].includes(activeMonth)) {
                const monthBtn = document.querySelector(`.month-btn[data-month="${activeMonth}"]`);
                if (monthBtn) {
                    document.querySelectorAll('.month-btn').forEach(btn => {
                    btn.classList.remove('active');
                    });
                    monthBtn.classList.add('active');
                }
                
                return loadMonthData(activeMonth)
                    .then(events => {
                        renderCalendar(events, activeMonth);
                        initFiltersAndFunctions();
                        return events;
                    });
                } else {
                const monthBtn = document.querySelector(`.month-btn[data-month="${currentMonth}"]`);
                if (monthBtn) {
                    document.querySelectorAll('.month-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    monthBtn.classList.add('active');
                }
                
                return loadMonthData(currentMonth)
                    .then(events => {
                        renderCalendar(events, currentMonth);
                        initFiltersAndFunctions();
                        preloadNextMonth(currentMonth);
                        return events;
                    });
            }
        })
        .catch(error => {
            showNotification('Помилка завантаження даних календаря. Спробуйте оновити сторінку.', 'error');
            
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        });
}

/**
 * Ініціалізація фільтрів та інших функцій
 */
function initFiltersAndFunctions() {
    // Ініціалізуємо фільтри
    initMonthFilter();
    initTypeFilter();
    
    // Ініціалізуємо анімацію подій
    initEventAnimation();
    
    // Ініціалізуємо функціонал додавання подій в календар
    initAddToCalendar();
    
    // Ініціалізуємо функціонал завантаження PDF
    initDownloadPDF();
} 