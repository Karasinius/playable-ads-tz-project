// Привязка объектов текущего layout к игровой логике.

/**
 * Создание aliases и обработчиков объектов текущего уровня.
 */
Game.createLevelAliases = function () {
    return {
        // Сохраняем ссылку на Node резинки
        rubber(node) {
            Game.state.rubber = node;
        },

        // Сохраняем ссылку на контейнер основных целей
        destructibles(node) {
            Game.state.destructiblesRoot = node;
        },

        // Логика зоны взаимодействия с рогаткой
        userInputArea: {
            __dragDist: 1,

            // Натягивание резинки во время drag
            __drag(x, y, dx, dy) {
                if (Game.state.levelCompleted || !Game.state.rubber) {
                    return;
                }

                var dragVector = this.__worldPosition.__clone().sub(new Vector2(x, y)) // Вектор от курсора к центру рогатки
                    , stretch = dragVector.__length()
                    , maxStretch = Game.config.maxRubberStretch;

                // Масштабируем весь вектор, чтобы сохранить направление и ограничить его длину
                if (stretch > maxStretch) {
                    dragVector.__multiplyScalar(maxStretch / stretch);
                    stretch = maxStretch;
                }

                this.__dmouse = dragVector; // Сохраняем ограниченный вектор для последующего запуска снежка
                Game.state.rubber.__parent.__rotate = -dragVector.__angle() * RAD2DEG; // Поворачиваем launcherPivot
                Game.state.rubber.__width = stretch; // Изменяем длину резинки
            },

            // Остановка анимации возврата резинки в начале нового drag
            __dragStart() {
                if (!Game.state.levelCompleted && Game.state.rubber) {
                    Game.state.rubber.__killAllAnimations();
                }
            },

            // Запуск снежка после отпускания указателя
            __dragEnd() {
                if (Game.state.levelCompleted || !Game.state.rubber) {
                    return;
                }

                // Возвращаем резинку к исходной длине
                Game.state.rubber.__anim({
                    __width: 10
                }, 0.4, 0, easeElasticO);

                playSound('punch');
                Game.launchProjectile(this);
            }
        }
    };
};