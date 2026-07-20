// Общая конфигурация и состояние игры.

options.__soundDisabled = 0; // Звуки включены

var Game = {
    config: {
        /*
         * Конфигурация уровней, порогов получения звезд и здоровья объектов.
         *
         * HP хранится здесь, потому что редактор перетирает неизвестные
         * пользовательские свойства при сохранении layout.
         *
         * У каждого уровня собственная таблица destructibleHp, поскольку
         * состав и имена разрушаемых объектов на разных уровнях отличаются.
         */
        levels: [
            {
                layout: 'level_1',
                enabled: true,
                threeStarsMax: 2, // 3 звезды за 1-2 броска
                twoStarsMax: 4, // 2 звезды за 3-4 броска

                // Индивидуальное здоровье разрушаемых объектов первого уровня
                destructibleHp: {
                    squareBlock1: 50,
                    circleBlock1: 160,
                    rectangleBlock1: 100,
                    rectangleBlock2: 160,
                    rectangleBlock3: 160,
                    rectangleBlock4: 160,
                    rectangleBlock5: 320,
                }
            },
            {
                layout: 'level_2',
                enabled: true,
                threeStarsMax: 3, // 3 звезды за 1-3 броска
                twoStarsMax: 6, // 2 звезды за 4-6 бросков

                // Индивидуальное здоровье разрушаемых объектов второго уровня
                destructibleHp: {
                    squareBlock1: 60,
                    circleBlock1: 180,
                    rectangleBlock1: 60,
                    rectangleBlock2: 180,
                    rectangleBlock3: 60,
                    rectangleBlock4: 160,
                }
            },
            {
                layout: 'level_3',
                enabled: true,
                threeStarsMax: 2, // 3 звезды за 1-2 броска
                twoStarsMax: 6, // 2 звезды за 3-6 бросков

                // Индивидуальное здоровье разрушаемых объектов третьего уровня
                destructibleHp: {
                    squareBlock1: 170,
                    squareBlock2: 140,
                    squareBlock3: 140,
                    circleBlock1: 200,
                    rectangleBlock1: 50,
                    rectangleBlock2: 120,
                    rectangleBlock3: 80,
                    rectangleBlock4: 130,
                    rectangleBlock5: 40,
                    rectangleBlock6: 50,
                }
            }
        ],

        defaultDestructibleHp: 100, // HP цели, если ее имя отсутствует в конфигурации уровня
        breakBlockHp: 25, // HP временных осколков

        backgroundMusic: 'backgroundMusic', // Имя фоновой музыки из sounds.json
        backgroundMusicVolume: 0.2, // Громкость фоновой музыки от 0 до 1

        maxRubberStretch: 130, // Максимальное расстояние натяжения резинок
        launcherReturnDuration: 0.25, // Длительность плавного возврата резинок

        // Точки крепления резинок относительно центра userInputArea
        leftRubberAnchor: { x: -51, y: -35 },
        rightRubberAnchor: { x: 59, y: -30 },

        // Исходная точка соединения резинок относительно центра userInputArea
        rubberRestPoint: { x: 2, y: -5 },

        projectileLifetime: 4, // Время жизни снежка в секундах
        projectileSpeedMultiplier: 0.2, // Коэффициент преобразования натяжения в скорость
        fragmentStep: 50 // Шаг сетки при создании осколков
    },

    state: {
        level: 0, // Корневой Node текущего уровня
        currentLevelIndex: 0, // Индекс текущего уровня

        leftRubberVisual: 0, // Левая резинка
        rightRubberVisual: 0, // Правая резинка
        rubberPouchVisual: 0, // Cтык резинок (мешочек)
        projectilePreview: 0, // Изображение снежка при натягивании

        destructiblesRoot: 0, // Контейнер основных разрушаемых объектов

        blocks: [], // Все физические объекты с HP
        activeProjectiles: [], // Все активные снежки

        destructibleCount: 0, // Количество оставшихся основных целей
        shotsUsed: 0, // Количество использованных бросков
        earnedStars: 0, // Количество полученных звезд

        gameStarted: false, // Был ли закрыт стартовый экран
        levelCompleted: false, // Защита от повторного завершения уровня
        levelTransitionInProgress: false, // Защита от повторного перехода между уровнями

        collisionEventsInitialized: false, // Была ли создана подписка на столкновения
        backgroundMusicStarted: false, // Была ли запущена музыка

        levelToken: 0 // Версия текущего уровня для отложенных callback-ов
    }
};