class UIManager {
    constructor(game) {
        this.game = game;
        
        this.livesDisplay = document.getElementById('lives-display');
        this.moneyDisplay = document.getElementById('money-display');
        this.waveDisplay = document.getElementById('wave-display');
        
        this.btnNextWave = document.getElementById('btn-next-wave');
        this.btnAutoplay = document.getElementById('btn-autoplay');
        this.btnSpeed = document.getElementById('btn-speed');
        this.btnMusic = document.getElementById('btn-music');
        
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.btnRestart = document.getElementById('btn-restart');
        
        this.gameStartScreen = document.getElementById('game-start-screen');
        this.btnStartGame = document.getElementById('btn-start-game');
        
        this.gameVictoryScreen = document.getElementById('game-victory-screen');
        this.btnContinueInfinite = document.getElementById('btn-continue-infinite');
        
        this.shopItemsContainer = document.getElementById('shop-items');
        this.upgradeMenu = document.getElementById('tower-upgrade-menu');
        
        this.draggedTower = null;
        
        this.setupEventListeners();
        this.initShop();
    }
    
    initShop() {
        this.shopItemsContainer.innerHTML = '';
        for (const [key, tower] of Object.entries(Config.TOWERS)) {
            const el = document.createElement('div');
            el.className = 'shop-item';
            el.dataset.type = key;
            el.innerHTML = `
                <div class="shop-item-icon" style="color: ${tower.color}">${tower.emoji}</div>
                <div class="shop-item-name">${tower.name}</div>
                <div class="shop-item-cost">$ ${tower.cost}</div>
                <div class="shop-item-desc">${tower.desc}</div>
            `;
            
            el.addEventListener('mousedown', (e) => {
                if (this.game.money >= tower.cost) {
                    this.draggedTower = key;
                }
            });
            
            this.shopItemsContainer.appendChild(el);
        }
    }
    
    setupEventListeners() {
        this.btnNextWave.addEventListener('click', () => {
            this.game.waveManager.startNextWave();
        });
        
        this.btnAutoplay.addEventListener('click', () => {
            const isAuto = this.game.waveManager.toggleAutoplay();
            this.btnAutoplay.innerText = `Autoplay: ${isAuto ? 'ON' : 'OFF'}`;
            this.btnAutoplay.classList.toggle('active', isAuto);
        });
        
        let isFast = false;
        this.btnSpeed.addEventListener('click', () => {
            isFast = !isFast;
            this.game.setSpeed(isFast ? 2.0 : 1.0);
            this.btnSpeed.innerText = isFast ? 'Velocidade: 2x' : 'Velocidade: 1x';
            this.btnSpeed.classList.toggle('active', isFast);
        });

        this.btnMusic.addEventListener('click', () => {
            const muted = this.game.toggleMusic();
            this.btnMusic.innerText = muted ? 'Música: OFF' : 'Música: ON';
            this.btnMusic.classList.toggle('btn-danger', muted);
            this.btnMusic.classList.toggle('btn-secondary', !muted);
        });
        
        this.btnRestart.addEventListener('click', () => {
            location.reload();
        });
        
        this.btnStartGame.addEventListener('click', () => {
            this.gameStartScreen.classList.add('hidden');
            this.game.startGame();
        });
        
        this.btnContinueInfinite.addEventListener('click', () => {
            this.gameVictoryScreen.classList.add('hidden');
            this.game.continueInfinite();
        });
        
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('mouseup', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const gridX = Math.floor(x / Config.TILE_SIZE);
            const gridY = Math.floor(y / Config.TILE_SIZE);
            
            if (this.draggedTower) {
                this.game.towerManager.addTower(gridX, gridY, this.draggedTower);
                this.draggedTower = null;
                this.updateShop();
            } else {
                const tower = this.game.towerManager.getTowerAt(gridX, gridY);
                if (tower) {
                    this.showUpgradeMenu(tower, e.clientX, e.clientY);
                } else {
                    this.hideUpgradeMenu();
                }
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.draggedTower = null;
        });
        
        document.getElementById('btn-upgrade').addEventListener('click', () => {
            if (this.game.towerManager.selectedTower) {
                const cost = this.game.towerManager.selectedTower.getUpgradeCost();
                if (this.game.money >= cost) {
                    this.game.useMoney(cost);
                    this.game.towerManager.selectedTower.upgrade();
                    this.showUpgradeMenu(this.game.towerManager.selectedTower, parseInt(this.upgradeMenu.style.left) - 20, parseInt(this.upgradeMenu.style.top) + 20);
                }
            }
        });
        
        document.getElementById('btn-sell').addEventListener('click', () => {
            if (this.game.towerManager.selectedTower) {
                this.game.towerManager.sellTower(this.game.towerManager.selectedTower);
                this.hideUpgradeMenu();
            }
        });
    }
    
