// Геометрия, направление запуска и анимации резинок рогатки.

/**
 * Расчет положения, длины и поворота одной резинки.
 */
Game.getRubberVisualData = function (anchorPoint, pouchPoint) {
    var dx = pouchPoint.x - anchorPoint.x
        , dy = pouchPoint.y - anchorPoint.y
        , length = Math.sqrt(dx * dx + dy * dy);

    return {
        x: (anchorPoint.x + pouchPoint.x) / 2, // Центр прямоугольника между креплением и стыком
        y: (anchorPoint.y + pouchPoint.y) / 2,
        width: length, // Длина резинки равна расстоянию между двумя точками
        rotation: -Math.atan2(dy, dx) * RAD2DEG // Минус нужен из-за направления оси Y вниз
    };
};

/**
 * Получение эквивалентного целевого угла, ближайшего к текущему углу.
 *
 * У углов есть эквиваленты: -155° = 205°.
 *
 * Если текущий угол 170°, а исходный угол -145°,
 * то обычная разница будет -315°.
 *
 * Эквивалент -145° это 215°, и тогда разница составляет 45°.
 * 
 * Это используется при возврате резинок в исходное положение, чтобы в правильную сторону прокрутились
 */
Game.getNearestRotation = function (currentRotation, targetRotation) {
    var rotation = targetRotation;

    // Убираем разницу больше половины полного оборота
    while (rotation - currentRotation > 180) {
        rotation -= 360;
    }

    while (rotation - currentRotation < -180) {
        rotation += 360;
    }

    return rotation;
};

/**
 * Мгновенное изменение положения, длины и поворота одной резинки.
 */
Game.updateRubberVisual = function (rubberVisual, anchorPoint, pouchPoint) {
    if (!rubberVisual) {
        return;
    }

    var data = Game.getRubberVisualData(anchorPoint, pouchPoint)
        , currentRotation = rubberVisual.__rotate || 0
        , nearestRotation = Game.getNearestRotation(currentRotation, data.rotation);

    rubberVisual.__x = data.x;
    rubberVisual.__y = data.y;
    rubberVisual.__width = data.width;
    rubberVisual.__rotate = nearestRotation; // Не допускаем скачка через границу -180 и 180 градусов
};

/**
 * Плавное перемещение одной резинки к заданной точке.
 */
Game.animateRubberVisual = function (rubberVisual, anchorPoint, pouchPoint) {
    if (!rubberVisual) {
        return;
    }

    var data = Game.getRubberVisualData(anchorPoint, pouchPoint)
        , currentRotation = rubberVisual.__rotate || 0
        , nearestRotation = Game.getNearestRotation(currentRotation, data.rotation);

    rubberVisual.__killAllAnimations();

    // Целевой угол выбирается рядом с текущим, поэтому резинка вращается по кратчайшему пути
    rubberVisual.__anim({
        __x: data.x,
        __y: data.y,
        __width: data.width,
        __rotate: nearestRotation
    }, Game.config.launcherReturnDuration, 0);
};

/**
 * Расчет направления запуска как среднего между направлениями двух резинок.
 */
