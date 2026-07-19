// Управление фоновой музыкой.

/**
 * Запуск фоновой музыки с уменьшенной громкостью.
 */
Game.startBackgroundMusic = function () {
    if (Game.state.backgroundMusicStarted) {
        return;
    }

    if (!getSound(Game.config.backgroundMusic)) {
        Game.log('[Game] Background music was not found:', Game.config.backgroundMusic);
        return;
    }

    playSound(Game.config.backgroundMusic, 1); // Второй аргумент включает повторное воспроизведение
    changeSoundVolume(Game.config.backgroundMusic, Game.config.backgroundMusicVolume); // Уменьшаем громкость только фоновой музыки
    Game.state.backgroundMusicStarted = true;

    Game.log('[Game] Background music started');
};

/**
 * Остановка фоновой музыки.
 */
Game.stopBackgroundMusic = function () {
    if (!Game.state.backgroundMusicStarted) {
        return;
    }

    stopSound(Game.config.backgroundMusic);
    Game.state.backgroundMusicStarted = false;
};