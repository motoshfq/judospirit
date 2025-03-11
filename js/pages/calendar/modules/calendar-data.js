/**
 * Модуль для роботи з даними календаря
 */

// Базовий шлях до файлів з даними
const BASE_PATH = '../assets/database/months/';

// Об'єкт для зберігання даних календаря
let calendarData = [];
let metadataLoaded = false;
let metadata = null;

// Кеш для зберігання завантажених даних місяців
const monthCache = {};

/**
 * Завантаження метаданих календаря
 * @returns {Promise} Promise з метаданими
 */
const loadMetadata = () => {
    return fetch(`${BASE_PATH}metadata.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка завантаження метаданих: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            metadata = data;
            metadataLoaded = true;
            console.log('Метадані календаря успішно завантажені');
            return data;
        });
};

/**
 * Завантаження даних для конкретного місяця
 * @param {string} month - Місяць у форматі "MM"
 * @returns {Promise} Promise з даними місяця
 */
const loadMonthData = (month) => {
    // Перевіряємо, чи є дані в кеші
    if (monthCache[month]) {
        console.log(`Використовуємо кешовані дані для місяця ${month}`);
        return Promise.resolve(monthCache[month]);
    }
    
    console.log(`Завантажуємо дані для місяця ${month} з сервера`);
    return fetch(`${BASE_PATH}${month}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Помилка завантаження даних для місяця ${month}: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Дані для місяця ${month} успішно завантажені:`, data);
            // Перевіряємо структуру даних і повертаємо масив подій
            if (data && data.events && Array.isArray(data.events)) {
                // Зберігаємо дані в кеші
                monthCache[month] = data.events;
                return data.events;
            } else {
                console.error(`Неправильний формат даних для місяця ${month}:`, data);
                return [];
            }
        });
};

/**
 * Завантаження даних для всіх місяців
 * @param {boolean} loadAll - Завантажувати всі місяці чи тільки перші 4
 * @returns {Promise} Promise з усіма даними
 */
const loadAllMonths = (loadAll = false) => {
    console.log('Запуск функції loadAllMonths');
    
    // За замовчуванням завантажуємо тільки перші 4 місяці для швидкості
    const allMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const availableMonths = loadAll ? allMonths : allMonths.slice(0, 4);
    
    console.log(`Завантажуємо ${loadAll ? 'всі' : 'перші 4'} місяці:`, availableMonths);
    
    const promises = availableMonths.map(month => loadMonthData(month));
    return Promise.all(promises)
        .then(monthsData => {
            // Об'єднуємо всі події в один масив
            const allEvents = monthsData.flat();
            console.log(`Завантажено ${allEvents.length} подій з ${availableMonths.length} місяців`);
            calendarData = allEvents;
            return calendarData;
        });
};

/**
 * Завантаження даних для вибраних місяців
 * @param {Array} months - Масив місяців у форматі "MM"
 * @returns {Promise} Promise з даними вибраних місяців
 */
const loadSelectedMonths = (months) => {
    const promises = months.map(month => loadMonthData(month));
    return Promise.all(promises)
        .then(monthsData => {
            // Об'єднуємо всі події в один масив
            const events = monthsData.flat();
            // Додаємо нові події до загального масиву
            calendarData = [...calendarData, ...events];
            // Видаляємо дублікати
            calendarData = calendarData.filter((event, index, self) =>
                index === self.findIndex((e) => e.id === event.id)
            );
            return events;
        });
};

/**
 * Отримання всіх завантажених даних
 * @returns {Array} Масив подій
 */
const getAllEvents = () => {
    return calendarData;
};

/**
 * Отримання події за ID
 * @param {number} id - ID події
 * @returns {Object|null} Подія або null, якщо не знайдено
 */
const getEventById = (id) => {
    return calendarData.find(event => event.id === parseInt(id)) || null;
};

/**
 * Отримання подій за типом
 * @param {string} type - Тип події
 * @returns {Array} Масив подій вибраного типу
 */
const getEventsByType = (type) => {
    return calendarData.filter(event => event.type === type);
};

/**
 * Отримання подій за місяцем
 * @param {string} month - Місяць у форматі "MM"
 * @returns {Array} Масив подій вибраного місяця
 */
const getEventsByMonth = (month) => {
    return calendarData.filter(event => {
        const eventDate = new Date(event.dateStart);
        const eventMonth = (eventDate.getMonth() + 1).toString().padStart(2, '0');
        return eventMonth === month;
    });
};

/**
 * Пошук подій за ключовим словом
 * @param {string} keyword - Ключове слово для пошуку
 * @returns {Array} Масив знайдених подій
 */
const searchEvents = (keyword) => {
    const searchTerm = keyword.toLowerCase();
    return calendarData.filter(event => {
        return event.title.toLowerCase().includes(searchTerm) || 
               event.location.toLowerCase().includes(searchTerm);
    });
};

/**
 * Ленива загрузка додаткових місяців
 * @param {string} targetMonth - Місяць, який потрібно завантажити
 * @returns {Promise} Promise з даними для вказаного місяця
 */
const lazyLoadMonth = (targetMonth) => {
    console.log(`Ленива загрузка місяця ${targetMonth}`);
    
    // Перевіряємо, чи вже є дані для цього місяця
    const monthEvents = calendarData.filter(event => {
        const eventMonth = event.dateStart.substring(5, 7);
        return eventMonth === targetMonth;
    });
    
    if (monthEvents.length > 0) {
        console.log(`Місяць ${targetMonth} вже завантажено, повертаємо наявні дані`);
        return Promise.resolve(monthEvents);
    }
    
    // Завантажуємо дані для вказаного місяця
    return loadMonthData(targetMonth)
        .then(events => {
            console.log(`Завантажено ${events.length} подій для місяця ${targetMonth}`);
            
            // Додаємо нові події до загального масиву
            calendarData = [...calendarData, ...events];
            
            return events;
        });
};

/**
 * Предзавантаження даних для наступного місяця
 * @param {string} currentMonth - Поточний місяць у форматі "MM"
 */
const preloadNextMonth = (currentMonth) => {
    if (!currentMonth || currentMonth === 'all') return;
    
    // Конвертуємо місяць в число
    const monthNum = parseInt(currentMonth, 10);
    if (isNaN(monthNum)) return;
    
    // Визначаємо наступний місяць
    let nextMonth = monthNum + 1;
    if (nextMonth > 12) return; // Не завантажуємо, якщо це грудень
    
    // Форматуємо наступний місяць у формат "MM"
    nextMonth = nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
    
    // Перевіряємо, чи вже є дані в кеші
    if (monthCache[nextMonth]) {
        console.log(`Дані для наступного місяця ${nextMonth} вже в кеші`);
        return;
    }
    
    // Завантажуємо дані для наступного місяця у фоновому режимі
    console.log(`Предзавантаження даних для наступного місяця ${nextMonth}`);
    setTimeout(() => {
        loadMonthData(nextMonth)
            .then(events => {
                console.log(`Предзавантажено ${events.length} подій для місяця ${nextMonth}`);
            })
            .catch(error => {
                console.error(`Помилка предзавантаження даних для місяця ${nextMonth}:`, error);
            });
    }, 1000); // Затримка в 1 секунду, щоб не блокувати основний потік
};

// Експортуємо функції модуля
export {
    loadMetadata,
    loadMonthData,
    loadAllMonths,
    loadSelectedMonths,
    getAllEvents,
    getEventById,
    getEventsByType,
    getEventsByMonth,
    searchEvents,
    lazyLoadMonth,
    preloadNextMonth
}; 