    updateLives(lives) {
        this.livesDisplay.innerText = lives;
    }
    
    updateMoney(money) {
        this.moneyDisplay.innerText = `$ ${money}`;
        this.updateShop();
    }
    
    updateWave(wave) {
        this.waveDisplay.innerText = wave;
    }
    
    updateShop() {
        const items = this.shopItemsContainer.querySelectorAll('.shop-item');
        items.forEach(item => {
            const type = item.dataset.type;
            const cost = Config.TOWERS[type].cost;
            if (this.game.money >= cost) {
                item.classList.remove('disabled');
            } else {
                item.classList.add('disabled');
            }
        });
        
        if (this.game.towerManager.selectedTower) {
            const cost = this.game.towerManager.selectedTower.getUpgradeCost();
            const btnUpgrade = document.getElementById('btn-upgrade');
            btnUpgrade.disabled = this.game.money < cost;
        }
    }
    
    showGameOver() {
        this.gameOverScreen.classList.remove('hidden');
    }
    
    showVictory() {
        this.gameVictoryScreen.classList.remove('hidden');
    }
    
    showUpgradeMenu(tower, clientX, clientY) {
        this.game.towerManager.selectedTower = tower;
        
        document.getElementById('upgrade-title').innerText = tower.typeInfo.name;
        document.getElementById('upgrade-level').innerText = tower.level;
        document.getElementById('upgrade-damage').innerText = tower.typeInfo.id === 'nobreak' ? '0' : tower.damage;
        
        let nextDmg = Math.floor(tower.damage * 1.5);
        if (tower.typeInfo.id === 'nobreak') {
            document.getElementById('upgrade-damage').innerText = `$${tower.typeInfo.income}/5s`;
            nextDmg = `$${Math.floor(tower.typeInfo.income * 1.5)}/5s`;
        } else if (tower.typeInfo.id === 'firewall') {
            const currentBuff = 10 + (10 * tower.level);
            const nextBuff = 10 + (10 * (tower.level + 1));
            document.getElementById('upgrade-damage').innerText = `+${currentBuff}% vel`;
            nextDmg = `+${nextBuff}% vel`; 
        }
        
        document.getElementById('upgrade-damage-next').innerText = nextDmg;
        
        const upgradeCost = tower.getUpgradeCost();
        document.getElementById('upgrade-cost').innerText = upgradeCost;
        document.getElementById('sell-value').innerText = tower.getSellValue();
        
        const btnUpgrade = document.getElementById('btn-upgrade');
        btnUpgrade.disabled = this.game.money < upgradeCost;
        
        this.upgradeMenu.style.left = `${clientX + 20}px`;
        this.upgradeMenu.style.top = `${clientY - 20}px`;
        this.upgradeMenu.classList.remove('hidden');
    }
    
    hideUpgradeMenu() {
        this.game.towerManager.selectedTower = null;
        this.upgradeMenu.classList.add('hidden');
    }
    
    drawDragPreview(ctx, mouseX, mouseY) {
        if (this.draggedTower) {
            const gridX = Math.floor(mouseX / Config.TILE_SIZE);
            const gridY = Math.floor(mouseY / Config.TILE_SIZE);
            
            const px = gridX * Config.TILE_SIZE;
            const py = gridY * Config.TILE_SIZE;
            const towerInfo = Config.TOWERS[this.draggedTower];
            
            ctx.strokeStyle = this.game.mapManager.canPlaceTower(gridX, gridY) ? Config.COLORS.rangeValid : Config.COLORS.rangeInvalid;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(px + Config.TILE_SIZE/2, py + Config.TILE_SIZE/2, towerInfo.range, 0, Math.PI*2);
            ctx.stroke();
            
            ctx.fillStyle = towerInfo.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(px + Config.TILE_SIZE/2, py + Config.TILE_SIZE/2, Config.TILE_SIZE*0.4, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
}
