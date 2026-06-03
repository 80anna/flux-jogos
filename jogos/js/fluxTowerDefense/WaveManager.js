class WaveManager {
    constructor(game) {
        this.game = game;
        this.currentWave = 0;
        this.waveActive = false;
        this.autoplay = false;
        
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.timeBetweenSpawns = 1000;
        
        this.waveConfig = [
            { count: 10, type: 'junior', interval: 1500, hpMultiplier: 1.0 },
            { count: 15, type: 'junior', interval: 1200, hpMultiplier: 1.2 },
            { count: 8, type: 'estagiario', interval: 1500, hpMultiplier: 1.0 },
            { count: 5, type: 'pleno', interval: 2000, hpMultiplier: 1.0 },
            { count: 12, type: 'junior', interval: 800, hpMultiplier: 1.5 },
            { count: 5, type: 'hacker', interval: 2000, hpMultiplier: 1.0 },
            { count: 1, type: 'senior', interval: 1000, hpMultiplier: 1.0 },
            { count: 20, type: 'pleno', interval: 1000, hpMultiplier: 1.2 }
        ];
    }

    toggleAutoplay() {
        this.autoplay = !this.autoplay;
        return this.autoplay;
    }

    startNextWave() {
        if (this.waveActive) return;
        
        this.currentWave++;
        this.waveActive = true;
        this.game.uiManager.updateWave(this.currentWave);
        
        let config;
        if (this.currentWave <= this.waveConfig.length) {
            config = this.waveConfig[this.currentWave - 1];
        } else if (this.currentWave === 50) {
            config = {
                count: 1,
                type: 'boss',
                interval: 1000,
                hpMultiplier: 1.0
            };
        } else {
            config = {
                count: 10 + Math.floor(this.currentWave * 1.5),
                type: ['junior', 'pleno', 'senior', 'estagiario', 'hacker'][Math.floor(Math.random() * 5)],
                interval: Math.max(300, 1500 - this.currentWave * 40),
                hpMultiplier: 1 + (this.currentWave * 0.25)
            };
        }
        
        this.timeBetweenSpawns = config.interval;
        this.spawnQueue = Array(config.count).fill({
            type: config.type,
            hpMultiplier: config.hpMultiplier
        });
    }

    update(deltaTime) {
        if (!this.waveActive) {
            if (this.autoplay && this.game.enemyManager.enemies.length === 0) {
                this.spawnTimer -= deltaTime;
                if (this.spawnTimer <= -2000) {
                    this.startNextWave();
                }
            }
            return;
        }
        
        if (this.spawnQueue.length > 0) {
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0) {
                const spawnInfo = this.spawnQueue.shift();
                this.game.enemyManager.spawn(spawnInfo.type, spawnInfo.hpMultiplier);
                this.spawnTimer = this.timeBetweenSpawns;
            }
        } else if (this.game.enemyManager.enemies.length === 0) {
            this.waveActive = false;
            this.spawnTimer = 0; 
            this.game.addMoney(50 + this.currentWave * 10); 
            
            // Check for victory
            if (this.currentWave === 50) {
                this.game.victory();
            }
        }
    }
}
