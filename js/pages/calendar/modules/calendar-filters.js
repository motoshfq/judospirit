/**
 * Модуль для фільтрації подій календаря
 */

import { showNotification } from './calendar-ui.js';
import { lazyLoadMonth, getEventsByMonth, preloadNextMonth, getAllEvents } from './calendar-data.js';
import { renderCalendar } from './calendar-ui.js';

/**
 * Ініціалізація фільтрації за місяцем
 */
const initMonthFilter = () => {
    const monthButtons = document.querySelectorAll('.month-btn');
    const loadingIndicator = document.querySelector('.calendar-loading');
    
    monthButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Видаляємо активний клас у всіх кнопок
            monthButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Додаємо активний клас поточній кнопці
            this.classList.add('active');
            
            const selectedMonth = this.getAttribute('data-month');
            
            // Предзавантажуємо дані для наступного місяця
            if (selectedMonth !== 'all') {
                preloadNextMonth(selectedMonth);
            }
            
            // Перевіряємо, чи є вже завантажені події для цього місяця
            const monthEvents = getEventsByMonth(selectedMonth);
            
            if (monthEvents && monthEvents.length > 0) {
                // Якщо події вже завантажені, просто рендеримо їх
                renderCalendar(monthEvents, selectedMonth);
            } else {
                // Якщо подій немає, завантажуємо їх
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'flex';
                }
                
                // Ленива загрузка даних для вибраного місяця
                lazyLoadMonth(selectedMonth)
                    .then(events => {
                        // Рендеримо календар тільки з подіями вибраного місяця
                        renderCalendar(events, selectedMonth);
                        
                        // Ховаємо індикатор завантаження
                        if (loadingIndicator) {
                            loadingIndicator.style.display = 'none';
                        }
                        
                        // Предзавантажуємо дані для наступного місяця
                        preloadNextMonth(selectedMonth);
                    })
                    .catch(error => {
                        console.error(`Помилка завантаження даних для місяця ${selectedMonth}:`, error);
                        showNotification(`Помилка завантаження даних для місяця ${selectedMonth}. Спробуйте ще раз.`, 'error');
                        
                        // Ховаємо індикатор завантаження
                        if (loadingIndicator) {
                            loadingIndicator.style.display = 'none';
                        }
                    });
            }
        });
    });
};

/**
 * Ініціалізація фільтрації за типом події
 */
const initTypeFilter = () => {
    const typeButtons = document.querySelectorAll('.type-btn');
    
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Видаляємо активний клас у всіх кнопок
            typeButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Додаємо активний клас поточній кнопці
            this.classList.add('active');
            
            const selectedType = this.getAttribute('data-type');
            
            // Фільтруємо події за типом
            document.querySelectorAll('.event-item').forEach(item => {
                if (selectedType === 'all') {
                    item.style.display = 'flex';
                } else {
                    const itemType = item.getAttribute('data-type');
                    if (itemType === selectedType) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
            
            // Перевіряємо, чи є видимі події в кожному місяці
            document.querySelectorAll('.month-block').forEach(block => {
                const visibleEvents = block.querySelectorAll('.event-item[style="display: flex;"]');
                
                if (visibleEvents.length === 0) {
                    // Приховуємо порожні місяці
                    block.style.display = 'none';
                } else {
                    // Показуємо місяці з подіями
                    block.style.display = 'block';
                }
            });
        });
    });
};

// Експортуємо функції модуля
export {
    initMonthFilter,
    initTypeFilter
}; 