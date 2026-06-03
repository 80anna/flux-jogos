class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.money = Config.STARTING_MONEY;
        this.lives = Config.STARTING_LIVES;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.isVictory = false;
        
        this.speedMultiplier = 1.0;
        
        this.lastTime = performance.now();
        
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Track mouse scaled properly if CSS scales canvas
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });
        
        // Music setup
        this.audio = new Audio('assets/fluxTowerDefense/musica.mp3');
        this.audio.loop = true;
        this.audioStarted = false;
        this.musicMuted = false;
        
        // Music start will be handled in startGame now, no need for the window click listener.
        
        this.init();
    }
    
    startGame() {
        if (!this.audioStarted && !this.musicMuted) {
            this.audio.play().catch(e => console.log('Audio autoplay blocked', e));
            this.audioStarted = true;
        }
        this.isGameStarted = true;
        this.lastTime = performance.now();
    }
    
    victory() {
        this.isVictory = true;
        this.uiManager.showVictory();
    }
    
    continueInfinite() {
        this.isVictory = false;
        this.lastTime = performance.now();
    }
    
    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        if (this.musicMuted) {
            this.audio.pause();
        } else {
            this.audio.play().catch(e => console.log(e));
        }
        return this.musicMuted;
    }

    setSpeed(mult) {
        this.speedMultiplier = mult;
    }
    
    init() {
        this.mapManager = new MapManager(this);
        this.enemyManager = new EnemyManager(this);
        this.towerManager = new TowerManager(this);
        this.waveManager = new WaveManager(this);
        this.uiManager = new UIManager(this);
        
        this.uiManager.updateMoney(this.money);
        this.uiManager.updateLives(this.lives);
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    addMoney(amount) {
        this.money += amount;
        this.uiManager.updateMoney(this.money);
    }
    
    useMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            this.uiManager.updateMoney(this.money);
            return true;
        }
        return false;
    }
    
    loseLife() {
        this.lives--;
        this.uiManager.updateLives(this.lives);
        if (this.lives <= 0) {
            this.isGameOver = true;
            this.uiManager.showGameOver();
        }
    }
    
    loop(currentTime) {
        if (this.isGameOver) return;
        
        if (!this.isGameStarted || this.isVictory) {
            this.draw(); // keep drawing background
            requestAnimationFrame((t) => this.loop(t));
            return;
        }
        
        const realDelta = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        const deltaTime = Math.min(realDelta, 100) * this.speedMultiplier;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    update(deltaTime) {
        this.waveManager.update(deltaTime);
        this.enemyManager.update(deltaTime);
        this.towerManager.update(deltaTime);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.mapManager.draw(this.ctx);
        this.enemyManager.draw(this.ctx);
        this.towerManager.draw(this.ctx);
        
        this.uiManager.drawDragPreview(this.ctx, this.mouseX, this.mouseY);
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});
