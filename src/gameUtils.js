// Общие вспомогательные функции.

/**
 * Вывод сообщения в консоль браузера.
 */
Game.log = function () {
    console.log.apply(console, arguments);
};

/**
 * Проверка существования Node и его нахождения в иерархии.
 */
Game.isNodeAlive = function (node) {
    return !!(node && !node.__destructed && node.__parent);
};

/**
 * Планирование не более одной операции с возможной задержкой.
 */
Game.looperPostOne = function (callback, delay) {
    if (callback.__posted > 0) {
        callback.__posted = _clearTimeout(callback.__posted);
    }

    if (!callback.__posted) {
        // Планирование с задержкой
        if (delay) {
            callback.__posted = _setTimeout(() => {
                callback.__posted = 0;
                callback();
            }, delay);
        }
        // Планирование без задержки
        else {
            callback.__posted = -1;
            looperPost(() => {
                callback.__posted = 0;
                callback();
            });
        }
    }
};

/**
 * Получение суммарного поворота Node относительно корня уровня.
 */
Game.getWorldRotationDegrees = function (node) {
    var rotation = 0
        , current = node;

    // Поднимаемся от объекта к корню уровня и складываем локальные повороты
    while (current && current !== Game.state.level) {
        rotation += current.__rotate || 0;
        current = current.__parent;
    }

    return rotation;
};