Game.getAverageRubberLaunchVector = function (pouchPoint) {
    var leftAnchor = Game.config.leftRubberAnchor
        , rightAnchor = Game.config.rightRubberAnchor
        , restPoint = Game.config.rubberRestPoint

        // Направления от натянутого стыка к левому и правому рожку рогатки
        , leftDirection = new Vector2(leftAnchor.x - pouchPoint.x, leftAnchor.y - pouchPoint.y)
        , rightDirection = new Vector2(rightAnchor.x - pouchPoint.x, rightAnchor.y - pouchPoint.y)

        , leftLength = leftDirection.__length()
        , rightLength = rightDirection.__length()

        // Расстояние от натянутого положения до исходной точки стыка
        , pullVector = new Vector2(restPoint.x - pouchPoint.x, restPoint.y - pouchPoint.y)
        , pullDistance = pullVector.__length()

        , averageDirection
        , averageLength;

    // Преобразуем направления в единичные векторы, чтобы одна длинная резинка не имела больший вес
    if (leftLength > 0.001) {
        leftDirection.__multiplyScalar(1 / leftLength);
    }

    if (rightLength > 0.001) {
        rightDirection.__multiplyScalar(1 / rightLength);
    }

    // Складываем два единичных направления
    averageDirection = new Vector2(leftDirection.x + rightDirection.x, leftDirection.y + rightDirection.y);

    averageLength = averageDirection.__length();

    // Если направления почти полностью компенсировали друг друга, используем направление к точке покоя
    if (averageLength <= 0.001) {
        return pullVector;
    }

    // Нормализуем среднее направление и задаем ему длину, равную силе натяжения
    averageDirection.__multiplyScalar(1 / averageLength);
    averageDirection.__multiplyScalar(pullDistance);

    return averageDirection;
};

/**
 * Остановка текущих анимаций частей рогатки.
 */
Game.stopLauncherVisualAnimations = function () {
    if (Game.state.leftRubberVisual) {
        Game.state.leftRubberVisual.__killAllAnimations();
    }

    if (Game.state.rightRubberVisual) {
        Game.state.rightRubberVisual.__killAllAnimations();
    }

    if (Game.state.rubberPouchVisual) {
        Game.state.rubberPouchVisual.__killAllAnimations();
    }
};

/**
 * Обновление двух резинок, стыка и изображения снежка.
 */
Game.updateLauncherVisuals = function (pouchX, pouchY, showProjectile) {
    var pouchPoint = new Vector2(pouchX, pouchY);

    Game.updateRubberVisual(Game.state.leftRubberVisual, Game.config.leftRubberAnchor, pouchPoint);

    Game.updateRubberVisual(Game.state.rightRubberVisual, Game.config.rightRubberAnchor, pouchPoint);

    // Коричневый круг всегда находится в точке соединения двух резинок
    if (Game.state.rubberPouchVisual) {
        Game.state.rubberPouchVisual.__x = pouchX;
        Game.state.rubberPouchVisual.__y = pouchY;
    }

    // Снежок находится поверх стыка только во время натягивания
    if (Game.state.projectilePreview) {
        Game.state.projectilePreview.__x = pouchX;
        Game.state.projectilePreview.__y = pouchY;
        Game.state.projectilePreview.__alpha = showProjectile ? 1 : 0;
    }
};

/**
 * Мгновенный возврат рогатки в исходное состояние.
 */
Game.resetLauncherVisuals = function () {
    var restPoint = Game.config.rubberRestPoint;

    Game.stopLauncherVisualAnimations();

    Game.updateLauncherVisuals(restPoint.x, restPoint.y, false);
};

/**
 * Плавный возврат резинок и стыка в исходное состояние.
 */
Game.animateLauncherReturn = function () {
    var restPoint = Game.config.rubberRestPoint;

    Game.animateRubberVisual(Game.state.leftRubberVisual, Game.config.leftRubberAnchor, restPoint);

    Game.animateRubberVisual(Game.state.rightRubberVisual, Game.config.rightRubberAnchor, restPoint);

    // Стык плавно возвращается вместе с резинками
    if (Game.state.rubberPouchVisual) {
        Game.state.rubberPouchVisual.__killAllAnimations();
        Game.state.rubberPouchVisual.__anim({
            __x: restPoint.x,
            __y: restPoint.y
        }, Game.config.launcherReturnDuration, 0);
    }

    // Превью снежка после запуска скрывается сразу
    if (Game.state.projectilePreview) {
        Game.state.projectilePreview.__alpha = 0;
        Game.state.projectilePreview.__x = restPoint.x;
        Game.state.projectilePreview.__y = restPoint.y;
    }
};