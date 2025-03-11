/**
 * Модуль для отображения ближайших соревнований на главной странице
 */

// Базовый путь к файлам с данными
const BASE_PATH = 'assets/database/months/';

/**
 * Загрузка метаданных календаря
 * @returns {Promise} Promise с метаданными
 */
const loadMetadata = () => {
    return fetch(`${BASE_PATH}metadata.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки метаданных: ' + response.status);
            }
            return response.json();
        });
};

/**
 * Загрузка данных для конкретного месяца
 * @param {string} month - Месяц в формате "MM"
 * @returns {Promise} Promise с данными месяца
 */
const loadMonthData = (month) => {
    return fetch(`${BASE_PATH}${month}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки данных для месяца ${month}: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.events && Array.isArray(data.events)) {
                return data.events;
            } else {
                console.error(`Неправильный формат данных для месяца ${month}:`, data);
                return [];
            }
        });
};

/**
 * Получение ближайших соревнований
 * @param {number} count - Количество соревнований для отображения
 * @returns {Promise} Promise с ближайшими соревнованиями
 */
const getUpcomingEvents = (count = 3) => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    
    // Определяем месяцы для загрузки (текущий и 3 следующих)
    const monthsToLoad = [];
    for (let i = 0; i < 4; i++) {
        const monthNum = (currentDate.getMonth() + i + 1) % 12 || 12; // Если 0, то это декабрь (12)
        monthsToLoad.push(monthNum.toString().padStart(2, '0'));
    }
    
    console.log('Загружаем данные для месяцев:', monthsToLoad);
    
    // Загружаем данные для выбранных месяцев
    const promises = monthsToLoad.map(month => loadMonthData(month));
    
    return Promise.all(promises)
        .then(monthsData => {
            // Объединяем все события в один массив
            const allEvents = monthsData.flat();
            
            // Фильтруем события, оставляя только соревнования (не тренировки) и те, которые еще не прошли
            const upcomingEvents = allEvents.filter(event => {
                const eventDate = new Date(event.dateStart);
                return eventDate >= currentDate && event.type !== 'training';
            });
            
            // Сортируем события по дате начала
            upcomingEvents.sort((a, b) => {
                return new Date(a.dateStart) - new Date(b.dateStart);
            });
            
            console.log(`Найдено ${upcomingEvents.length} предстоящих соревнований`);
            
            // Возвращаем указанное количество ближайших событий
            return upcomingEvents.slice(0, count);
        })
        .catch(error => {
            console.error('Ошибка при получении ближайших соревнований:', error);
            return [];
        });
};

/**
 * Форматирование даты для отображения
 * @param {string} dateStr - Дата в формате ISO
 * @returns {Object} Объект с днем и месяцем
 */
const formatEventDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    
    // Массив месяцев в родительном падеже
    const months = [
        'Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 
        'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'
    ];
    
    const month = months[date.getMonth()];
    
    return { day, month };
};

/**
 * Отображение ближайших соревнований на главной странице
 */
const displayUpcomingEvents = () => {
    const eventsContainer = document.querySelector('.events-slider');
    if (!eventsContainer) return;
    
    // Показываем индикатор загрузки, если он есть
    const loadingIndicator = document.querySelector('.events-loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // Пытаемся загрузить события с сервера, если не получится - используем демо-данные
    getUpcomingEvents(3)
        .then(events => {
            // Если нет событий, используем демо-данные
            if (!events || events.length === 0) {
                console.log('Используем демо-данные для отображения событий');
                // Фильтруем демо-данные, исключая тренировки
                events = DEMO_EVENTS.filter(event => event.type !== 'training');
            }
            
            // Скрываем индикатор загрузки
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Очищаем контейнер
            eventsContainer.innerHTML = '';
            
            // Добавляем события
            events.forEach(event => {
                const { day, month } = formatEventDate(event.dateStart);
                
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                
                // Определяем класс для типа соревнования
                let typeClass = '';
                switch(event.type) {
                    case 'international':
                        typeClass = 'event-international';
                        break;
                    case 'national':
                        typeClass = 'event-national';
                        break;
                }
                
                eventCard.innerHTML = `
                    <div class="event-date ${typeClass}">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                    <div class="event-details">
                        <h4>${event.title}</h4>
                        <p class="location">${event.location}</p>
                        <a href="pages/calendar.html?event=${event.id}" class="btn-outline">Детальніше</a>
                    </div>
                `;
                
                eventsContainer.appendChild(eventCard);
            });
            
            // Обновляем состояние кнопок слайдера
            const sliderModule = window.initEventSlider;
            if (typeof sliderModule === 'function') {
                sliderModule();
            }
        })
        .catch(error => {
            console.error('Ошибка при отображении ближайших соревнований:', error);
            
            // Скрываем индикатор загрузки
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Используем демо-данные в случае ошибки
            console.log('Используем демо-данные из-за ошибки загрузки');
            
            // Очищаем контейнер
            eventsContainer.innerHTML = '';
            
            // Добавляем демо-события (только соревнования, без тренировок)
            DEMO_EVENTS.filter(event => event.type !== 'training').forEach(event => {
                const { day, month } = formatEventDate(event.dateStart);
                
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                
                // Определяем класс для типа соревнования
                let typeClass = '';
                switch(event.type) {
                    case 'international':
                        typeClass = 'event-international';
                        break;
                    case 'national':
                        typeClass = 'event-national';
                        break;
                }
                
                eventCard.innerHTML = `
                    <div class="event-date ${typeClass}">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                    <div class="event-details">
                        <h4>${event.title}</h4>
                        <p class="location">${event.location}</p>
                        <a href="pages/calendar.html?event=${event.id}" class="btn-outline">Детальніше</a>
                    </div>
                `;
                
                eventsContainer.appendChild(eventCard);
            });
        });
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', displayUpcomingEvents);

// Экспортируем функции
export { getUpcomingEvents, displayUpcomingEvents }; 