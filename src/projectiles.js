// Создание, запуск и удаление снежков.

/**
 * Удаление одного снежка и его таймера.
 */
Game.removeProjectile = function (projectile) {
    removeFromArray(projectile, Game.state.activeProjectiles); // Удаляем снежок из списка активных

    if (projectile.__lifetimeTimer) {
        projectile.__lifetimeTimer = _clearTimeout(projectile.__lifetimeTimer); // Отменяем ожидающий таймер
    }

    if (Game.isNodeAlive(projectile)) {
        projectile.__removeFromParent(); // Удаляем Node и его физическое тело
    }
};

/**
 * Удаление всех активных снежков.
 */
Game.clearActiveProjectiles = function () {
    var lastProjectile;

    while (Game.state.activeProjectiles.length) {
        lastProjectile = Game.state.activeProjectiles[Game.state.activeProjectiles.length - 1];
        Game.removeProjectile(lastProjectile);
    }
};

/**
 * Регистрация снежка и назначение ему времени жизни.
 */
Game.trackProjectile = function (projectile) {
    Game.state.activeProjectiles.push(projectile);

    // По истечении projectileLifetime снежок будет удален
    projectile.__lifetimeTimer = _setTimeout(() => {
        Game.removeProjectile(projectile);
    }, Game.config.projectileLifetime);
};

/**
 * Создание и запуск снежка.
 */
Game.launchProjectile = function (inputArea) {
    var launchVector = inputArea.__launchVector
        , pouchOffset = inputArea.__pouchOffset;

    // Защита от вызова функции без рассчитанного направления запуска
    if (!launchVector) {
        return;
    }

    Game.state.shotsUsed++; // Увеличиваем количество использованных бросков
    //Game.log('[Game] Shots used:', Game.state.shotsUsed);

    var spawnPosition = inputArea.__worldPosition
        , projectile = Game.state.level.__addChildBox({
            __effect: 'tail', // Эффект хвоста
            __img: 'circle1', // Изображение снежка
            __size: [28, 28],
            // Создаем снаряд в натянутой точке между двумя резинками
            __ofs: [spawnPosition.x + pouchOffset.x, spawnPosition.y + pouchOffset.y, -20], 
            __physics: {
                __isStatic: false,
                __friction: 130,
                __frictionAir: 0.2,
                __frictionStatic: 500,
                __restitution: 10,
                __density: 4,
                __bodyType: 1
            }
        }).update()
        // Преобразуем среднее направление и натяжение в скорость
        , velocity = launchVector.__clone().__multiplyScalar(Game.config.projectileSpeedMultiplier); 

    if (projectile.__ph_body) {
        ph_Body.setVelocity(projectile.__ph_body, velocity);
    }

    Game.trackProjectile(projectile); // Запоминаем снежок и запускаем таймер удаления

    // Старые данные не должны использоваться при следующем броске
    inputArea.__launchVector = null;
    inputArea.__pouchOffset = null;
};