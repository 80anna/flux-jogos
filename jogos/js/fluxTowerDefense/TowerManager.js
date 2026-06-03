class Projectile {
    constructor(x, y, target, damage, speed, color, isSplash, splashRadius, isSlow, slowFactor, slowDuration, stunDuration, game, angle = null, maxDistance = 200) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.isSplash = isSplash;
        this.splashRadius = splashRadius;
        this.isSlow = isSlow;
        this.slowFactor = slowFactor;
        this.slowDuration = slowDuration;
        this.stunDuration = stunDuration;
        this.game = game;
        this.active = true;
        this.angle = angle;
        this.maxDistance = maxDistance;
        
        if (this.angle !== null) {
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }
    }

    update(deltaTime) {
        if (!this.active) return;
        
        const moveAmt = this.speed * (deltaTime / 16.66);

        if (this.angle !== null) {
            // Un-targeted projectile (e.g. Teclado)
            this.x += this.vx * (deltaTime / 16.66);
            this.y += this.vy * (deltaTime / 16.66);
            
            // Hit check against all enemies
            for (const enemy of this.game.enemyManager.enemies) {
                const edx = enemy.x - this.x;
                const edy = enemy.y - this.y;
                if (Math.hypot(edx, edy) <= 20) {
                    if (enemy.takeDamage(this.damage)) {
                        this.game.addMoney(enemy.typeInfo.reward);
                    }
                    this.active = false;
                    break; // destroy projectile
                }
            }
            
            // Range limit or out of bounds
            if (Math.hypot(this.x - this.startX, this.y - this.startY) > this.maxDistance || 
                this.x < 0 || this.x > Config.CANVAS_WIDTH || this.y < 0 || this.y > Config.CANVAS_HEIGHT) {
                this.active = false;
            }
            return;
        }

        if (!this.target || this.target.hp <= 0) {
            this.active = false; 
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < moveAmt) {
            // Hit
            if (this.isSplash) {
                // Monitor explosion effect
                this.game.towerManager.explosions.push({
                    x: this.target.x,
                    y: this.target.y,
                    radius: this.splashRadius,
                    duration: 300,
                    maxDuration: 300
                });
                
                for (const enemy of this.game.enemyManager.enemies) {
                    const edx = enemy.x - this.target.x;
                    const edy = enemy.y - this.target.y;
                    if (Math.hypot(edx, edy) <= this.splashRadius) {
                        if (enemy.takeDamage(this.damage)) {
                            this.game.addMoney(enemy.typeInfo.reward);
                        }
                    }
                }
            } else {
                if (this.target.takeDamage(this.damage)) {
                    this.game.addMoney(this.target.typeInfo.reward);
                }
            }

            if (this.isSlow) {
                this.target.applySlow(this.slowFactor, this.slowDuration);
            }
            if (this.stunDuration && this.stunDuration > 0) {
                this.target.applyStun(this.stunDuration);
            }

            this.active = false;
        } else {
            this.x += (dx / dist) * moveAmt;
            this.y += (dy / dist) * moveAmt;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Tower {
    constructor(gridX, gridY, typeInfo, game) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = gridX * Config.TILE_SIZE + Config.TILE_SIZE / 2;
        this.y = gridY * Config.TILE_SIZE + Config.TILE_SIZE / 2;
        this.typeInfo = typeInfo;
        this.game = game;
        
        this.level = 1;
        this.damage = typeInfo.damage;
        this.range = typeInfo.range;
        this.baseFireRate = typeInfo.fireRate;
        this.fireTimer = 0;
        this.target = null;
        this.stunTimer = 0; // if hacked
    }

    upgrade() {
        this.level++;
        this.damage = Math.floor(this.damage * 1.5);
        if (this.typeInfo.id === 'nobreak') {
            this.typeInfo.income = Math.floor(this.typeInfo.income * 1.5);
        }
    }
    
    getUpgradeCost() {
        return Math.floor(this.typeInfo.cost * 0.8 * this.level);
    }
    
    getSellValue() {
        return Math.floor(this.typeInfo.cost * 0.5 * this.level);
    }
    
    getActualFireRate() {
        if (this.typeInfo.id === 'nobreak' || this.typeInfo.id === 'firewall') {
            return this.baseFireRate;
        }
        let bestFirewallMod = 1.0;
        for (const t of this.game.towerManager.towers) {
            if (t.typeInfo.id === 'firewall') {
                const dist = Math.hypot(t.x - this.x, t.y - this.y);
                if (dist <= t.range) {
                    const buffPerc = 10 + (10 * t.level);
                    const mod = 1.0 - (buffPerc / 100);
                    if (mod < bestFirewallMod) bestFirewallMod = mod;
                }
            }
        }
        return this.baseFireRate * bestFirewallMod;
    }

    update(deltaTime) {
        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            return;
        }
        
        if (this.typeInfo.id === 'firewall') {
            return; // Passive
        }
        
        if (this.typeInfo.id === 'nobreak') {
            if (this.game.waveManager.waveActive) {
                this.fireTimer -= deltaTime;
                if (this.fireTimer <= 0) {
                    this.game.addMoney(this.typeInfo.income);
                    this.fireTimer = this.getActualFireRate();
                }
            }
            return;
        }
        
        // Find target
        if (!this.target || this.target.hp <= 0 || this.getDistance(this.target) > this.range) {
            this.target = this.findTarget();
        }

        // Roteador: Continuous Laser
        if (this.typeInfo.id === 'roteador') {
            if (this.target) {
                this.target.applySlow(this.typeInfo.slowFactor, 100);
                if (this.target.takeDamage((this.damage * deltaTime) / 1000)) {
                    this.game.addMoney(this.target.typeInfo.reward);
                    this.target = null;
                }
            }
            return;
        }
        
        this.fireTimer -= deltaTime;

        if (this.fireTimer <= 0) {
            if (this.typeInfo.id === 'teclado' || this.typeInfo.id === 'arcondicionado') {
                // AoE or Radial towers, fire regardless of target if enemies are near? 
                // Wait, only fire if there is a target to avoid spamming 
                if (this.target) {
                    this.fire();
                    this.fireTimer = this.getActualFireRate();
                }
            } else if (this.target) {
                this.fire();
                this.fireTimer = this.getActualFireRate();
            }
        }
    }

    findTarget() {
        let bestTarget = null;
        let bestDist = this.range;
        for (const enemy of this.game.enemyManager.enemies) {
            const dist = this.getDistance(enemy);
            if (dist <= bestDist) {
                bestDist = dist;
                bestTarget = enemy;
            }
        }
        return bestTarget;
    }

    getDistance(enemy) {
        return Math.hypot(enemy.x - this.x, enemy.y - this.y);
    }

    fire() {
        if (this.typeInfo.id === 'arcondicionado') {
            // AoE Aura Freeze
            this.game.towerManager.auras.push({
                x: this.x,
                y: this.y,
                radius: this.range,
                duration: 400,
                maxDuration: 400
            });
            for (const enemy of this.game.enemyManager.enemies) {
                if (this.getDistance(enemy) <= this.range) {
                    enemy.applyStun(this.typeInfo.stunDuration);
                    if (enemy.takeDamage(this.damage)) {
                        this.game.addMoney(enemy.typeInfo.reward);
                    }
                }
            }
            return;
        }

        if (this.typeInfo.id === 'teclado') {
            // Shoot 8 directions
            const projectileSpeed = 8;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i;
                this.game.towerManager.projectiles.push(new Projectile(
                    this.x, this.y, 
                    null, 
                    this.damage, 
                    projectileSpeed, 
                    this.typeInfo.color, 
                    false, 0,
                    false, 0, 0, 0,
                    this.game,
                    angle,
                    this.range
                ));
            }
            return;
        }

        const isSplash = this.typeInfo.isSplash || false;
        const splashRadius = this.typeInfo.splashRadius || 0;
        const projectileSpeed = 10;
        
        this.game.towerManager.projectiles.push(new Projectile(
            this.x, this.y, 
            this.target, 
            this.damage, 
            projectileSpeed, 
            Config.COLORS.projectile, 
            isSplash, splashRadius,
            false, 0, 0, 0,
            this.game
        ));
    }

    draw(ctx) {
        if (this.typeInfo.id === 'roteador' && this.target && this.stunTimer <= 0) {
            ctx.strokeStyle = '#0055ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }

        ctx.fillStyle = this.typeInfo.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Config.TILE_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.typeInfo.emoji, this.x, this.y);
        
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(`Lv${this.level}`, this.x, this.y + 20);
        
        if (this.stunTimer > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, Config.TILE_SIZE * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('❌', this.x, this.y);
        }
    }
}

