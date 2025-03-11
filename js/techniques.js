/**
 * JavaScript для страницы "Техніки"
 */

document.addEventListener('DOMContentLoaded', () => {
    // Плавная загрузка изображения в секции hero
    const heroImage = document.querySelector('.techniques-hero .hero-image img');
    if (heroImage) {
        // Добавляем класс для скрытия изображения до загрузки
        heroImage.classList.add('loading');
        
        // Когда изображение загружено, удаляем класс loading
        heroImage.onload = function() {
            setTimeout(() => {
                heroImage.classList.remove('loading');
            }, 100);
        };
        
        // Если изображение уже загружено из кэша
        if (heroImage.complete) {
            setTimeout(() => {
                heroImage.classList.remove('loading');
            }, 100);
        }
    }
    
    // Обработка клика по категориям техник
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            
            // Добавляем класс активной категории
            categoryCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            // Здесь можно добавить логику фильтрации техник по категории
            // Например, показывать только техники выбранной категории
            filterTechniquesByCategory(category);
        });
    });
    
    // Функция для фильтрации техник по категории
    function filterTechniquesByCategory(category) {
        const techniqueCards = document.querySelectorAll('.technique-card');
        
        techniqueCards.forEach(card => {
            const techniqueCategory = card.querySelector('.technique-category').textContent;
            
            if (category === 'all' || techniqueCategory.toLowerCase().includes(category.split('-')[0].toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Обработка клика по видео-карточкам
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            const videoThumbnail = card.querySelector('.video-thumbnail');
            const videoTitle = card.querySelector('.video-info h4').textContent;
            
            // Здесь можно добавить логику открытия модального окна с видео
            // или перенаправления на страницу с видео
            console.log(`Открыто видео: ${videoTitle}`);
            
            // Пример: имитация клика по видео
            videoThumbnail.classList.add('clicked');
            setTimeout(() => {
                videoThumbnail.classList.remove('clicked');
            }, 300);
        });
    });
    
    // Добавляем кнопку "Все категории" программно
    const categoriesGrid = document.querySelector('.categories-grid');
    if (categoriesGrid) {
        const allCategoriesCard = document.createElement('div');
        allCategoriesCard.className = 'category-card active';
        allCategoriesCard.setAttribute('data-category', 'all');
        
        allCategoriesCard.innerHTML = `
            <div class="category-icon">
                <img src="../assets/images/all-techniques-icon.svg" alt="Всі техніки">
            </div>
            <h4>Всі техніки</h4>
            <p>Перегляд усіх технік дзюдо</p>
        `;
        
        // Вставляем в начало сетки
        categoriesGrid.prepend(allCategoriesCard);
        
        // Добавляем обработчик события
        allCategoriesCard.addEventListener('click', () => {
            categoryCards.forEach(c => c.classList.remove('active'));
            allCategoriesCard.classList.add('active');
            filterTechniquesByCategory('all');
        });
    }
}); 