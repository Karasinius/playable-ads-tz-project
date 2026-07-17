// прототип геймплея


options.__soundDisabled = 0; // Включение звуков

var level // Корневой Node текущего Layout
    , rubber // Ссылка на Node резинки
    , blocks = [] // Все разрушаемые физические объекты
    , destructibleCount = 0; // Количество оставшихся целей для уничтожения

/**
 * Планирование не более одной операции с возможной задержкой.
 */
function looperPostOne(f, delay) {
    if (f.__posted > 0) {
        f.__posted = _clearTimeout(f.__posted);
    }

    if (!f.__posted) {
        // Планирование с задержкой
        if (delay) {
            f.__posted = _setTimeout(() => {
                f.__posted = 0;
                f();
            }, delay);
        } 
        // Планирование без задержки
        else {
            f.__posted = -1;
            looperPost(() => {
                f.__posted = 0;
                f();
            });
        };
    }
}


/**
 * Расчет относительной скорости двух физических тел.
 */
function relImpactSpeed(bodyA, bodyB) {
    var va = bodyA.velocity, vb = bodyB.velocity
        , v = new Vector2(va.x - vb.x, va.y - vb.y);  
    return v.__length();  // Длина вектора относительной скорости
}

/**
 * Создание одного ледяного осколка.
 */
function addBreakBlock(x, y, velocity){
    var breakBlock = level.__addChildBox({  // Добавление осколка в корень level
        __img: 'break_' + randomInt(1, 9),  // Случайная текстура
        __ofs: [x, y, -20],                 // Передний слой
        __rotate: randomInt(0, 360),        // Случайное вращение
        __physics: {                        // Физические параметры
            __isStatic: false,
            __friction: 10,
            __frictionAir: 1,
            __frictionStatic: 50,
            __restitution: 0,
            __density: 1,
            __bodyType: 1
        }
    });
    looperPost(a => {
        if (breakBlock.__ph_body){ 
            // Наследование скорости и случайный разброс
            ph_Body.setVelocity(breakBlock.__ph_body, new Vector2(velocity.x + randomFloat(-10, 10),velocity.y + randomFloat(-8, 3)));
            _setTimeout(() => {
                if (breakBlock.__ph_body) {
                    // Назначение коллизии и здоровья
                    initCollision(breakBlock.__ph_body, breakBlock, 50);
                    // Удаление блока через 5-10 секунд
                    _setTimeout(() => {
                        if (!breakBlock.__destructed) {
                            removeBlock(breakBlock);
                        }
                    }, randomFloat(5, 10));
                }
            }, 1);
        }
    });
}

/**
 * Пробуждение всех физических объектов из blocks.
 */
function awakeBlocks(){

    $each(blocks, b => {
        b.__ph_awake();
    });
}

/**
 * Функция уничтожения блока
 */
function removeBlock(block){
    removeFromArray(block, blocks); // Удаление блока их коллекции разрушаемых блоков
    var size = block.__size, v = block.__ph_body.velocity; // Получение данных до удаления

    block.__removeFromParent(); // Удаление объекта

    looperPostOne(awakeBlocks); // Пробуждение других блоков
    
    // Для основных разрушаемых объектов
    if (block.__needBreaks) {
        
        playSound('break_' + randomInt(1, 4), 0, 0, 0.5); // Случайный звук
        
        var step = 50, // Шаг для сетки осколков
            bx = block.__x - size.x/2, 
            by = block.__y - size.y/2;  // Стартовая позиция для цикла

        // todo: не учитывается вращение блока
        // Создание осколков каждые 50 на 50
        for (var x = 0; x < size.x; x += step) {
            for (var y = 0; y < size.y; y += step) {
                addBreakBlock(bx + x, by + y, v);
            }
        }

        // Изменение счетчика основных разрушенных объектов и проверка победы
        destructibleCount--; 
        if (destructibleCount == 0) {
            _setTimeout(() => {
                show_win();
            }, 1);
        }
    } 
    // Для осколков
    else {
        if (random() > 0.5 && !windowManager.__hasOpenedWindow()) {    
            playSound('break_' + randomInt(1, 4), 0, 0, 0.5); // Случайный звук
        }
    }

}

/**
 * Функция добавления коллизии и здоровья объекту
 */
