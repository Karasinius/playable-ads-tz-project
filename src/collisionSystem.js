// Общая обработка физических столкновений и урона.

/**
 * Расчет относительной скорости двух физических тел.
 */
Game.relImpactSpeed = function (bodyA, bodyB) {
    var velocityA = bodyA.velocity, velocityB = bodyB.velocity
        , relativeVelocity = new Vector2(velocityA.x - velocityB.x, velocityA.y - velocityB.y);

    return relativeVelocity.__length(); // Длина вектора относительной скорости
};

/**
 * Обработка события начала физических столкновений.
 */
Game.onPhysicsCollisionStart = function (event) {
    var pairs = event.pairs, i, pair, bodyA, bodyB, speed;

    // Для каждой пары вызываем пользовательский callback столкновения, если он существует
    for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        bodyA = pair.bodyA;
        bodyB = pair.bodyB;
        speed = Game.relImpactSpeed(bodyA, bodyB);

        if (bodyA && bodyA.__onCollision) bodyA.__onCollision(speed);
        if (bodyB && bodyB.__onCollision) bodyB.__onCollision(speed);
    }
};

/**
 * Регистрация общего обработчика столкновений один раз за запуск игры.
 */
Game.initPhysicsCollisionEvents = function () {
    if (Game.state.collisionEventsInitialized) {
        return;
    }

    // Физический движок создается после загрузки и обновления уровня
    if (!ph_Engine) {
        Game.log('[Game] ph_Engine is not ready');
        return;
    }

    Game.state.collisionEventsInitialized = true;
    ph_Events.on(ph_Engine, 'collisionStart', Game.onPhysicsCollisionStart);

    Game.log('[Game] Physics collision events initialized');
};

/**
 * Добавление физическому телу здоровья и callback-а получения урона.
 */
Game.initCollision = function (body, node, hp) {
    // Не добавляем один и тот же Node в массив повторно
    if (Game.state.blocks.indexOf(node) < 0) {
        Game.state.blocks.push(node);
    }

    body.__hp = hp; // Присваиваем здоровье физическому телу

    // Callback вызывается общим обработчиком Game.onPhysicsCollisionStart
    body.__onCollision = speed => {
        // Нелинейный расчет урона с ограничением от 0 до 100
        var damage = floor(clamp((speed - 1) * (speed - 2), 0, 100));

        if (!damage || !body.__hp) {
            return;
        }

        body.__hp = mmax(0, body.__hp - damage); // Здоровье не может стать меньше 0

        // Обработка уничтожения объекта
        if (!body.__hp) {
            body.__onCollision = 0; // Сразу отключаем callback от повторного вызова

            // Удаление блока
            looperPost(() => {
                Game.removeBlock(node);
            });
        }
    };
};