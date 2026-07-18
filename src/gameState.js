// Общая конфигурация и состояние игры.

options.__soundDisabled = 0; // Звуки включены

var Game = {
    config: {
        levelLayout: 'level_1', // Имя layout текущего уровня
        maxRubberStretch: 220, // Максимальная длина натяжения резинки
        projectileLifetime: 3, // Время жизни снежка в секундах
        projectileSpeedMultiplier: 0.2, // Коэффициент силы броска
        fragmentStep: 50 // Шаг сетки при создании осколков
    },

    state: {
        level: 0, // Корневой Node текущего уровня
        rubber: 0, // Ссылка на Node резинки
        destructiblesRoot: 0, // Контейнер с основными разрушаемыми объектами
        blocks: [], // Все физические объекты, которым назначены HP и callback столкновения
        activeProjectiles: [], // Все активные снежки
        destructibleCount: 0, // Количество оставшихся основных целей
        shotsUsed: 0, // Количество использованных бросков
        levelCompleted: false, // Защита от повторного завершения уровня
        collisionEventsInitialized: false, // Была ли создана общая подписка на столкновения
        levelToken: 0 // Версия текущего уровня для проверки отложенных callback-ов
    }
};