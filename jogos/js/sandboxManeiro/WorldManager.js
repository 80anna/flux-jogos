class WorldManager {
    constructor(game) {
        this.game = game;
        this.mundo = [];
        this.drops = {};
        this.nuvens = [];

        // Inicializa nuvens
        for (let i = 0; i < 60; i++) {
            this.nuvens.push({ 
                x: Math.random() * Config.LARGURA_MUNDO * Config.TAM_BLOCO, 
                y: Math.random() * 200, 
                velocidade: 0.1 + Math.random() * 0.3, 
                tamanho: 40 + Math.random() * 60 
            });
        }
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

        // Cavernas
        for (let i = 0; i < 60; i++) {
            let cx = Math.floor(Math.random() * Config.LARGURA_MUNDO);
            let cy = 50 + Math.floor(Math.random() * 50);
            for (let passo = 0; passo < 200; passo++) {
                if (this.mundo[cx] && this.mundo[cx][cy]) this.mundo[cx][cy] = 0;
                if (this.mundo[cx + 1] && this.mundo[cx + 1][cy]) this.mundo[cx + 1][cy] = 0;
                if (this.mundo[cx] && this.mundo[cx][cy + 1]) this.mundo[cx][cy + 1] = 0;
                cx += Math.random() > 0.5 ? 1 : -1;
                cy += Math.random() > 0.5 ? 1 : -1;
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
        const idDrop = Math.random().toString(36).substr(2, 9);
        const offset = Config.TAM_BLOCO / 4;
        const novoDrop = { x: x * Config.TAM_BLOCO + offset, y: y * Config.TAM_BLOCO + offset, vy: -3, tipo: tipo };
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
                            if (vizBloco === tipoMadeira || vizBloco === tipoFolha) {
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
}
window.WorldManager = WorldManager;
