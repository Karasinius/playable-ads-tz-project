// Разрушаемые блоки, осколки и условие победы.

/**
 * Создание одного физического ледяного осколка.
 */
Game.addBreakBlock = function (x, y, velocity, baseRotation) {
    var levelToken = Game.state.levelToken
        , breakBlock = Game.state.level.__addChildBox({
            __img: 'break_' + randomInt(1, 9), // Случайная текстура осколка
            __ofs: [x, y, -20], // Позиция осколка на переднем слое
            __rotate: (baseRotation || 0) + randomInt(-30, 30), // Поворот блока и случайный разброс от -30 до 30 градусов
            __physics: {
                __isStatic: false,
                __friction: 10,
                __frictionAir: 1,
                __frictionStatic: 50,
                __restitution: 0,
                __density: 1,
                __bodyType: 1
            }
        });

    looperPost(() => {
        // Callback старого уровня или еще не созданное физическое тело больше не обрабатываем
        if (levelToken !== Game.state.levelToken || !breakBlock.__ph_body) {
            return;
        }

        // Наследуем скорость разрушенного блока и добавляем случайный разброс
        ph_Body.setVelocity(breakBlock.__ph_body, new Vector2(
            velocity.x + randomFloat(-10, 10),
            velocity.y + randomFloat(-8, 3)
        ));

        _setTimeout(() => {
            if (levelToken !== Game.state.levelToken || !breakBlock.__ph_body) {
                return;
            }

            Game.initCollision(breakBlock.__ph_body, breakBlock, Game.config.breakBlockHp); // Осколок получает HP из конфига

            // Автоматическое удаление осколка через 5-10 секунд
            _setTimeout(() => {
                if (levelToken === Game.state.levelToken && !breakBlock.__destructed) {
                    Game.removeBlock(breakBlock);
                }
            }, randomFloat(5, 10));
        }, 1);
    });
};

/**
 * Создание сетки осколков с учетом поворота исходного блока.
 */
Game.createBreakBlocks = function (block, size, velocity) {
    var step = Game.config.fragmentStep, center = block.__worldPosition.__clone()
        , rotation = Game.getWorldRotationDegrees(block) 
        , angle = rotation * Math.PI / 180 // Перевод в радианы
        , cosAngle = Math.cos(angle)
        , sinAngle = Math.sin(angle)
        , x, y, cellWidth, cellHeight, localX, localY, rotatedX, rotatedY;

    // Разбиваем ширину блока на ячейки с шагом fragmentStep
    for (x = 0; x < size.x; x += step) {
        cellWidth = mmin(step, size.x - x); // Последняя ячейка может быть меньше полного шага
        localX = -size.x / 2 + x + cellWidth / 2; // Центр ячейки по X относительно центра блока

        // Разбиваем высоту блока на ячейки с тем же шагом
        for (y = 0; y < size.y; y += step) {
            cellHeight = mmin(step, size.y - y);
            localY = -size.y / 2 + y + cellHeight / 2; // В layout положительный Y направлен вниз

            // Поворачиваем локальную точку (с учетом системы координат с осью Y направленной вниз)
            rotatedX = localX * cosAngle + localY * sinAngle;
            rotatedY = -localX * sinAngle + localY * cosAngle;

            Game.addBreakBlock(center.x + rotatedX, center.y + rotatedY, velocity, rotation);
        }
    }
};

/**
 * Пробуждение оставшихся разрушаемых объектов и активных снарядов.
 */
Game.awakeBlocks = function () {
    $each(Game.state.blocks, block => {
        block.__ph_awake();
    });

    $each(Game.state.activeProjectiles, projectile => {
        if (projectile.__ph_body) {
            projectile.__ph_awake();
        }
    });
};

/**
 * Уничтожение основного блока или временного осколка.
 */
Game.removeBlock = function (block) {
    if (!Game.isNodeAlive(block)) {
        return;
    }

    var body = block.__ph_body
        , velocity = Game.getBodyVelocity(body)
        , needsBreaks = block.__needBreaks;

    removeFromArray(block, Game.state.blocks); // Удаляем объект из коллекции отслеживаемых блоков

    body.__onCollision = 0; // Отключаем дальнейшую обработку столкновений

    if (needsBreaks) {
        Game.createBreakBlocks(block, block.__size, velocity); // Создание осколков
    }   

    block.__removeFromParent(); // Удаляем Node и его физическое тело
    Game.looperPostOne(Game.awakeBlocks); // Пробуждаем объекты после удаления опоры

    // Логика уничтожения основной цели
    if (needsBreaks) {
        playSound('break_' + randomInt(1, 4), 0, 0, 0.5);
        Game.state.destructibleCount = mmax(0, Game.state.destructibleCount - 1);

        if (!Game.state.destructibleCount) {
            Game.completeLevel();
        }
    }
    // Логика удаления временного осколка
    else if (random() > 0.5 && !windowManager.__hasOpenedWindow()) {
        playSound('break_' + randomInt(1, 4), 0, 0, 0.5);
    }
};

/**
 * Получение имени Node для поиска его параметров в конфигурации уровня.
 */
Game.getDestructibleName = function (node) {
    return node && (node.__name || node.name);
};

/**
 * Получение индивидуального HP объекта из конфигурации текущего уровня.
 */
Game.getDestructibleHp = function (node) {
    var levelConfig = Game.getCurrentLevelConfig()
        , hpConfig = levelConfig && levelConfig.destructibleHp
        , nodeName = Game.getDestructibleName(node)
        , hp = nodeName && hpConfig
            ? hpConfig[nodeName]
            : 0;

    // Если имя объекта отсутствует в конфигурации, используем стандартное HP
    if (hp <= 0) {
        hp = Game.config.defaultDestructibleHp;
    }

    return hp;
};

/**
 * Добавление индивидуального HP прямым детям контейнера destructibles.
 */
Game.initDestructibles = function () {
    var root = Game.state.destructiblesRoot
        , levelConfig = Game.getCurrentLevelConfig();

    Game.state.destructibleCount = 0; // Сбрасываем счетчик перед инициализацией уровня

    if (!root) {
        return;
    }

    if (!levelConfig) {
        return;
    }

    root.__eachChild(node => {
        var body = node.__ph_body
            , nodeName = Game.getDestructibleName(node)
            , hp;

        // Статические объекты и Node без физического тела не являются целями
        if (!body || body.isStatic) {
            return;
        }

        hp = Game.getDestructibleHp(node); // Получаем HP по имени объекта и текущему уровню

        node.__needBreaks = 1; // Помечаем объект как основную разрушаемую цель
        Game.state.destructibleCount++;

        Game.initCollision(body, node, hp);

    });

};