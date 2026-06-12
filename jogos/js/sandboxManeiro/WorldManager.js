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
        this.baus = {}; // { 'x,y': [null, ... 25 itens] }

        this.luzMap = [];
        this.mapaAlturaSolida = [];
        for (let x = 0; x < Config.LARGURA_MUNDO; x++) {
            this.luzMap[x] = new Float32Array(Config.ALTURA_MUNDO);
        }
    }

    gerarMundo() {
        let mapaAltura = [];
        for (let x = 0; x < Config.LARGURA_MUNDO; x++) {
            let alturaBase = 100;
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
        for (let i = 0; i < 350; i++) { // Aumentado para 350 cavernas
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 40 + Math.floor(Math.random() * (Config.ALTURA_MUNDO - 60)); // espalha mais verticalmente!
            
            let raioTudo = 1 + Math.floor(Math.random() * 4); // raio de 1 a 4 blocos
            for (let passo = 0; passo < 250; passo++) {
                // Varia o raio do túnel organicamente para criar passagens estreitas e salões gigantes
                if (passo % 10 === 0) {
                    raioTudo = Math.max(1, Math.min(5, raioTudo + (Math.random() > 0.5 ? 2 : -1))); // Variações mais bruscas
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
                
                // Movimento sinuoso (Random Walk aprimorado com mais caos)
                cx += Math.floor(Math.random() * 5) - 2;
                cy += Math.floor(Math.random() * 5) - 2;
                
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

        // Geração de Veias de Carvão no Subsolo (Clusters) - Tamanho 2x maior
        let totalVeias = Math.floor((Config.LARGURA_MUNDO * Config.ALTURA_MUNDO) / 150);
        for (let v = 0; v < totalVeias; v++) {
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 45 + Math.floor(Math.random() * (Config.ALTURA_MUNDO - 55));
            
            let tamVeia = 20 + Math.floor(Math.random() * 12); // Pelo menos 20 blocos por veia (20 a 31 blocos)
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

        // Geração de Veias de Ferro no Subsolo
        let totalVeiasFerro = Math.floor((Config.LARGURA_MUNDO * Config.ALTURA_MUNDO) / 250); // Ligeiramente mais raro que carvão
        for (let v = 0; v < totalVeiasFerro; v++) {
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 55 + Math.floor(Math.random() * (Config.ALTURA_MUNDO - 65)); // Um pouco mais profundo
            
            let tamVeia = 15 + Math.floor(Math.random() * 8); // 15 a 22 blocos
            for (let b = 0; b < tamVeia; b++) {
                if (this.mundo[cx] && this.mundo[cx][cy] === 'pedra') {
                    this.mundo[cx][cy] = 'minerio_ferro';
                }
                cx += Math.floor(Math.random() * 3) - 1;
                cy += Math.floor(Math.random() * 3) - 1;
                
                if (cx < 0) cx = 0;
                if (cx >= Config.LARGURA_MUNDO) cx = Config.LARGURA_MUNDO - 1;
                if (cy < 55) cy = 55;
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
                    let alturaTronco = 10 + Math.floor(Math.random() * 10);
                    let raioCopaBase = 4;
                    for (let t = 1; t <= alturaTronco; t++) this.mundo[x][y - t] = 'madeira';
                    let topoY = y - alturaTronco;
                    for (let fx = -raioCopaBase; fx <= raioCopaBase; fx++) {
                        for (let fy = -raioCopaBase; fy <= raioCopaBase; fy++) {
                            if (fx * fx + fy * fy <= raioCopaBase * raioCopaBase) {
                                let fxx = x + fx;
                                let fyy = topoY + fy;
                                if (this.mundo[fxx] && fyy >= 0 && fyy < Config.ALTURA_MUNDO) {
                                    if (this.mundo[fxx][fyy] === 0) {
                                        this.mundo[fxx][fyy] = 'folha';
                                    }
                                }
                            }
                        }
                    }
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
                    let h = 9 + Math.floor(Math.random() * 6); // Árvores da selva bem altas
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
                    let h = 6 + Math.floor(Math.random() * 4); // Pinheiros mais altos
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

    inicializarIluminacao() {
        // Pre-calcula a altura sólida para o céu em todo o mundo
        for (let x = 0; x < Config.LARGURA_MUNDO; x++) {
            this.recalcularAlturaSolida(x);
        }
        // Calcula a luz inicial de cada bloco
        for (let x = 0; x < Config.LARGURA_MUNDO; x++) {
            for (let y = 0; y < Config.ALTURA_MUNDO; y++) {
                this.luzMap[x][y] = this.calcularLuz(x, y);
            }
        }
    }

    recalcularAlturaSolida(x) {
        if (!this.mundo[x]) return;
        let yPrimeiroSolido = 0;
        while (yPrimeiroSolido < Config.ALTURA_MUNDO) {
            let b = this.mundo[x][yPrimeiroSolido];
            if (b !== 0 && b !== 'vidro' && Config.REGISTRO_BLOCOS[b] && Config.REGISTRO_BLOCOS[b].colisao) {
                break;
            }
            yPrimeiroSolido++;
        }
        this.mapaAlturaSolida[x] = yPrimeiroSolido;
    }

    calcularLuz(x, y) {
        const bloco = this.mundo[x] ? this.mundo[x][y] : 0;
        if (bloco === 'tocha' || bloco === 'vidro') return 0;

        let maiorLuzDia = 0;
        const raioLuz = 5;
        const inicioX = Math.max(0, x - raioLuz);
        const fimX = Math.min(Config.LARGURA_MUNDO - 1, x + raioLuz);
        const inicioY = Math.max(0, y - raioLuz);
        const fimY = Math.min(Config.ALTURA_MUNDO - 1, y + raioLuz);

        for (let tx = inicioX; tx <= fimX; tx++) {
            let yPrimeiroSolido = this.mapaAlturaSolida[tx];
            for (let ty = inicioY; ty <= fimY; ty++) {
                if (ty <= yPrimeiroSolido) {
                    let dist = Math.abs(x - tx) + Math.abs(y - ty);
                    if (dist <= raioLuz) {
                        let luz = 1.0 - (dist / (raioLuz + 1));
                        if (luz > maiorLuzDia) maiorLuzDia = luz;
                    }
                }
            }
        }

        let d = 0.95 * (1.0 - maiorLuzDia);
        if (d <= 0.01) return 0;

        let maiorLuzTocha = 0;
        const raioTocha = 8;
        const inicioBuscaX = Math.max(0, x - raioTocha);
        const fimBuscaX = Math.min(Config.LARGURA_MUNDO - 1, x + raioTocha);
        const inicioBuscaY = Math.max(0, y - raioTocha);
        const fimBuscaY = Math.min(Config.ALTURA_MUNDO - 1, y + raioTocha);

        for (let tx = inicioBuscaX; tx <= fimBuscaX; tx++) {
            for (let ty = inicioBuscaY; ty <= fimBuscaY; ty++) {
                if (this.mundo[tx] && this.mundo[tx][ty] === 'tocha') {
                    let dist = Math.sqrt(Math.pow(x - tx, 2) + Math.pow(y - ty, 2));
                    if (dist <= raioTocha) {
                        let luz = 1.0 - (dist / (raioTocha + 1));
                        if (luz > maiorLuzTocha) maiorLuzTocha = luz;
                    }
                }
            }
        }

        return Math.max(0, d * (1.0 - maiorLuzTocha));
    }

    atualizarLuzArea(centroX, centroY) {
        // Ao modificar um bloco, o mapa de altura daquela coluna pode ter mudado
        this.recalcularAlturaSolida(centroX);

        // Atualiza blocos que dependem do sol ou da tocha no raio de 8 blocos em volta da alteração
        const raio = 8;
        const inicioX = Math.max(0, centroX - raio);
        const fimX = Math.min(Config.LARGURA_MUNDO - 1, centroX + raio);
        const inicioY = Math.max(0, centroY - raio);
        const fimY = Math.min(Config.ALTURA_MUNDO - 1, centroY + raio);

        for (let x = inicioX; x <= fimX; x++) {
            for (let y = inicioY; y <= fimY; y++) {
                this.luzMap[x][y] = this.calcularLuz(x, y);
            }
        }
    }

    criarDrop(x, y, tipo) {
        let tipoDrop = tipo;
        if (tipo === 'minerio_carvao') tipoDrop = 'carvao';
        if (tipo === 'minerio_ferro') tipoDrop = 'ferro';

        if (tipo === 'folha' || tipo === 'folha_selva' || tipo === 'folha_pinheiro') {
            let rnd = Math.random();
            if (rnd <= 0.20) {
                tipoDrop = 'muda';
            } else if (rnd <= 0.25) {
                tipoDrop = 'maca';
            } else {
                return; // Folhas não dropam a si mesmas
            }
        }

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
            if (Math.random() < 0.1) {
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
                dano: 10,
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
                dano: 15,
                dropItem: 'carne_podre',
                growlTimer: Math.random() * 150
            });
            SoundEffects.play('zombie_growl');
        }
    }

    atualizarMudas() {
        if (!this.mudasPlantadas) return;
        
        let agora = Date.now();
        for (let chave in this.mudasPlantadas) {
            // 5 minutos em milissegundos = 300000
            if (agora - this.mudasPlantadas[chave] >= 300000) {
                let [strX, strY] = chave.split(',');
                let x = parseInt(strX);
                let y = parseInt(strY);

                // Verifica se o bloco ainda é uma muda e está na grama
                if (this.mundo[x] && this.mundo[x][y] === 'muda' && this.mundo[x][y + 1] === 'grama') {
                    // Substitui pela árvore
                    // A base é o bloco atual, tronco principal
                    let alturaTronco = 10 + Math.floor(Math.random() * 10);
                    let raioCopaBase = 4;
                    let tipoMadeira = 'madeira';
                    let tipoFolha = 'folha';
                    
                    // Cresce
                    for (let ty = 0; ty < alturaTronco; ty++) {
                        let troncoY = y - ty;
                        if (troncoY >= 0) this.mundo[x][troncoY] = tipoMadeira;
                    }
                    
                    let topoY = y - alturaTronco;
                    for (let fx = -raioCopaBase; fx <= raioCopaBase; fx++) {
                        for (let fy = -raioCopaBase; fy <= raioCopaBase; fy++) {
                            if (fx * fx + fy * fy <= raioCopaBase * raioCopaBase) {
                                let fxx = x + fx;
                                let fyy = topoY + fy;
                                if (fxx >= 0 && fxx < Config.LARGURA_MUNDO && fyy >= 0 && fyy < Config.ALTURA_MUNDO) {
                                    if (this.mundo[fxx][fyy] === 0) {
                                        this.mundo[fxx][fyy] = tipoFolha;
                                        // Manda os blocos atualizados se o jogo inteiro não atualizar, mas como vai ser difícil
                                        // enviar 50 blocos 1 a 1, melhor enviar o pacote INIT ou algo do tipo
                                        // mas por agora mandamos blocos individuais
                                        const pacote = { tipo: 'BLOCO', x: fxx, y: fyy, idBloco: tipoFolha };
                                        this.game.network.transmitir(pacote);
                                    }
                                }
                            }
                        }
                    }
                    // Manda o tronco
                    for (let ty = 0; ty < alturaTronco; ty++) {
                        let troncoY = y - ty;
                        if (troncoY >= 0) {
                            const pacote = { tipo: 'BLOCO', x: x, y: troncoY, idBloco: tipoMadeira };
                            this.game.network.transmitir(pacote);
                        }
                    }
                }
                
                // Remove da lista
                delete this.mudasPlantadas[chave];
            }
        }
    }

    atualizarInimigos() {
        let jogadores = this.game.player.jogadores;
        let hostId = this.game.network.meuId;

        for (let i = this.inimigos.length - 1; i >= 0; i--) {
            let enemy = this.inimigos[i];
            
            // Encontra o jogador mais próximo para IA
            let targetPlayer = null;
            let targetId = null;
            let minDist = Infinity;
            
            for (let id in jogadores) {
                let p = jogadores[id];
                let dist = Math.abs(enemy.x - p.x);
                if (dist < minDist) {
                    minDist = dist;
                    targetPlayer = p;
                    targetId = id;
                }
            }
            
            if (!targetPlayer) continue;

            // Se o inimigo estiver muito distante do alvo mais próximo (ex: > 1500px), despawna
            if (minDist > 2000) {
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

            // Movimento Horizontal e IA usando targetPlayer
            if (enemy.tipo === 'slime_azul') {
                enemy.hopTimer++;
                if (enemy.hopTimer >= 120) {
                    enemy.hopTimer = Math.random() * 20;
                    enemy.vy = -9.5 - Math.random() * 2;
                    let paraEsquerda = targetPlayer.x < enemy.x;
                    enemy.vx = paraEsquerda ? -3 : 3;
                    if (Math.abs(enemy.x - targetPlayer.x) < 800) {
                        SoundEffects.play('slime_hop');
                    }
                }
                
                enemy.x += enemy.vx;
                if (this.game.player.verificarColisao(enemy.x, enemy.y, enemy.width, enemy.height)) {
                    enemy.x -= enemy.vx;
                    enemy.vx = -enemy.vx;
                }
                
                if (enemy.vy === 0) {
                    enemy.vx *= 0.25;
                }
            } else if (enemy.tipo === 'zombie') {
                let paraEsquerda = targetPlayer.x < enemy.x;
                enemy.vx = paraEsquerda ? -1.4 : 1.4;
                
                enemy.x += enemy.vx;
                if (this.game.player.verificarColisao(enemy.x, enemy.y, enemy.width, enemy.height)) {
                    enemy.x -= enemy.vx;
                    if (enemy.vy === 0) {
                        enemy.vy = -8.5;
                    }
                }

                enemy.growlTimer = (enemy.growlTimer || 0) + 1;
                if (enemy.growlTimer >= 240 + Math.random() * 240) {
                    enemy.growlTimer = 0;
                    if (Math.abs(enemy.x - targetPlayer.x) < 800) {
                        SoundEffects.play('zombie_growl');
                    }
                }
            }

            // Colisão com TODOS os Jogadores (Dano)
            for (let id in jogadores) {
                let p = jogadores[id];
                let overlapX = Math.abs(enemy.x + enemy.width / 2 - (p.x + p.width / 2)) < (enemy.width + p.width) / 2;
                let overlapY = Math.abs(enemy.y + enemy.height / 2 - (p.y + p.height / 2)) < (enemy.height + p.height) / 2;
                
                if (overlapX && overlapY) {
                    enemy.hitCooldowns = enemy.hitCooldowns || {};
                    let now = Date.now();

                    if (id === hostId) {
                        if (p.invulTimer === 0) {
                            let danoReal = Math.max(1, enemy.dano - (p.armorDefesa || 0));
                            p.vida = Math.max(0, p.vida - danoReal);
                            p.invulTimer = 60;
                            SoundEffects.play('hit_player');
                            
                            p.vx = (p.x > enemy.x) ? 7 : -7;
                            p.vy = -5;
                            
                            for (let k = 0; k < 12; k++) {
                                this.game.particulas.push({
                                    x: p.x + p.width / 2,
                                    y: p.y + p.height / 2,
                                    vx: (Math.random() - 0.5) * 6,
                                    vy: (Math.random() - 0.5) * 6 - 2,
                                    cor: '#d50000',
                                    tamanho: 3 + Math.random() * 3,
                                    vida: 20 + Math.random() * 20
                                });
                            }

                            if (p.vida <= 0) {
                                p.vida = 100;
                                p.x = (Config.LARGURA_MUNDO / 2) * Config.TAM_BLOCO;
                                p.y = 0;
                                alert("Você foi derrotado! Renascendo no ponto de spawn inicial...");
                            }
                        }
                    } else {
                        // Para clientes, usamos um hitCooldown no lado do host para não floodar a rede
                        if (!enemy.hitCooldowns[id] || now - enemy.hitCooldowns[id] > 1000) {
                            enemy.hitCooldowns[id] = now;
                            this.game.network.transmitir({
                                tipo: 'DANO_JOGADOR',
                                idJogador: id,
                                dano: enemy.dano,
                                enemyX: enemy.x
                            });
                        }
                    }
                }
            }
        }
    }
}
window.WorldManager = WorldManager;
