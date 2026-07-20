// Стартовый экран, расчет звезд и окно победы.

/**
 * Расчет количества звезд по числу использованных бросков.
 */
Game.getEarnedStars = function (shotsUsed) {
    var levelConfig = Game.getCurrentLevelConfig();

    if (shotsUsed <= levelConfig.threeStarsMax) {
        return 3;
    }

    if (shotsUsed <= levelConfig.twoStarsMax) {
        return 2;
    }

    return 1;
};

/**
 * Начало игры после закрытия стартового экрана.
 */
Game.startGame = function (startWindow) {
    if (Game.state.gameStarted) {
        return;
    }

    Game.state.gameStarted = true;
    Game.startBackgroundMusic();

    startWindow.__close();

    //Game.log('[Game] Game started');
};

/**
 * Показ стартового экрана.
 */
Game.showStartScreen = function () {
    showWindow('start', startWindow => {
        var startHandler = () => {
            Game.startGame(startWindow);
        };

        // Нажатие на любую область окна начинает игру
        startWindow.__onTap = startHandler;

        startWindow.__setAliasesData({
            startText: {
                __onTap() {
                    startHandler();
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

    Game.state.levelCompleted = true; // Блокируем новые броски
    Game.state.earnedStars = Game.getEarnedStars(Game.state.shotsUsed);

    Game.clearActiveProjectiles();
    Game.resetLauncherVisuals();

    _setTimeout(() => {
        Game.showWin();
    }, 1);
};


/**
 * Показ окна победы.
 */
Game.showWin = function () {
    var earnedStars = Game.state.earnedStars
        , hasNextLevel = Game.hasNextLevel();

    playSound('win');

    showWindow('win', winWindow => {
        winWindow.__setAliasesData({
            // Выбираем русскую или английскую картинку Victory
            victoryFrame(node) {
                node.__img = Game.getVictoryImageName();
            },

            // Одна звезда всегда располагается в центре
            starCenter(node) {
                node.__alpha = earnedStars >= 1 ? 1 : 0;
            },

            // Вторая звезда располагается слева
            starLeft(node) {
                node.__alpha = earnedStars >= 2 ? 1 : 0;
            },

            // Третья звезда располагается справа
            starRight(node) {
                node.__alpha = earnedStars >= 3 ? 1 : 0;
            },

            // Динамически локализуем количество использованных снежков
            shotsUsedText(node) {
                node.__text.__text = TR('shots_used') + ' ' + Game.state.shotsUsed;
            },

            // Перезапуск текущего уровня
            retryButton: {
                __onTap() {
                    winWindow.__close();
                    Game.restartCurrentLevel();
                },
                __onTapHighlight: 1
            },

            // Кнопка следующего уровня скрыта, пока следующего уровня нет
            nextLevelButton(node) {
                if (!hasNextLevel) {
                    node.__alpha = 0;
                    node.__onTap = 0;
                    return;
                }

                node.__alpha = 1;
                node.__onTapHighlight = 1;

                node.__onTap = () => {
                    winWindow.__close();
                    Game.loadNextLevel();
                };
            }
        });
    });
};