class TowerManager {
    constructor(game) {
        this.game = game;
        this.towers = [];
        this.projectiles = [];
        this.explosions = [];
        this.auras = [];
        this.selectedTower = null; 
    }

    addTower(gridX, gridY, towerTypeStr) {
        const typeInfo = Config.TOWERS[towerTypeStr];
        if (typeInfo && this.game.money >= typeInfo.cost) {
            if (this.game.mapManager.canPlaceTower(gridX, gridY)) {
                this.game.useMoney(typeInfo.cost);
                const tower = new Tower(gridX, gridY, typeInfo, this.game);
                this.towers.push(tower);
                this.game.mapManager.grid[gridY][gridX].tower = tower;
                return true;
            }
        }
        return false;
    }

    sellTower(tower) {
        this.game.addMoney(tower.getSellValue());
        this.game.mapManager.grid[tower.gridY][tower.gridX].tower = null;
        const idx = this.towers.indexOf(tower);
        if (idx > -1) this.towers.splice(idx, 1);
        this.selectedTower = null;
    }

    getTowerAt(gridX, gridY) {
        if (gridX < 0 || gridX >= Config.COLS || gridY < 0 || gridY >= Config.ROWS) return null;
        return this.game.mapManager.grid[gridY][gridX].tower;
    }

    update(deltaTime) {
        for (const tower of this.towers) {
            tower.update(deltaTime);
        }
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);
            if (!p.active) {
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].duration -= deltaTime;
            if (this.explosions[i].duration <= 0) {
                this.explosions.splice(i, 1);
            }
        }

        for (let i = this.auras.length - 1; i >= 0; i--) {
            this.auras[i].duration -= deltaTime;
            if (this.auras[i].duration <= 0) {
                this.auras.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const a of this.auras) {
            const alpha = a.duration / a.maxDuration;
            ctx.fillStyle = `rgba(170, 221, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const tower of this.towers) {
            tower.draw(ctx);
        }
        for (const p of this.projectiles) {
            p.draw(ctx);
        }
        
        for (const exp of this.explosions) {
            const ratio = 1 - (exp.duration / exp.maxDuration);
            const currentRadius = exp.radius * ratio;
            const alpha = exp.duration / exp.maxDuration;
            
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, currentRadius * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.selectedTower) {
            ctx.strokeStyle = Config.COLORS.rangeValid;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.selectedTower.x, this.selectedTower.y, this.selectedTower.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = Config.COLORS.rangePreview;
            ctx.fill();
        }
    }
}
