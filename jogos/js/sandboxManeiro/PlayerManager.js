class PlayerManager {
    constructor(game) {
        this.game = game;
        this.meuJogador = { 
            x: (Config.LARGURA_MUNDO / 2) * Config.TAM_BLOCO, 
            y: 0, 
            vx: 0, 
            vy: 0, 
            width: 17, 
            height: 31, 
            cor: `hsl(${Math.random() * 360}, 100%, 60%)`, 
            nome: '',
            heldItemId: null,
            swingTimer: 0,
            sprintBar: 100,
            correndo: false,
            sprintExausto: false,
            vida: 100,
            invulTimer: 0,
            ganchoAtivo: false,
            ganchoPreso: false,
            ganchoX: 0,
            ganchoY: 0,
            ganchoTargetX: 0,
            ganchoTargetY: 0,
            ganchoVelX: 0,
            ganchoVelY: 0
        };
        this.jogadores = {};
        this.teclas = { a: false, d: false, w: false, s: false, shift: false };
        this.swingTimer = 0; // Temporizador local da animação do braço
        this.regenTimer = 0; // Temporizador de regeneração de vida
        this.cooldownAtaque = 0; // Temporizador de cooldown de ataque
    }

    triggerSwing() {
        this.swingTimer = 15; // 15 frames de duração para a batida
    }

    lancarOuRecolherGancho(targetX, targetY) {
        if (this.meuJogador.ganchoAtivo) {
            // Se já estiver ativo, recolhe
            this.meuJogador.ganchoAtivo = false;
            this.meuJogador.ganchoPreso = false;
            SoundEffects.play('place_block'); // som de soltar
        } else {
            // Ativa o gancho
            this.meuJogador.ganchoAtivo = true;
            this.meuJogador.ganchoPreso = false;
            
            // Começa no centro do jogador
            let startX = this.meuJogador.x + this.meuJogador.width / 2;
            let startY = this.meuJogador.y + this.meuJogador.height / 2;
            
            this.meuJogador.ganchoX = startX;
            this.meuJogador.ganchoY = startY;
            this.meuJogador.ganchoTargetX = targetX;
            this.meuJogador.ganchoTargetY = targetY;
            
            // Calcula o vetor velocidade da ponta do gancho
            let dx = targetX - startX;
            let dy = targetY - startY;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                // Viaja a 28 pixels por frame
                this.meuJogador.ganchoVelX = (dx / dist) * 28;
                this.meuJogador.ganchoVelY = (dy / dist) * 28;
            } else {
                this.meuJogador.ganchoVelX = 0;
                this.meuJogador.ganchoVelY = -28;
            }
            
            SoundEffects.play('jump'); // som de lançamento
        }
    }

    verificarColisao(nx, ny, width = this.meuJogador.width, height = this.meuJogador.height, checarPlataforma = false) {
        const esq = Math.floor(nx / Config.TAM_BLOCO);
        const dir = Math.floor((nx + width) / Config.TAM_BLOCO);
        const topo = Math.floor(ny / Config.TAM_BLOCO);
        const baixo = Math.floor((ny + height) / Config.TAM_BLOCO);

        if (esq < 0 || dir >= Config.LARGURA_MUNDO || topo < 0 || baixo >= Config.ALTURA_MUNDO) return true;

        for (let i = esq; i <= dir; i++) {
            for (let j = topo; j <= baixo; j++) {
                if (this.game.world.mundo[i]) {
                    let idBloco = this.game.world.mundo[i][j];
                    if (idBloco !== 0 && Config.REGISTRO_BLOCOS[idBloco]) {
                        if (Config.REGISTRO_BLOCOS[idBloco].colisao) {
                            return true;
                        }
                        if (checarPlataforma && idBloco === 'plataforma_madeira') {
                            if (this.teclas.s) {
                                continue;
                            }
                            let vy = 0;
                            if (width === this.meuJogador.width && height === this.meuJogador.height) {
                                vy = this.meuJogador.vy;
                            }
                            let baseAnterior = (ny - vy) + height;
                            let topoPlataforma = j * Config.TAM_BLOCO;
                            if (baseAnterior <= topoPlataforma + 6) {
                                return true;
                            }
                        }
                    }
                    // Adiciona colisão física para a metade superior da porta (2 blocos de altura)
                    if (j + 1 < Config.ALTURA_MUNDO) {
                        let blocoAbaixo = this.game.world.mundo[i][j + 1];
                        if (blocoAbaixo === 'porta') {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    atualizarFisica() {
        // Regeneração de Vida: 1 de vida a cada 5 segundos (300 frames)
        this.regenTimer = (this.regenTimer || 0) + 1;
        if (this.regenTimer >= 120) {
            this.regenTimer = 0;
            this.meuJogador.vida = Math.min(100, this.meuJogador.vida + 1);
        }

        // Decrementa timer de invulnerabilidade
        if (this.meuJogador.invulTimer > 0) {
            this.meuJogador.invulTimer--;
        }

        // Gerenciamento de Sprint (Fôlego) com Cooldown
        let movendoHorizontal = this.teclas.a || this.teclas.d;
        
        // Ativa o cooldown se esgotar completamente
        if (this.meuJogador.sprintBar <= 0) {
            this.meuJogador.sprintExausto = true;
        }
        // Desativa o cooldown apenas quando recarregar 100%
        if (this.meuJogador.sprintExausto && this.meuJogador.sprintBar >= 100) {
            this.meuJogador.sprintExausto = false;
        }

        // Permite correr se não estiver com fadiga (exausto)
        if (this.teclas.shift && this.meuJogador.sprintBar > 0 && movendoHorizontal && !this.meuJogador.sprintExausto) {
            this.meuJogador.correndo = true;
            this.meuJogador.sprintBar = Math.max(0, this.meuJogador.sprintBar - 0.6);
        } else {
            this.meuJogador.correndo = false;
            this.meuJogador.sprintBar = Math.min(100, this.meuJogador.sprintBar + 0.3);
        }

        // ---------------- FISICA DO GANCHO (VIAGEM E TRAÇÃO) ----------------
        if (this.meuJogador.ganchoAtivo && !this.meuJogador.ganchoPreso) {
            // Avança a ponta do gancho
            this.meuJogador.ganchoX += this.meuJogador.ganchoVelX;
            this.meuJogador.ganchoY += this.meuJogador.ganchoVelY;
            
            // Verifica se colidiu com algum bloco no mapa
            let gx = Math.floor(this.meuJogador.ganchoX / Config.TAM_BLOCO);
            let gy = Math.floor(this.meuJogador.ganchoY / Config.TAM_BLOCO);
            
            let px = this.meuJogador.x + this.meuJogador.width / 2;
            let py = this.meuJogador.y + this.meuJogador.height / 2;
            let distCorda = Math.sqrt((this.meuJogador.ganchoX - px) * (this.meuJogador.ganchoX - px) + (this.meuJogador.ganchoY - py) * (this.meuJogador.ganchoY - py));
            
            if (gx >= 0 && gx < Config.LARGURA_MUNDO && gy >= 0 && gy < Config.ALTURA_MUNDO) {
                let idBloco = this.game.world.mundo[gx]?.[gy] || 0;
                if (idBloco !== 0) {
                    // Prende em qualquer bloco (com ou sem colisão, conforme solicitado)
                    this.meuJogador.ganchoPreso = true;
                    // Alinha ao centro do bloco
                    this.meuJogador.ganchoX = gx * Config.TAM_BLOCO + Config.TAM_BLOCO / 2;
                    this.meuJogador.ganchoY = gy * Config.TAM_BLOCO + Config.TAM_BLOCO / 2;
                    SoundEffects.play('place_block'); // som de prender
                }
            }
            
            // Se excedeu alcance máximo (450px) ou saiu dos limites, recolhe
            if (distCorda > 450 || gx < 0 || gx >= Config.LARGURA_MUNDO || gy < 0 || gy >= Config.ALTURA_MUNDO) {
                this.meuJogador.ganchoAtivo = false;
                this.meuJogador.ganchoPreso = false;
            }
        }

        let velocidadeBase = this.meuJogador.correndo ? 8.6 : 5.4;

        if (this.meuJogador.ganchoPreso) {
            // Se o gancho está preso, calcula a força de tração
            let px = this.meuJogador.x + this.meuJogador.width / 2;
            let py = this.meuJogador.y + this.meuJogador.height / 2;
            let dx = this.meuJogador.ganchoX - px;
            let dy = this.meuJogador.ganchoY - py;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= 20) {
                // Chegou perto o suficiente, desativa o gancho
                this.meuJogador.ganchoAtivo = false;
                this.meuJogador.ganchoPreso = false;
            } else {
                // Puxa o jogador em direção ao gancho (aceleração progressiva)
                let forcaAtracao = 0.95;
                this.meuJogador.vx += (dx / dist) * forcaAtracao;
                this.meuJogador.vy += (dy / dist) * forcaAtracao;
                
                // Diminui efeito da gravidade enquanto sobe
                if (dy < 0) {
                    this.meuJogador.vy -= 0.28;
                }
            }
            
            // A e D adicionam aceleração lateral extra (balanço de Homem-Aranha!)
            if (this.teclas.a) {
                this.meuJogador.vx = Math.max(-13, this.meuJogador.vx - 0.45);
            } else if (this.teclas.d) {
                this.meuJogador.vx = Math.min(13, this.meuJogador.vx + 0.45);
            } else {
                this.meuJogador.vx *= 0.98; // Menos atrito para balanço realista
            }
            
            // Limita a velocidade máxima para evitar passar pelos blocos (bugs de física)
            let speedLimit = 16.5;
            let speed = Math.sqrt(this.meuJogador.vx * this.meuJogador.vx + this.meuJogador.vy * this.meuJogador.vy);
            if (speed > speedLimit) {
                this.meuJogador.vx = (this.meuJogador.vx / speed) * speedLimit;
                this.meuJogador.vy = (this.meuJogador.vy / speed) * speedLimit;
            }
        } else {
            // Movimentação padrão
            if (this.teclas.a) this.meuJogador.vx = -velocidadeBase;
            else if (this.teclas.d) this.meuJogador.vx = velocidadeBase;
            else this.meuJogador.vx *= 0.7;
        }

        // Aplica o movimento e checa colisões no eixo X
        this.meuJogador.x += this.meuJogador.vx;
        if (this.verificarColisao(this.meuJogador.x, this.meuJogador.y)) {
            this.meuJogador.x -= this.meuJogador.vx;
            this.meuJogador.vx = 0;
        }

        // Gravidade normal (reduzida um pouco se estiver sendo puxado para cima pelo gancho)
        let gravidade = 0.72;
        if (this.meuJogador.ganchoPreso && (this.meuJogador.ganchoY < this.meuJogador.y)) {
            gravidade = 0.35; // gravidade reduzida ao subir com o gancho
        }
        this.meuJogador.vy += gravidade;
        
        if (this.meuJogador.vy > 14.4) this.meuJogador.vy = 14.4;
        
        // Aplica o movimento e checa colisões no eixo Y
        this.meuJogador.y += this.meuJogador.vy;

        let noChao = false;
        let checarPlataforma = this.meuJogador.vy >= 0;
        if (this.verificarColisao(this.meuJogador.x, this.meuJogador.y, this.meuJogador.width, this.meuJogador.height, checarPlataforma)) {
            if (this.meuJogador.vy > 0) {
                noChao = true;
                if (this.meuJogador.vy > 5) {
                    SoundEffects.play('land');
                }
            }
            this.meuJogador.y -= this.meuJogador.vy;
            this.meuJogador.vy = 0;
        }

        // Pulo normal (no chão) ou Pulo do Gancho (solta e dá impulso)
        if (this.teclas.w) {
            if (this.meuJogador.ganchoPreso) {
                // Solta o gancho dando um impulso forte para cima/frente! (Estilo Homem-Aranha muito maneiro)
                this.meuJogador.ganchoAtivo = false;
                this.meuJogador.ganchoPreso = false;
                this.meuJogador.vy = -12.5; // impulso vertical
                this.meuJogador.vx *= 1.25; // bônus de velocidade horizontal
                SoundEffects.play('jump');
            } else if (noChao) {
                this.meuJogador.vy = -15;
                SoundEffects.play('jump');
            }
        }

        // Efeito sonoro compassado de passos ao caminhar/correr no chão
        if (noChao && Math.abs(this.meuJogador.vx) > 0.5) {
            this.walkSoundTimer = (this.walkSoundTimer || 0) + 1;
            let stepDelay = this.meuJogador.correndo ? 16 : 24;
            if (this.walkSoundTimer >= stepDelay) {
                this.walkSoundTimer = 0;
                SoundEffects.play('walk');
            }
        } else {
            this.walkSoundTimer = 999; // Próximo início de passo tocará imediatamente
        }

        // Decrementa animação de swing local e cooldown de ataque
        if (this.swingTimer > 0) {
            this.swingTimer--;
        }
        if (this.cooldownAtaque > 0) {
            this.cooldownAtaque--;
        }

        // Atualiza estado do heldItem e swingTimer no pacote sincronizado
        this.meuJogador.heldItemId = this.game.inventory.getItemSelecionado()?.id || null;
        this.meuJogador.swingTimer = this.swingTimer;

        // Atualiza drops e coleta
        const drops = this.game.world.drops;
        for (let idDrop in drops) {
            let d = drops[idDrop];
            d.vy += 0.48;
            d.y += d.vy;

            // Drops colidem com plataformas também
            if (this.verificarColisao(d.x, d.y, 12, 12, d.vy >= 0)) {
                d.y -= d.vy;
                d.vy = 0;
            }

            if (Math.abs(this.meuJogador.x - d.x) < Config.TAM_BLOCO && Math.abs(this.meuJogador.y - d.y) < Config.TAM_BLOCO) {
                if (this.game.inventory.adicionarAoInventario(d.tipo, 1)) {
                    this.game.world.removerDrop(idDrop);
                    SoundEffects.play('collect');
                }
            }
        }

        // Camera updates
        const camera = this.game.camera;
        let targetX = this.meuJogador.x - this.game.canvas.width / 2 + this.meuJogador.width / 2;
        let targetY = this.meuJogador.y - this.game.canvas.height / 2 + this.meuJogador.height / 2;
        
        targetX = Math.max(0, Math.min(targetX, Config.LARGURA_MUNDO * Config.TAM_BLOCO - this.game.canvas.width));
        targetY = Math.max(0, Math.min(targetY, Config.ALTURA_MUNDO * Config.TAM_BLOCO - this.game.canvas.height));

        // Smooth camera lerp (10% na direção do alvo a cada frame)
        camera.x += (targetX - camera.x) * 0.1;
        camera.y += (targetY - camera.y) * 0.1;

        // Network sync
        if (this.game.network.souHost) {
            this.jogadores[this.game.network.meuId] = this.meuJogador;
        } else if (this.game.network.conexaoCliente && this.game.network.conexaoCliente.open) {
            this.game.network.conexaoCliente.send({ 
                tipo: 'MOVER', 
                id: this.game.network.meuId, 
                jogador: this.meuJogador 
            });
        }
    }

    desenharHumanoid(ctx, p, activeItemId, swingTimer) {
        ctx.save();
        
        // Efeito de piscar se estiver invulnerável (recebendo dano)
        if (p.invulTimer > 0) {
            ctx.globalAlpha = 0.3 + 0.5 * (Math.floor(Date.now() / 50) % 2);
        }
        
        const x = Math.floor(p.x);
        const y = Math.floor(p.y);
        const width = 14;
        const height = 26;
        
        // Translada e escala para acompanhar o TAM_BLOCO do jogo (1.2x)
        ctx.translate(x, y);
        const scale = Config.TAM_BLOCO / 20;
        ctx.scale(scale, scale);
        
        // Direção do olhar
        let facingRight = true;
        if (p.vx > 0.1) {
            facingRight = true;
        } else if (p.vx < -0.1) {
            facingRight = false;
        } else {
            facingRight = p.facingRight !== undefined ? p.facingRight : true;
        }
        p.facingRight = facingRight;

        // 1. MOCHILA (Backpack) - Desenhada nas costas
        ctx.fillStyle = '#5D4037';
        if (facingRight) {
            ctx.fillRect(-3, 8, 4, 10);
            ctx.fillStyle = '#3E2723';
            ctx.fillRect(-3, 8, 4, 2);
        } else {
            ctx.fillRect(width - 1, 8, 4, 10);
            ctx.fillStyle = '#3E2723';
            ctx.fillRect(width - 1, 8, 4, 2);
        }

        // 2. PERNAS E BOTAS (Legs & Boots)
        ctx.fillStyle = '#1976D2'; 
        ctx.fillRect(1, 16, 5, 8);
        ctx.fillRect(8, 16, 5, 8);
        
        ctx.fillStyle = '#3E2723'; 
        ctx.fillRect(0, 24, 6, 2);
        ctx.fillRect(8, 24, 6, 2);
        
        // 3. TRONCO E BLUSA (Torso & Shirt) / ARMADURA
        ctx.fillStyle = p.cor;
        ctx.fillRect(1, 8, 12, 9);
        
        if (p.armorId) {
            if (p.armorId === 'armadura_madeira') {
                ctx.fillStyle = '#795548'; // Peitoral de madeira
                ctx.fillRect(0, 8, 14, 10);
                ctx.fillStyle = '#5D4037'; // Sombras
                ctx.fillRect(0, 8, 2, 10);
                ctx.fillRect(12, 8, 2, 10);
            } else if (p.armorId === 'armadura_ferro') {
                ctx.fillStyle = '#9E9E9E'; // Peitoral de ferro
                ctx.fillRect(0, 8, 14, 10);
                ctx.fillStyle = '#757575'; // Sombras
                ctx.fillRect(0, 8, 2, 10);
                ctx.fillRect(12, 8, 2, 10);
                ctx.fillStyle = '#E0E0E0'; // Brilho no peito
                ctx.fillRect(4, 10, 6, 6);
            }
        }
        
        // 4. CABEÇA (Head)
        ctx.fillStyle = '#FFD54F'; 
        ctx.fillRect(2, 0, 10, 8);
        
        ctx.fillStyle = '#5D4037'; 
        ctx.fillRect(2, 0, 10, 2);
        if (facingRight) {
            ctx.fillRect(2, 2, 2, 4);
        } else {
            ctx.fillRect(10, 2, 2, 4);
        }

        // Olhos (Brancos)
        ctx.fillStyle = 'white';
        ctx.fillRect(facingRight ? 6 : 2, 3, 2, 2);
        ctx.fillRect(facingRight ? 10 : 6, 3, 2, 2);
        
        // Pupilas pretas com efeito de piscar
        ctx.fillStyle = 'black';
        let blink = Math.floor(Date.now() / 250) % 18 === 0;
        if (!blink) {
            let direcaoOlho = p.vx > 0.1 ? 1 : (p.vx < -0.1 ? -1 : 0);
            ctx.fillRect((facingRight ? 7 : 3) + direcaoOlho, 4, 1, 1);
            ctx.fillRect((facingRight ? 11 : 7) + direcaoOlho, 4, 1, 1);
        }

        // 5. BRAÇO E ITEM (Arm & Swinging Tool)
        ctx.save();
        
        let shoulderX = facingRight ? 10 : 4;
        let shoulderY = 10;
        
        ctx.translate(shoulderX, shoulderY);
        
        let angle = 0;
        if (swingTimer > 0) {
            let progresso = (15 - swingTimer) / 15;
            angle = Math.sin(progresso * Math.PI) * 1.6;
            if (!facingRight) angle = -angle;
        }
        
        ctx.rotate(angle);
        
        ctx.fillStyle = p.cor;
        ctx.fillRect(-2, 0, 4, 5);
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(-2, 5, 4, 3);
        
        if (activeItemId) {
            ctx.save();
            ctx.translate(0, 6);
            
            if (activeItemId === 'picareta_cobre' || activeItemId === 'espada_cobre') {
                ctx.rotate(facingRight ? Math.PI / 4 : -Math.PI / 4);
                const tex = this.game.textures.get(activeItemId);
                if (tex) {
                    ctx.drawImage(tex, -9, -9, 18, 18);
                }
            } else {
                const tex = this.game.textures.get(activeItemId);
                if (tex) {
                    ctx.drawImage(tex, -5, -5, 10, 10);
                }
            }
            ctx.restore();
        }
        
        ctx.restore();
        
        // 6. NICKNAME DO JOGADOR
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = "black"; ctx.shadowBlur = 4;
        ctx.fillText(p.nome, width / 2, -8);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }

    desenharPlayers(ctx) {
        for (let id in this.jogadores) {
            let p = this.jogadores[id];
            
            // Desenha o gancho se ativo
            if (p.ganchoAtivo) {
                let pX = p.x + p.width / 2;
                let pY = p.y + p.height / 2;
                
                ctx.save();
                
                // 1. Sombra do cabo
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(pX, pY);
                ctx.lineTo(p.ganchoX, p.ganchoY);
                ctx.stroke();

                // 2. Cabo metálico principal
                ctx.strokeStyle = '#78909c';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(pX, pY);
                ctx.lineTo(p.ganchoX, p.ganchoY);
                ctx.stroke();

                // 3. Brilho do cabo (efeito trançado metálico)
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.moveTo(pX, pY);
                ctx.lineTo(p.ganchoX, p.ganchoY);
                ctx.stroke();
                
                ctx.restore();

                // 4. Âncora metálica de 3 pontas na extremidade
                ctx.save();
                ctx.translate(p.ganchoX, p.ganchoY);
                let angle = Math.atan2(p.ganchoY - pY, p.ganchoX - pX);
                ctx.rotate(angle);
                
                // Sombra da âncora
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 4;

                // Anel de conexão
                ctx.strokeStyle = '#b0bec5';
                ctx.fillStyle = '#37474f';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(-8, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Haste central
                ctx.strokeStyle = '#90a4ae';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-5, 0);
                ctx.lineTo(4, 0);
                ctx.stroke();

                // Garras/Pontas
                ctx.strokeStyle = '#cfd8dc';
                ctx.fillStyle = '#78909c';
                ctx.lineWidth = 2;
                
                // Ponta central
                ctx.beginPath();
                ctx.moveTo(4, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();

                // Garra esquerda (superior)
                ctx.beginPath();
                ctx.moveTo(2, 0);
                ctx.quadraticCurveTo(6, -6, -2, -7);
                ctx.lineTo(-4, -6);
                ctx.stroke();

                // Garra direita (inferior)
                ctx.beginPath();
                ctx.moveTo(2, 0);
                ctx.quadraticCurveTo(6, 6, -2, 7);
                ctx.lineTo(-4, 6);
                ctx.stroke();

                // Faíscas/Brilhos se preso
                if (p.ganchoPreso) {
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#ffeb3b';
                    for (let i = 0; i < 3; i++) {
                        let faixAngle = (i * Math.PI * 2) / 3 + (Date.now() / 200);
                        let fx = Math.cos(faixAngle) * 6;
                        let fy = Math.sin(faixAngle) * 6;
                        ctx.fillRect(fx - 1, fy - 1, 2, 2);
                    }
                }

                ctx.restore();
            }
            
            this.desenharHumanoid(ctx, p, p.heldItemId, p.swingTimer);
        }
    }
}
window.PlayerManager = PlayerManager;