function initCollision(body, node, hp){
    blocks.push(node); // Регистрация как разрушаемый блок
    body.__hp = hp; // Присвоение здоровья

    // Callback столкновения
    body.__onCollision = (speed) => {
        // Нелинейный расчет урона
        var dmg = floor(clamp((speed - 1) * (speed - 2), 0, 100));

        if (dmg && body.__hp) {
            // consoleLog('damage', dmg);
            body.__hp = mmax(0, body.__hp - dmg); // Чтобы здоровье не было меньше 0
            // Обработка "смерти" объекта
            if (!body.__hp) {
                body.__onCollision = 0; // Выключение callback-а
                looperPost(a => {
                    removeBlock(node); // удаление блока
                });
            }
        }
    }
}

/**
 * Функция показа экрана победы
 */
function show_win() {

    playSound('win'); // Проигрывание звука победы

    // todo: посчитать очки игрока и выдать звезды
    showWindow('win', wnd => {      
        wnd.__setAliasesData({

            // Логика кнопки (объект button)
            button: {
                __onTap(){
                    // todo: стартовать другой уровень?
                    consoleLog("not implemented")
                },
                __onTapHighlight: 1
            }

        })
    })

}

/**
 * Инициализации уровня
 */
function initLevel(){

    // Добавляем первый уровень на сцену
    level = scene
        .__addChildBox('level_1')
        .__setAliasesData({

            // Присвоение переменной rubber объекта rubber
            rubber(node) {
                rubber = node;
            },

            // Логика зоны взаимодействия с рогаткой (объект userInputArea)
            userInputArea: {
                __dragDist: 1,

                // Логика натягивания
                __drag(x, y, dx, dy) {
                    // Мировая позиция userInputArea минус позиция курсора
                    // Вектор от курсора к центру рогатки
                    var dmouse = this.__dmouse = this.__worldPosition.__clone().sub(new Vector2(x, y)); 
                    rubber.__parent.__rotate = -dmouse.__angle() * RAD2DEG; // Поворот launcherPivot (родитель)
                    rubber.__width = dmouse.__length(); // Ширина резинки равна расстоянию от курсора до центра запуска
                },
                // Остановка всех анимаций резинки в начале броска
                __dragStart() {
                    rubber.__killAllAnimations();
                },
                // Логика окончания натягивания
                __dragEnd() {

                    playSound('punch'); // Проигрывание звука

                    // Отпускание резинки
                    // Анимация возврата к размеру 10
                    rubber.__anim({
                        __width: 10
                    }, 0.4, 0, easeElasticO);
                    // Позиция появления снаряда внутри userInputArea
                    var wp = this.__worldPosition  
                        , bullet = level.__addChildBox({ // Добавление снаряда в корень уровня
                            __effect: 'tail',            // Эффект хвоста
                            __img: 'circle1',            // Изображение снаряда
                            __size: [28, 28],            // Размеры снаряда
                            __ofs: [wp.x, wp.y, -20],    // Передний план
                            __physics: {                 // Логика физики
                                __isStatic: false,
                                __friction: 130,
                                __frictionAir: 0.2,
                                __frictionStatic: 500,
                                __restitution: 10,
                                __density: 4,
                                __bodyType: 1
                            }
                        }).update()
                        // Скорость по вектору от курсора к центру userInputArea
                        , velocity = this.__dmouse.__multiplyScalar(0.2); 

                    if (bullet.__ph_body) {
                        ph_Body.setVelocity(bullet.__ph_body, velocity);
                    }

                    // Удаление снаряда через 2 секунды
                    _setTimeout(() => {
                        bullet.__removeFromParent();
                    }, 2);

                }
            }
        });


    _setTimeout(a => {
        level.update(1);

        // Настраиваем коллизии для отработки повреждения блоков
        ph_Events.on(ph_Engine, 'collisionStart', (event) => {
            var pairs = event.pairs, i, pair, bodyA, bodyB, speed;
            // Для каждой пары если у тела есть callback коллизии, то он вызывается
            for (i = 0; i < pairs.length; i++) {
                pair = pairs[i];
                bodyA = pair.bodyA;
                bodyB = pair.bodyB;
                speed = relImpactSpeed(bodyA, bodyB);

                if (bodyA && bodyA.__onCollision) bodyA.__onCollision(speed);
                if (bodyB && bodyB.__onCollision) bodyB.__onCollision(speed);
            }
        });

        // Проход по уровню и инициализация блоков
        level.__traverse(node => {
            var body = node.__ph_body;
            if (body && !body.isStatic) { 
                node.__needBreaks = 1;          // Пометка как основной разрушаемый объект
                destructibleCount++;            // Увеличение счетчика основных блоков
                initCollision(body, node, 100); // Инициализация коллизии
            }
        });

    }, 0.01);
}

// Запуск инициализации после загрузки
BUS.__addEventListener(       
    __ON_GAME_LOADED, a => {
        initLevel();
        return 1;
    }
);
