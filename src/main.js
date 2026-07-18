// Точка входа игровой логики.

// Запуск инициализации уровня после загрузки всех ресурсов
BUS.__addEventListener(__ON_GAME_LOADED, () => {
    Game.initLevel();
    return 1;
});