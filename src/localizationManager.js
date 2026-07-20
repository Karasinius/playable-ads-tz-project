// Получение текущего языка и работа с локализованными UI-элементами.


/**
 * Получение изображения окна победы для текущего языка.
 */
Game.getVictoryImageName = function () {
    return getUserLanguage() === 'ru'
        ? 'victory_img_ru'
        : 'victory_img_eng';
};

/**
 * Сохранение выбранного языка и перезагрузка страницы.
 */
Game.setLanguage = function (language) {
    if (language !== 'en' && language !== 'ru') {
        Game.log('[Game] Unsupported language:', language);
        return;
    }

    setUserSavedLanguage(language);
    __window.location.reload();
};

/**
 * Экспорт функций смены языка в глобальный window для тестирования через Console.
 */
set(__window, 'setGameLanguage', language => {
    Game.setLanguage(language);
});

set(__window, 'getGameLanguage', () => {
    return getUserLanguage();
});