/**
 * Модуль для експорту подій календаря
 */

import { getEventById } from './calendar-data.js';
import { getEventTypeName, showNotification } from './calendar-ui.js';

/**
 * Ініціалізація функціоналу додавання подій в календар
 */
const initAddToCalendar = () => {
    const eventItems = document.querySelectorAll('.event-item');
    
    eventItems.forEach(item => {
        item.addEventListener('click', function() {
            const eventId = this.dataset.id;
            const eventTitle = this.querySelector('.event-title').textContent;
            
            // Знаходимо подію в масиві даних
            const event = getEventById(eventId);
            
            if (event) {
                // Створюємо iCalendar файл
                const icsContent = generateICS(event);
                
                // Створюємо Blob з вмістом iCalendar
                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                
                // Створюємо URL для Blob
                const url = URL.createObjectURL(blob);
                
                // Створюємо посилання для завантаження
                const link = document.createElement('a');
                link.href = url;
                link.download = `${eventTitle.replace(/[^\w\s]/gi, '')}.ics`;
                
                // Додаємо посилання в DOM і клікаємо по ньому
                document.body.appendChild(link);
                link.click();
                
                // Видаляємо посилання з DOM і звільняємо URL
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 100);
                
                // Показуємо сповіщення
                showNotification(`Подію "${eventTitle}" додано в календар`, 'success');
            }
        });
    });
};

/**
 * Генерація iCalendar файлу
 * @param {Object} event - Об'єкт події
 * @returns {string} Вміст iCalendar файлу
 */
const generateICS = (event) => {
    // Форматуємо дати для iCalendar (формат: YYYYMMDDTHHMMSSZ)
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '');
    };
    
    // Створюємо унікальний ідентифікатор для події
    const uid = `${event.id}@judoukraine.org`;
    
    // Форматуємо дати початку і кінця
    const dtStart = formatDate(event.dateStart);
    const dtEnd = formatDate(event.dateEnd);
    
    // Створюємо вміст iCalendar
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//JudoUkraine//Calendar//UK',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${event.title}`,
        `LOCATION:${event.location}`,
        `DESCRIPTION:Тип: ${getEventTypeName(event.type)}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    
    return icsContent;
};

/**
 * Ініціалізація функціоналу завантаження PDF
 */
const initDownloadPDF = () => {
    const downloadBtn = document.querySelector('.download-pdf-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Шлях до PDF файлу
            const pdfPath = '../assets/documents/calendar-2025.pdf';
            
            // Створюємо посилання для завантаження
            const link = document.createElement('a');
            link.href = pdfPath;
            link.download = 'Календар змагань з дзюдо 2025.pdf';
            link.target = '_blank';
            
            // Додаємо посилання в DOM і клікаємо по ньому
            document.body.appendChild(link);
            link.click();
            
            // Видаляємо посилання з DOM
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
            
            // Показуємо сповіщення
            showNotification('Завантаження календаря розпочато', 'success');
        });
    }
};

// Експортуємо функції модуля
export {
    initAddToCalendar,
    initDownloadPDF,
    generateICS
}; 