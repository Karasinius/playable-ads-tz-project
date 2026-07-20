// Загрузка, перезапуск, переход и выгрузка уровней.

/**
 * Получение конфигурации текущего уровня.
 */
Game.getCurrentLevelConfig = function () {
    return Game.config.levels[Game.state.currentLevelIndex];
};

/**
 * Проверка наличия следующего доступного уровня.
 */
Game.hasNextLevel = function () {
    var nextLevel = Game.config.levels[Game.state.currentLevelIndex + 1];

    return !!(nextLevel && nextLevel.enabled);
};

/**
 * Перезапуск текущего уровня.
 */
Game.restartCurrentLevel = function () {
    if (Game.state.levelTransitionInProgress) {
        return;
    }

    Game.state.levelTransitionInProgress = true;

    _setTimeout(() => {
        Game.initLevel();
    }, 0.01);
};

/**
 * Переход к следующему уровню.
 */
Game.loadNextLevel = function () {
    if (!Game.hasNextLevel() || Game.state.levelTransitionInProgress) {
        return;
    }

    Game.state.levelTransitionInProgress = true;
    Game.state.currentLevelIndex++;

    _setTimeout(() => {
        Game.initLevel();
    }, 0.01);
};

/**
 * Удаление уровня и полный сброс его локального состояния.
 */
Game.unloadLevel = function () {
    var i, block, body;

    Game.state.levelToken++; // Старые callback-и получают неактуальный token
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
    Game.state.earnedStars = 0;
    Game.state.levelCompleted = false;

    Game.state.leftRubberVisual = 0;
    Game.state.rightRubberVisual = 0;
    Game.state.rubberPouchVisual = 0;
    Game.state.projectilePreview = 0;
    Game.state.destructiblesRoot = 0;

    // gameStarted не сбрасывается, поэтому стартовое окно показывается только один раз
    // backgroundMusicStarted также не сбрасывается между уровнями

    if (Game.state.level && Game.state.level.__parent) {
        Game.state.level.__removeFromParent();
    }

    Game.state.level = 0;
};

/**
 * Создание и инициализация текущего уровня.
 */
Game.initLevel = function () {
    var levelConfig;

    Game.unloadLevel();

    levelConfig = Game.getCurrentLevelConfig();

    if (!levelConfig || !levelConfig.enabled) {
        //Game.log('[Game] Current level is unavailable:', Game.state.currentLevelIndex);
        Game.state.levelTransitionInProgress = false;
        return;
    }

    var currentLevelToken = Game.state.levelToken;

    // Добавляем layout уровня и связываем его объекты с игровой логикой
    Game.state.level = scene
        .__addChildBox(levelConfig.layout)
        .__setAliasesData(Game.createLevelAliases());

    // Ждем создания трансформаций и физических тел
    _setTimeout(() => {
        if (currentLevelToken !== Game.state.levelToken || !Game.state.level) {
            return;
        }

        Game.state.level.update(1);
        Game.resetLauncherVisuals();
        Game.initPhysicsCollisionEvents();
        Game.initDestructibles();

        Game.state.levelTransitionInProgress = false;

        // Стартовый экран показывается только перед первым запуском игры
        if (!Game.state.gameStarted) {
            Game.showStartScreen();
        }
    }, 0.01);
};