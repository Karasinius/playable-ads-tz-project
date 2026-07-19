// Общая конфигурация и состояние игры.

options.__soundDisabled = 0; // Звуки включены

var Game = {
    config: {
        levelLayout: 'level_1', // Имя layout текущего уровня

        backgroundMusic: 'backgroundMusic', // Имя фоновой музыки из sounds.json
        backgroundMusicVolume: 0.2, // Громкость фоновой музыки от 0 до 1

        maxRubberStretch: 130, // Максимальное расстояние натяжения резинок
        launcherReturnDuration: 0.25, // Длительность плавного возврата резинок

        // Точки крепления резинок относительно центра userInputArea
        leftRubberAnchor: { x: -51, y: -35 },
        rightRubberAnchor: { x: 59, y: -30 },

        // Точка соединения резинок в исходном состоянии
        rubberRestPoint: { x: 2, y: -5 },

        projectileLifetime: 3, // Время жизни снежка в секундах
        projectileSpeedMultiplier: 0.2, // Коэффициент преобразования натяжения в скорость
        fragmentStep: 50 // Шаг сетки при создании осколков
    },

    state: {
        level: 0, // Корневой Node текущего уровня

        leftRubberVisual: 0, // Левая резинка
        rightRubberVisual: 0, // Правая резинка
        rubberPouchVisual: 0, // Коричневый круг в точке соединения резинок
        projectilePreview: 0, // Изображение снежка при натягивании

        destructiblesRoot: 0, // Контейнер с основными разрушаемыми объектами

        blocks: [], // Все физические объекты, которым назначены HP и callback столкновения
        activeProjectiles: [], // Все активные снежки

        destructibleCount: 0, // Количество оставшихся основных целей
        shotsUsed: 0, // Количество использованных бросков
        levelCompleted: false, // Защита от повторного завершения уровня

        collisionEventsInitialized: false, // Была ли создана общая подписка на столкновения
        backgroundMusicStarted: false, // Была ли запущена фоновая музыка

        levelToken: 0 // Версия текущего уровня для проверки отложенных callback-ов
    }
};