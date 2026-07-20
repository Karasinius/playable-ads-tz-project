// Привязка объектов текущего layout к игровой логике.

/**
 * Создание aliases и обработчиков объектов текущего уровня.
 */
Game.createLevelAliases = function () {
    return {
        // Сохраняем ссылки на две резинки
        leftRubberVisual(node) {
            Game.state.leftRubberVisual = node;
        },

        rightRubberVisual(node) {
            Game.state.rightRubberVisual = node;
        },

        // Сохраняем ссылку на стык резинок
        rubberPouchVisual(node) {
            Game.state.rubberPouchVisual = node;
        },

        // Сохраняем ссылку на изображение снежка при натягивании
        projectilePreview(node) {
            Game.state.projectilePreview = node;
        },

        // Сохраняем ссылку на контейнер основных целей
        destructibles(node) {
            Game.state.destructiblesRoot = node;
        },

        // Кнопка перезапуска текущего уровня
        reloadButton: {
            __onTap() {
                if (!Game.state.gameStarted ||
                    Game.state.levelCompleted ||
                    Game.state.levelTransitionInProgress ||
                    windowManager.__hasOpenedWindow()
                ) {
                    return;
                }

                Game.restartCurrentLevel();
            },

            // Визуальное выделение кнопки при нажатии
            __onTapHighlight: 1
        },

        // Логика зоны взаимодействия с рогаткой
        userInputArea: {
            __dragDist: 1,

            // Натягивание резинок во время drag
            __drag(x, y, dx, dy) {
                if (!Game.state.gameStarted || Game.state.levelCompleted) {
                    return;
                }

                var restPoint = Game.config.rubberRestPoint
                    , restWorldPosition = new Vector2(
                        this.__worldPosition.x + restPoint.x,
                        this.__worldPosition.y + restPoint.y
                    ) // Мировая позиция исходной точки соединения резинок
                    , pullVector = restWorldPosition.sub(new Vector2(x, y)) // Вектор от указателя к точке покоя
                    , stretch = pullVector.__length()
                    , maxStretch = Game.config.maxRubberStretch
                    , pouchOffset;

                // Ограничиваем максимальное расстояние натяжения
                if (stretch > maxStretch) {
                    pullVector.__multiplyScalar(maxStretch / stretch);
                    stretch = maxStretch;
                }

                // Положение натянутого стыка относительно центра userInputArea
                pouchOffset = new Vector2(restPoint.x - pullVector.x, restPoint.y - pullVector.y);

                this.__pouchOffset = pouchOffset; // Сохраняем место создания физического снежка
                this.__launchVector = Game.getAverageRubberLaunchVector(pouchOffset); // Вычисляем направление из двух резинок

                // Растягиваем две резинки к ограниченному положению указателя
                Game.updateLauncherVisuals(pouchOffset.x, pouchOffset.y, true);
            },

            // Остановка анимации возврата резинок в начале нового drag
            __dragStart() {
                if (!Game.state.gameStarted || Game.state.levelCompleted) {
                    return;
                }

                Game.stopLauncherVisualAnimations();

                // Старые данные броска не должны использоваться в новом drag
                this.__pouchOffset = 0;
                this.__launchVector = 0;
            },

            // Запуск снежка после отпускания указателя
            __dragEnd() {
                if (!Game.state.gameStarted || Game.state.levelCompleted) {
                    return;
                }

                // Обычный клик не должен вызывать dragEnd
                if (!this.__launchVector) {
                    Game.animateLauncherReturn();
                    return;
                }

                playSound('punch');

                Game.launchProjectile(this);
                Game.animateLauncherReturn(); // Плавно возвращаем резинки по кратчайшему угловому пути
            }
        }
    };
};