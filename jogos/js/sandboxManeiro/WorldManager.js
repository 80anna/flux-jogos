class WorldManager {
    constructor(game) {
        this.game = game;
        this.mundo = [];
        this.drops = {};
        this.nuvens = [];
        this.inimigos = []; // Lista de inimigos ativos no mundo

        // Inicializa nuvens
        for (let i = 0; i < 60; i++) {
            this.nuvens.push({ 
                x: Math.random() * Config.LARGURA_MUNDO * Config.TAM_BLOCO, 
                y: Math.random() * 200, 
                velocidade: 0.1 + Math.random() * 0.3, 
                tamanho: 40 + Math.random() * 60 
            });
        }
        this.madeiraColocada = new Set();
    }

    gerarMundo() {
        let mapaAltura = [];
        for (let x = 0; x < Config.LARGURA_MUNDO; x++) {
            let alturaBase = 40;
            let montanha = Math.sin(x / 20) * 12;
            let detalhe = Math.sin(x / 5) * 4;
            mapaAltura[x] = Math.floor(alturaBase + montanha + detalhe);
        }

        const TAM_BIOMA = 400;
        const BIOMAS = ['selva', 'deserto', 'floresta', 'floresta', 'tundra'];

        for (let x = 0; x < Config.LARGURA_MUNDO; x++) {
            this.mundo[x] = [];
            let biomaAtual = BIOMAS[Math.floor(x / TAM_BIOMA) % BIOMAS.length];
            
            for (let y = 0; y < Config.ALTURA_MUNDO; y++) {
                let chao = mapaAltura[x];
                if (y < chao) {
                    this.mundo[x][y] = 0;
                } else {
                    if (biomaAtual === 'floresta') {
                        if (y === chao) this.mundo[x][y] = 'grama';
                        else if (y < chao + 4) this.mundo[x][y] = 'terra';
                        else this.mundo[x][y] = 'pedra';
                    } else if (biomaAtual === 'deserto') {
                        if (y < chao + 5) this.mundo[x][y] = 'areia';
                        else this.mundo[x][y] = 'pedra';
                    } else if (biomaAtual === 'tundra') {
                        if (y === chao) this.mundo[x][y] = 'neve';
                        else if (y < chao + 3) this.mundo[x][y] = 'gelo';
                        else if (y < chao + 6) this.mundo[x][y] = 'terra';
                        else this.mundo[x][y] = 'pedra';
                    } else if (biomaAtual === 'selva') {
                        if (y === chao) this.mundo[x][y] = 'grama';
                        else if (y < chao + 5) this.mundo[x][y] = 'terra';
                        else this.mundo[x][y] = 'pedra';
                    }
                }
            }
        }

        // Cavernas Melhores (Gerador de túneis de largura variável e câmaras amplas)
        for (let i = 0; i < 110; i++) {
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 40 + Math.floor(Math.random() * (Config.ALTURA_MUNDO - 60)); // espalha mais verticalmente!
            
            let raioTudo = 1 + Math.floor(Math.random() * 3); // raio de 1 a 3 blocos
            for (let passo = 0; passo < 250; passo++) {
                // Varia o raio do túnel organicamente para criar passagens estreitas e salões amplos
                if (passo % 15 === 0) {
                    raioTudo = Math.max(1, Math.min(3, raioTudo + (Math.random() > 0.5 ? 1 : -1)));
                }
                
                // Escava um círculo de ar
                for (let dx = -raioTudo; dx <= raioTudo; dx++) {
                    for (let dy = -raioTudo; dy <= raioTudo; dy++) {
                        if (dx*dx + dy*dy <= raioTudo*raioTudo + 0.5) {
                            let ex = cx + dx;
                            let ey = cy + dy;
                            if (ex >= 0 && ex < Config.LARGURA_MUNDO && ey >= 0 && ey < Config.ALTURA_MUNDO) {
                                this.mundo[ex][ey] = 0;
                            }
                        }
                    }
                }
                
                // Movimento sinuoso (Random Walk aprimorado)
                cx += Math.floor(Math.random() * 3) - 1;
                cy += Math.floor(Math.random() * 3) - 1;
                
                // Mantém dentro dos limites verticais saudáveis
                if (cy < 35) cy = 35;
                if (cy > Config.ALTURA_MUNDO - 10) cy = Config.ALTURA_MUNDO - 10;
            }
        }

        // Geração de Manchas de Lama (Mud patches in the transition layer)
        let totalManchasLama = Math.floor(Config.LARGURA_MUNDO / 3);
        for (let m = 0; m < totalManchasLama; m++) {
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 35 + Math.floor(Math.random() * 20); // Camadas de terra/pedra de transição
            
            let tamMancha = 12 + Math.floor(Math.random() * 10); // Aglomerados ricos de 12 a 21 blocos
            for (let b = 0; b < tamMancha; b++) {
                if (this.mundo[cx] && (this.mundo[cx][cy] === 'terra' || this.mundo[cx][cy] === 'pedra')) {
                    this.mundo[cx][cy] = 'lama';
                }
                cx += Math.floor(Math.random() * 3) - 1;
                cy += Math.floor(Math.random() * 3) - 1;
                if (cx < 0) cx = 0;
                if (cx >= Config.LARGURA_MUNDO) cx = Config.LARGURA_MUNDO - 1;
                if (cy < 0) cy = 0;
                if (cy >= Config.ALTURA_MUNDO) cy = Config.ALTURA_MUNDO - 1;
            }
        }

        // Geração de Manchas de Granito (Granite patches in rock layers)
        let totalManchasGranito = Math.floor(Config.LARGURA_MUNDO / 4);
        for (let m = 0; m < totalManchasGranito; m++) {
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 50 + Math.floor(Math.random() * 150); // Camadas de rocha profunda
            
            let tamMancha = 15 + Math.floor(Math.random() * 12); // Aglomerados de 15 a 26 blocos
            for (let b = 0; b < tamMancha; b++) {
                if (this.mundo[cx] && this.mundo[cx][cy] === 'pedra') {
                    this.mundo[cx][cy] = 'granito';
                }
                cx += Math.floor(Math.random() * 3) - 1;
                cy += Math.floor(Math.random() * 3) - 1;
                if (cx < 0) cx = 0;
                if (cx >= Config.LARGURA_MUNDO) cx = Config.LARGURA_MUNDO - 1;
                if (cy < 0) cy = 0;
                if (cy >= Config.ALTURA_MUNDO) cy = Config.ALTURA_MUNDO - 1;
            }
        }

        // Geração de Veias de Carvão no Subsolo (Clusters) - Frequência aumentada e veias maiores (pelo menos 10 blocos)
        let totalVeias = Math.floor((Config.LARGURA_MUNDO * Config.ALTURA_MUNDO) / 150);
        for (let v = 0; v < totalVeias; v++) {
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 45 + Math.floor(Math.random() * (Config.ALTURA_MUNDO - 55));
            
            let tamVeia = 10 + Math.floor(Math.random() * 6); // Pelo menos 10 blocos por veia (10 a 15 blocos)
            for (let b = 0; b < tamVeia; b++) {
                if (this.mundo[cx] && this.mundo[cx][cy] === 'pedra') {
                    this.mundo[cx][cy] = 'minerio_carvao';
                }
                cx += Math.floor(Math.random() * 3) - 1;
                cy += Math.floor(Math.random() * 3) - 1;
                
                if (cx < 0) cx = 0;
                if (cx >= Config.LARGURA_MUNDO) cx = Config.LARGURA_MUNDO - 1;
                if (cy < 45) cy = 45;
                if (cy >= Config.ALTURA_MUNDO) cy = Config.ALTURA_MUNDO - 1;
            }
        }

        // Elementos adicionais nos biomas
        for (let x = 4; x < Config.LARGURA_MUNDO - 4; x++) {
            if (!this.mundo[x]) continue;
            let y = mapaAltura[x];
            let biomaAtual = BIOMAS[Math.floor(x / TAM_BIOMA) % BIOMAS.length];

            // Plantas e decorações só podem ser geradas se houver um bloco sólido embaixo delas
            let blocoAbaixo = this.mundo[x][y];
            if (blocoAbaixo === 0 || !Config.REGISTRO_BLOCOS[blocoAbaixo] || !Config.REGISTRO_BLOCOS[blocoAbaixo].colisao) {
                continue;
            }

            if (biomaAtual === 'floresta') {
                if (Math.random() < 0.1) {
                    let h = 3 + Math.floor(Math.random() * 3);
                    for (let t = 1; t <= h; t++) this.mundo[x][y - t] = 'madeira';
                    let topo = y - h;
                    this.mundo[x][topo] = 'folha'; this.mundo[x-1][topo] = 'folha'; this.mundo[x+1][topo] = 'folha';
                    this.mundo[x][topo-1] = 'folha'; this.mundo[x-1][topo-1] = 'folha'; this.mundo[x+1][topo-1] = 'folha';
                    this.mundo[x][topo-2] = 'folha';
                } else {
                    let r = Math.random();
                    if (r < 0.20) this.mundo[x][y - 1] = 'grama_alta';
                    else if (r < 0.28) this.mundo[x][y - 1] = 'arbusto';
                    else if (r < 0.33) this.mundo[x][y - 1] = 'flor_vermelha';
                    else if (r < 0.38) this.mundo[x][y - 1] = 'flor_amarela';
                }
            } else if (biomaAtual === 'deserto') {
                if (Math.random() < 0.08) {
                    let h = 2 + Math.floor(Math.random() * 3);
                    for (let t = 1; t <= h; t++) this.mundo[x][y - t] = 'cacto';
                    if (Math.random() > 0.5) this.mundo[x-1][y - h + 1] = 'cacto';
                } else if (Math.random() < 0.10) {
                    this.mundo[x][y - 1] = 'arbusto_seco';
                }
            } else if (biomaAtual === 'selva') {
                if (Math.random() < 0.15) {
                    let h = 6 + Math.floor(Math.random() * 5);
                    for (let t = 1; t <= h; t++) this.mundo[x][y - t] = 'madeira_selva';
                    let topo = y - h;
                    for(let ix=-2; ix<=2; ix++) {
                        for(let iy=0; iy<=3; iy++) {
                            if (Math.random() > 0.2) this.mundo[x+ix][topo - iy] = 'folha_selva';
                        }
                    }
                } else {
                    let r = Math.random();
                    if (r < 0.15) {
                        let h = 3 + Math.floor(Math.random() * 4);
                        for (let t = 1; t <= h; t++) this.mundo[x][y - t] = 'bambu';
                    } else if (r < 0.25) {
                        this.mundo[x][y - 1] = 'arbusto_florido';
                    } else if (r < 0.40) {
                        this.mundo[x][y - 1] = 'grama_alta';
                    }
                }
            } else if (biomaAtual === 'tundra') {
                if (Math.random() < 0.08) {
                    let h = 4 + Math.floor(Math.random() * 3);
                    for (let t = 1; t <= h; t++) this.mundo[x][y - t] = 'madeira_pinheiro';
                    let topo = y - h;
                    this.mundo[x][topo] = 'folha_pinheiro';
                    this.mundo[x-1][topo+1] = 'folha_pinheiro'; this.mundo[x][topo+1] = 'folha_pinheiro'; this.mundo[x+1][topo+1] = 'folha_pinheiro';
                    this.mundo[x-2][topo+2] = 'folha_pinheiro'; this.mundo[x-1][topo+2] = 'folha_pinheiro'; this.mundo[x][topo+2] = 'folha_pinheiro'; this.mundo[x+1][topo+2] = 'folha_pinheiro'; this.mundo[x+2][topo+2] = 'folha_pinheiro';
                    this.mundo[x-1][topo+3] = 'folha_pinheiro'; this.mundo[x][topo+3] = 'folha_pinheiro'; this.mundo[x+1][topo+3] = 'folha_pinheiro';
                } else if (Math.random() < 0.12) {
                    this.mundo[x][y - 1] = 'arbusto_congelado';
                }
            }
        }
    }

    criarDrop(x, y, tipo) {
        let tipoDrop = tipo;
        if (tipo === 'minerio_carvao') tipoDrop = 'carvao';

        const idDrop = Math.random().toString(36).substr(2, 9);
        const offset = Config.TAM_BLOCO / 4;
        const novoDrop = { x: x * Config.TAM_BLOCO + offset, y: y * Config.TAM_BLOCO + offset, vy: -3, tipo: tipoDrop };
        this.drops[idDrop] = novoDrop;

        const pacote = { tipo: 'CRIAR_DROP', idDrop: idDrop, drop: novoDrop };
        if (this.game.network.souHost) {
            this.game.network.transmitir(pacote);
        } else if (this.game.network.conexaoCliente) {
            this.game.network.conexaoCliente.send(pacote);
        }
    }

    removerDrop(idDrop) {
        delete this.drops[idDrop];
        const pacote = { tipo: 'REMOVER_DROP', idDrop: idDrop };
        if (this.game.network.souHost) {
            this.game.network.transmitir(pacote);
        } else if (this.game.network.conexaoCliente) {
            this.game.network.conexaoCliente.send(pacote);
        }
    }

    verificarQuebraPlantaAcima(x, y) {
        let yAcima = y - 1;
        if (yAcima >= 0) {
            let blocoAcima = this.mundo[x] ? this.mundo[x][yAcima] : 0;
            const plantas = ['grama_alta', 'arbusto', 'flor_vermelha', 'flor_amarela', 'cacto', 'arbusto_congelado', 'arbusto_seco', 'bambu', 'arbusto_florido', 'tocha'];
            if (plantas.includes(blocoAcima)) {
                this.criarDrop(x, yAcima, blocoAcima);
                this.mundo[x][yAcima] = 0;
                
                const pacote = { tipo: 'BLOCO', x: x, y: yAcima, idBloco: 0 };
                if (this.game.network.souHost) {
                    this.game.network.transmitir(pacote);
                } else if (this.game.network.conexaoCliente) {
                    this.game.network.conexaoCliente.send(pacote);
                }
                
                // Recursivamente verifica se havia outra planta acima (ex: cactos múltiplos)
                this.verificarQuebraPlantaAcima(x, yAcima);
            }
        }
    }

    quebrarArvoreInteira(startX, startY, tipoMadeira) {
        let tipoFolha = '';
        if (tipoMadeira === 'madeira') tipoFolha = 'folha';
        else if (tipoMadeira === 'madeira_selva') tipoFolha = 'folha_selva';
        else if (tipoMadeira === 'madeira_pinheiro') tipoFolha = 'folha_pinheiro';
        else return;

        let visitados = new Set();
        let fila = [{ x: startX, y: startY }];
        let chaveStart = `${startX},${startY}`;
        visitados.add(chaveStart);

        let blocosParaQuebrar = [];

        while (fila.length > 0) {
            let atual = fila.shift();
            let bloco = this.mundo[atual.x] ? this.mundo[atual.x][atual.y] : 0;
            
            if (bloco === tipoMadeira || bloco === tipoFolha) {
                blocosParaQuebrar.push(atual);

                // Vizinhos em cruz e diagonais para as folhas
                const vizinhos = [
                    { x: atual.x, y: atual.y - 1 },
                    { x: atual.x - 1, y: atual.y },
                    { x: atual.x + 1, y: atual.y },
                    { x: atual.x, y: atual.y + 1 },
                    { x: atual.x - 1, y: atual.y - 1 },
                    { x: atual.x + 1, y: atual.y - 1 },
                    { x: atual.x - 1, y: atual.y + 1 },
                    { x: atual.x + 1, y: atual.y + 1 }
                ];

                for (let v of vizinhos) {
                    if (v.x >= 0 && v.x < Config.LARGURA_MUNDO && v.y >= 0 && v.y < Config.ALTURA_MUNDO) {
                        let chave = `${v.x},${v.y}`;
                        if (!visitados.has(chave)) {
                            let vizBloco = this.mundo[v.x] ? this.mundo[v.x][v.y] : 0;
                            let ehMadeiraColocada = (vizBloco === 'madeira' || vizBloco === 'madeira_selva' || vizBloco === 'madeira_pinheiro') && this.madeiraColocada.has(chave);
                            if ((vizBloco === tipoMadeira && !ehMadeiraColocada) || vizBloco === tipoFolha) {
                                visitados.add(chave);
                                fila.push(v);
                            }
                        }
                    }
                }
            }
            
            if (visitados.size > 150) break;
        }

        // Destrói blocos encontrados e gera drops correspondentes
        blocosParaQuebrar.forEach(b => {
            let bloco = this.mundo[b.x][b.y];
            if (bloco !== 0) {
                this.game.criarParticulas(b.x, b.y, bloco);

                if (bloco === tipoMadeira) {
                    // Drop duplo de troncos!
                    this.criarDrop(b.x, b.y, bloco);
                    this.criarDrop(b.x, b.y, bloco);
                } else {
                    this.criarDrop(b.x, b.y, bloco);
                }

                this.mundo[b.x][b.y] = 0;

                const pacote = { tipo: 'BLOCO', x: b.x, y: b.y, idBloco: 0 };
                if (this.game.network.souHost) {
                    this.game.network.transmitir(pacote);
                } else if (this.game.network.conexaoCliente) {
                    this.game.network.conexaoCliente.send(pacote);
                }
            }
        });
    }

    spawnInimigos() {
        this.spawnCooldown = this.spawnCooldown !== undefined ? this.spawnCooldown : 0;
        if (this.spawnCooldown > 0) {
            this.spawnCooldown--;
            return;
        }

        if (this.inimigos.length >= 8) return; // Limite de inimigos simultâneos reduzido para evitar aglomeração

        let H = this.game.tempoMinutos / 60;
        let eDia = H >= 6 && H < 18;

        // Determina qual inimigo spawnar com base no ciclo dia/noite
        let tipoInimigo = '';
        if (eDia) {
            // De dia spawna apenas Slime Azul
            if (Math.random() < 0.15) {
                tipoInimigo = 'slime_azul';
            }
        } else {
            // De noite spawna apenas Zumbi
            if (Math.random() < 0.2) {
                tipoInimigo = 'zombie';
            }
        }

        if (!tipoInimigo) return;

        // Define um cooldown de 4 segundos (240 frames) para tentativas de spawn
        this.spawnCooldown = 240;

        // Spawna ESTRITAMENTE fora da tela visível do jogador (câmera)
        let cam = this.game.camera;
        let spawnLeft = Math.random() > 0.5;
        let spawnX = 0;
        
        if (spawnLeft) {
            // 100 a 300 pixels para a esquerda da borda esquerda da tela
            spawnX = cam.x - (100 + Math.random() * 200);
        } else {
            // 100 a 300 pixels para a direita da borda direita da tela
            spawnX = cam.x + this.game.canvas.width + (100 + Math.random() * 200);
        }
        
        // Verifica limites do mundo
        if (spawnX < 50 || spawnX > Config.LARGURA_MUNDO * Config.TAM_BLOCO - 50) return;

        let gridX = Math.floor(spawnX / Config.TAM_BLOCO);
        
        // Encontra o bloco de superfície do terreno naquela coordenada X
        let spawnY = 0;
        for (let y = 0; y < Config.ALTURA_MUNDO; y++) {
            if (this.mundo[gridX] && this.mundo[gridX][y] !== 0 && Config.REGISTRO_BLOCOS[this.mundo[gridX][y]]?.colisao) {
                spawnY = (y - 2) * Config.TAM_BLOCO; // Spawn ligeiramente acima do solo
                break;
            }
        }

        if (spawnY <= 0) return;

        if (tipoInimigo === 'slime_azul') {
            this.inimigos.push({
                id: Math.random().toString(36).substr(2, 9),
                tipo: 'slime_azul',
                x: spawnX,
                y: spawnY,
                vx: 0,
                vy: 0,
                width: 22,
                height: 16,
                vida: 50,
                maxVida: 50,
                dano: 15,
                hopTimer: Math.random() * 60,
                dropItem: 'gel'
            });
        } else if (tipoInimigo === 'zombie') {
            this.inimigos.push({
                id: Math.random().toString(36).substr(2, 9),
                tipo: 'zombie',
                x: spawnX,
                y: spawnY,
                vx: 0,
                vy: 0,
                width: 17,
                height: 31,
                vida: 70,
                maxVida: 70,
                dano: 25,
                dropItem: 'carne_podre',
                growlTimer: Math.random() * 150
            });
            SoundEffects.play('zombie_growl');
        }
    }

    atualizarInimigos() {
        let player = this.game.player.meuJogador;
        
        for (let i = this.inimigos.length - 1; i >= 0; i--) {
            let enemy = this.inimigos[i];
            
            // Se o inimigo estiver muito distante do jogador (ex: > 1500px), despawna para liberar memória
            let distPlayer = Math.abs(enemy.x - player.x);
            if (distPlayer > 2000) {
                this.inimigos.splice(i, 1);
                continue;
            }

            // Aplica gravidade básica
            enemy.vy += 0.72;
            if (enemy.vy > 14.4) enemy.vy = 14.4;
            
            // Movimento Vertical com colisão
            enemy.y += enemy.vy;
            if (this.game.player.verificarColisao(enemy.x, enemy.y, enemy.width, enemy.height, enemy.vy >= 0)) {
                enemy.y -= enemy.vy;
                enemy.vy = 0;
            }

            // Movimento Horizontal e IA
            if (enemy.tipo === 'slime_azul') {
                enemy.hopTimer++;
                // Slime Azul salta a cada 120 frames (2 segundos)
                if (enemy.hopTimer >= 120) {
                    enemy.hopTimer = Math.random() * 20; // reinicia com staggering
                    enemy.vy = -9.5 - Math.random() * 2; // salto
                    let paraEsquerda = player.x < enemy.x;
                    enemy.vx = paraEsquerda ? -3 : 3;
                    if (Math.abs(enemy.x - player.x) < 800) {
                        SoundEffects.play('slime_hop');
                    }
                }
                
                // Aplica movimento horizontal do pulo
                enemy.x += enemy.vx;
                if (this.game.player.verificarColisao(enemy.x, enemy.y, enemy.width, enemy.height)) {
                    enemy.x -= enemy.vx;
                    enemy.vx = -enemy.vx; // rebate ao bater na parede
                }
                
                // Desaceleração horizontal rápida no chão para evitar deslizamento excessivo e aprisionamento em buracos
                if (enemy.vy === 0) {
                    enemy.vx *= 0.25;
                }
            } else if (enemy.tipo === 'zombie') {
                // Zumbi caminha diretamente na direção do jogador de forma implacável
                let paraEsquerda = player.x < enemy.x;
                enemy.vx = paraEsquerda ? -1.4 : 1.4;
                
                enemy.x += enemy.vx;
                // Se colidir horizontalmente (bater em parede/bloco), tenta pular para subir
                if (this.game.player.verificarColisao(enemy.x, enemy.y, enemy.width, enemy.height)) {
                    enemy.x -= enemy.vx;
                    if (enemy.vy === 0) {
                        enemy.vy = -8.5; // tenta pular obstáculo
                    }
                }

                // Grunhido periódico do zumbi se estiver por perto
                enemy.growlTimer = (enemy.growlTimer || 0) + 1;
                if (enemy.growlTimer >= 240 + Math.random() * 240) { // a cada 4 a 8 segundos
                    enemy.growlTimer = 0;
                    if (Math.abs(enemy.x - player.x) < 800) {
                        SoundEffects.play('zombie_growl');
                    }
                }
            }

            // Colisão com o Jogador (Dano no Jogador)
            let overlapX = Math.abs(enemy.x + enemy.width / 2 - (player.x + player.width / 2)) < (enemy.width + player.width) / 2;
            let overlapY = Math.abs(enemy.y + enemy.height / 2 - (player.y + player.height / 2)) < (enemy.height + player.height) / 2;
            
            if (overlapX && overlapY) {
                if (player.invulTimer === 0) {
                    // Causa dano
                    player.vida = Math.max(0, player.vida - enemy.dano);
                    player.invulTimer = 60; // 1 segundo de invulnerabilidade
                    SoundEffects.play('hit_player');
                    
                    // Knockback no jogador
                    player.vx = (player.x > enemy.x) ? 7 : -7;
                    player.vy = -5;
                    
                    // Emite partículas de sangue/dano vermelhas do jogador
                    for (let p = 0; p < 12; p++) {
                        this.game.particulas.push({
                            x: player.x + player.width / 2,
                            y: player.y + player.height / 2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6 - 2,
                            cor: '#d50000',
                            tamanho: 3 + Math.random() * 3,
                            vida: 20 + Math.random() * 20
                        });
                    }

                    // Verifica se o jogador morreu
                    if (player.vida <= 0) {
                        player.vida = 100;
                        player.x = (Config.LARGURA_MUNDO / 2) * Config.TAM_BLOCO;
                        player.y = 0;
                        alert("Você foi derrotado! Renascendo no ponto de spawn inicial...");
                    }
                }
            }
        }
    }
}
window.WorldManager = WorldManager;
