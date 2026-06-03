class Enemy {
    constructor(typeInfo, path, startIndex = 0, startX = null, startY = null) {
        this.typeInfo = typeInfo;
        this.hp = typeInfo.hp;
        this.maxHp = typeInfo.hp;
        this.speed = typeInfo.speed;
        this.path = path;
        
        this.pathIndex = startIndex;
        this.x = startX !== null ? startX : this.path[startIndex].x;
        this.y = startY !== null ? startY : this.path[startIndex].y;
        
        this.slowFactor = 1.0;
        this.slowTimer = 0;
        this.stunTimer = 0;
        
        this.abilityTimer = 3000; 
    }

    update(deltaTime, game) {
        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            return true; // Still alive, just stunned
        }

        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.slowFactor = 1.0; 
            }
        }
        
        if (this.typeInfo.id === 'hacker') {
            this.abilityTimer -= deltaTime;
            if (this.abilityTimer <= 0) {
                this.abilityTimer = 3000;
                
                let bestDist = 150;
                let bestTower = null;
                for (const tower of game.towerManager.towers) {
                    const dist = Math.hypot(tower.x - this.x, tower.y - this.y);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestTower = tower;
                    }
                }
                
                if (bestTower) {
                    bestTower.stunTimer = 2000;
                }
            }
        }

        if (this.pathIndex < this.path.length - 1) {
            const target = this.path[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            const moveAmt = this.speed * this.slowFactor * (deltaTime / 16.66);

            if (dist < moveAmt) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
            } else {
                this.x += (dx / dist) * moveAmt;
                this.y += (dy / dist) * moveAmt;
            }
            return true; 
        }
        return false; 
    }

    draw(ctx) {
        const hpPerc = Math.max(0, this.hp / this.maxHp);
        const isBoss = this.typeInfo.id === 'boss';
        
        const barWidth = isBoss ? 60 : 30;
        const barHeight = isBoss ? 8 : 4;
        const yOffset = isBoss ? 45 : 25;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth/2, this.y - yOffset, barWidth, barHeight);
        ctx.fillStyle = '#04d361';
        ctx.fillRect(this.x - barWidth/2, this.y - yOffset, barWidth * hpPerc, barHeight);

        ctx.font = isBoss ? '48px Arial' : '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.typeInfo.emoji, this.x, this.y);
        
        const statusRadius = isBoss ? 40 : 20;
        
        if (this.stunTimer > 0) {
            ctx.fillStyle = Config.COLORS.freeze;
            ctx.beginPath();
            ctx.arc(this.x, this.y, statusRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.slowFactor < 1.0) {
            ctx.fillStyle = 'rgba(0, 85, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, isBoss ? 30 : 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.typeInfo.id === 'hacker') {
            ctx.strokeStyle = '#11ff11';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 150 * (1 - Math.max(0, this.abilityTimer)/3000), 0, Math.PI*2);
            ctx.stroke();
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }
    
    applySlow(factor, duration) {
        if (this.typeInfo.id === 'estagiario' || this.typeInfo.id === 'bug') return; // Immunes
        this.slowFactor = factor;
        this.slowTimer = duration;
    }
    
    applyStun(duration) {
        this.stunTimer = duration;
    }
}

class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
    }

    spawn(enemyTypeStr, hpMultiplier = 1, startIndex = 0, startX = null, startY = null) {
        const typeInfo = Config.ENEMIES[enemyTypeStr];
        if (typeInfo) {
            const path = this.game.mapManager.getWaypoints();
            const enemy = new Enemy(typeInfo, path, startIndex, startX, startY);
            enemy.hp *= hpMultiplier;
            enemy.maxHp *= hpMultiplier;
            this.enemies.push(enemy);
        }
    }

    update(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.hp <= 0) {
                if (enemy.typeInfo.id === 'estagiario') {
                    // Spawn 2 bugs
                    this.spawn('bug', 1, enemy.pathIndex, enemy.x - 10, enemy.y - 10);
                    this.spawn('bug', 1, enemy.pathIndex, enemy.x + 10, enemy.y + 10);
                }
                this.enemies.splice(i, 1);
                continue;
            }
            
            const isMoving = enemy.update(deltaTime, this.game);

            if (!isMoving) {
                this.game.loseLife();
                this.enemies.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }
    }
}
