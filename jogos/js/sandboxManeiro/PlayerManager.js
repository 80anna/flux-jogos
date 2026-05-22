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
            correndo: false
        };
        this.jogadores = {};
        this.teclas = { a: false, d: false, w: false, shift: false };
        this.swingTimer = 0; // Temporizador local da animação do braço
    }

    triggerSwing() {
        this.swingTimer = 15; // 15 frames de duração para a batida
    }

    verificarColisao(nx, ny, width = this.meuJogador.width, height = this.meuJogador.height) {
        const esq = Math.floor(nx / Config.TAM_BLOCO);
        const dir = Math.floor((nx + width) / Config.TAM_BLOCO);
        const topo = Math.floor(ny / Config.TAM_BLOCO);
        const baixo = Math.floor((ny + height) / Config.TAM_BLOCO);

        if (esq < 0 || dir >= Config.LARGURA_MUNDO || topo < 0 || baixo >= Config.ALTURA_MUNDO) return true;

        for (let i = esq; i <= dir; i++) {
            for (let j = topo; j <= baixo; j++) {
                if (this.game.world.mundo[i]) {
                    let idBloco = this.game.world.mundo[i][j];
                    if (idBloco !== 0 && Config.REGISTRO_BLOCOS[idBloco] && Config.REGISTRO_BLOCOS[idBloco].colisao) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    atualizarFisica() {
        // Gerenciamento de Sprint (Fôlego)
        let movendoHorizontal = this.teclas.a || this.teclas.d;
        if (this.teclas.shift && this.meuJogador.sprintBar > 0 && movendoHorizontal) {
            this.meuJogador.correndo = true;
            this.meuJogador.sprintBar = Math.max(0, this.meuJogador.sprintBar - 0.6);
        } else {
            this.meuJogador.correndo = false;
            this.meuJogador.sprintBar = Math.min(100, this.meuJogador.sprintBar + 0.3);
        }

        let velocidadeBase = this.meuJogador.correndo ? 8.6 : 5.4;

        if (this.teclas.a) this.meuJogador.vx = -velocidadeBase;
        else if (this.teclas.d) this.meuJogador.vx = velocidadeBase;
        else this.meuJogador.vx *= 0.7;

        this.meuJogador.x += this.meuJogador.vx;
        if (this.verificarColisao(this.meuJogador.x, this.meuJogador.y)) {
            this.meuJogador.x -= this.meuJogador.vx;
            this.meuJogador.vx = 0;
        }

        this.meuJogador.vy += 0.72;
        if (this.meuJogador.vy > 14.4) this.meuJogador.vy = 14.4;
        this.meuJogador.y += this.meuJogador.vy;

        let noChao = false;
        if (this.verificarColisao(this.meuJogador.x, this.meuJogador.y)) {
            if (this.meuJogador.vy > 0) noChao = true;
            this.meuJogador.y -= this.meuJogador.vy;
            this.meuJogador.vy = 0;
        }

        if (this.teclas.w && noChao) this.meuJogador.vy = -12;

        // Decrementa animação de swing local
        if (this.swingTimer > 0) {
            this.swingTimer--;
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

            if (this.verificarColisao(d.x, d.y, 12, 12)) {
                d.y -= d.vy;
                d.vy = 0;
            }

            if (Math.abs(this.meuJogador.x - d.x) < Config.TAM_BLOCO && Math.abs(this.meuJogador.y - d.y) < Config.TAM_BLOCO) {
                if (this.game.inventory.adicionarAoInventario(d.tipo, 1)) {
                    this.game.world.removerDrop(idDrop);
                }
            }
        }

        // Camera updates
        const camera = this.game.camera;
        camera.x = this.meuJogador.x - this.game.canvas.width / 2 + this.meuJogador.width / 2;
        camera.y = this.meuJogador.y - this.game.canvas.height / 2 + this.meuJogador.height / 2;
        camera.x = Math.max(0, Math.min(camera.x, Config.LARGURA_MUNDO * Config.TAM_BLOCO - this.game.canvas.width));
        camera.y = Math.max(0, Math.min(camera.y, Config.ALTURA_MUNDO * Config.TAM_BLOCO - this.game.canvas.height));

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
        
        // 3. TRONCO E BLUSA (Torso & Shirt)
        ctx.fillStyle = p.cor;
        ctx.fillRect(1, 8, 12, 9);
        
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
            
            if (activeItemId === 'picareta_cobre') {
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
            this.desenharHumanoid(ctx, p, p.heldItemId, p.swingTimer);
        }
    }
}
window.PlayerManager = PlayerManager;
