// Загрузка, завершение и выгрузка уровня.

/**
 * Показ окна победы.
 */
Game.showWin = function () {
    playSound('win');

    showWindow('win', winWindow => {
        winWindow.__setAliasesData({
            // Выводим количество использованных бросков в текстовый Node
            shotsUsedText(node) {
                if (node.__text) {
                    node.__text.__text = 'Shots used: ' + Game.state.shotsUsed;
                }
            },

            // Логика кнопки окна победы
            button: {
                __onTap() {
                    // Позже здесь будет выгрузка текущего уровня и загрузка следующего
                    Game.log('[Game] Next level is not implemented yet');
                },
                __onTapHighlight: 1
            }
        });
    });
};

/**
 * Завершение уровня только один раз.
 */
Game.completeLevel = function () {
    if (Game.state.levelCompleted) {
        return;
    }

    Game.state.levelCompleted = true; // Блокируем повторную победу и новые броски
    Game.clearActiveProjectiles(); // После победы активные снежки больше не нужны
    Game.resetLauncherVisuals(); // Возвращаем рогатку в исходное состояние

    // shotsUsed пока не сбрасывается, потому что выводится в окне победы
    Game.log('[Game] Level completed. Shots used:', Game.state.shotsUsed);

    _setTimeout(() => {
        Game.showWin();
    }, 1);
};

/**
 * Удаление уровня и полный сброс его состояния.
 */
Game.unloadLevel = function () {
    var i, block, body;

    Game.state.levelToken++; // Старые отложенные callback-и получают неактуальный token
    Game.clearActiveProjectiles();

    // Отключаем callbacks физических тел старого уровня
    for (i = 0; i < Game.state.blocks.length; i++) {
        block = Game.state.blocks[i];
        body = block && block.__ph_body;

        if (body) {
            body.__onCollision = 0;
        }
    }

    Game.state.blocks.length = 0;
    Game.state.destructibleCount = 0;
    Game.state.shotsUsed = 0;
    Game.state.levelCompleted = false;
    
    Game.state.leftRubberVisual = 0;
    Game.state.rightRubberVisual = 0;
    Game.state.rubberPouchVisual = 0;
    Game.state.projectilePreview = 0;
    Game.state.destructiblesRoot = 0;

    // backgroundMusicStarted не сбрасывается, поскольку музыка продолжает играть между уровнями

    // Удаляем старый layout из сцены
    if (Game.state.level && Game.state.level.__parent) {
        Game.state.level.__removeFromParent();
    }

    Game.state.level = 0;
};

/**
 * Создание и инициализация текущего уровня.
 */
Game.initLevel = function () {
    Game.unloadLevel(); // Очищаем предыдущий уровень перед созданием нового

    var currentLevelToken = Game.state.levelToken;

    // Добавляем layout на сцену и связываем его объекты с игровой логикой
    Game.state.level = scene
        .__addChildBox(Game.config.levelLayout)
        .__setAliasesData(Game.createLevelAliases());

    // Ждем создания трансформаций и физических тел
    _setTimeout(() => {
        // Callback не должен работать после выгрузки этого уровня
        if (currentLevelToken !== Game.state.levelToken || !Game.state.level) {
            return;
        }

        Game.state.level.update(1);
        Game.resetLauncherVisuals(); // Формируем исходную V-образную резинку
        Game.initPhysicsCollisionEvents(); // Общая подписка создается после физического мира
        Game.initDestructibles(); // Назначаем HP прямым детям destructibles
    }, 0.01);
};