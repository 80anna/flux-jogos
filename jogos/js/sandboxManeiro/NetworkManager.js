class NetworkManager {
    constructor(game) {
        this.game = game;
        this.peer = new Peer({
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:stun.services.mozilla.com' }
                ]
            }
        });
        this.souHost = false;
        this.conexoesHost = [];
        this.conexaoCliente = null;
        this.meuId = null;

        this.peer.on('open', (id) => { 
            const antigoId = this.meuId;
            this.meuId = id; 

            // Se o ID temporário já tiver sido registrado, move para o ID real
            if (this.game.player.jogadores[antigoId]) {
                delete this.game.player.jogadores[antigoId];
            }
            if (this.game.player.jogadores['host_temp']) {
                delete this.game.player.jogadores['host_temp'];
            }
            this.game.player.jogadores[id] = this.game.player.meuJogador;

            // Atualiza a interface
            const meuIdEl = document.getElementById('meu-id');
            if (meuIdEl && this.souHost) {
                meuIdEl.innerText = id;
            }
        });
    }

    habilitarUIJogando() {
        this.game.player.meuJogador.nome = document.getElementById('nome-jogador').value || 'Jogador';
        document.getElementById('menu-inicial').style.display = 'none';
        document.getElementById('info-rede').style.display = 'flex';
        
        document.getElementById('painel-inventario').style.display = 'flex';
        document.getElementById('painel-crafting').style.display = 'flex';
        
        this.game.iniciarMusica();
        this.game.inventory.renderizarCraftingUI();
    }

    criarServidor() {
        this.souHost = true;
        this.game.world.gerarMundo();
        this.game.world.inicializarIluminacao();

        let centroX = Math.floor(Config.LARGURA_MUNDO / 2);
        for (let y = 0; y < Config.ALTURA_MUNDO; y++) {
            if (this.game.world.mundo[centroX][y] !== 0) { 
                this.game.player.meuJogador.y = (y - 2) * Config.TAM_BLOCO; 
                break; 
            }
        }
        
        const idAtual = this.meuId || 'host_temp';
        this.game.player.jogadores[idAtual] = this.game.player.meuJogador;

        this.habilitarUIJogando();
        document.getElementById('meu-id').innerText = this.meuId || "Gerando...";

        this.peer.on('connection', (conn) => {
            this.conexoesHost.push(conn);
            conn.on('open', () => {
                conn.send({ 
                    tipo: 'INIT', 
                    mundo: this.game.world.mundo, 
                    jogadores: this.game.player.jogadores, 
                    drops: this.game.world.drops,
                    tempoMinutos: this.game.tempoMinutos,
                    inimigos: this.game.world.inimigos,
                    baus: this.game.world.baus,
                    mudasPlantadas: this.game.world.mudasPlantadas
                });
                document.getElementById('qtd-jogadores').innerText = this.conexoesHost.length + 1;
            });
            conn.on('data', this.gerenciarDadosRede);
            conn.on('close', () => {
                delete this.game.player.jogadores[conn.peer];
                this.conexoesHost = this.conexoesHost.filter(c => c.peer !== conn.peer);
                document.getElementById('qtd-jogadores').innerText = this.conexoesHost.length + 1;
                this.transmitir({ 
                    tipo: 'ATUALIZAR_JOGADORES', 
                    jogadores: this.game.player.jogadores 
                });
            });
        });
        this.game.loopJogo();
    }

    entrarNoMundo() {
        const hostId = document.getElementById('id-host').value;
        if (!hostId) return;
        this.conexaoCliente = this.peer.connect(hostId);

        this.conexaoCliente.on('open', () => {
            this.habilitarUIJogando();
            document.getElementById('meu-id').innerText = "Conectado!";
            document.getElementById('qtd-jogadores').parentElement.style.display = 'none';
        });
        this.conexaoCliente.on('data', this.gerenciarDadosRede);
    }

    transmitir(dados, ignorarId = null) {
        this.conexoesHost.forEach(conn => { 
            if (conn.peer !== ignorarId) conn.send(dados); 
        });
    }

    gerenciarDadosRede = (dados) => {
        if (dados.tipo === 'INIT') {
            this.game.world.mundo = dados.mundo;
            this.game.player.jogadores = dados.jogadores;
            this.game.world.drops = dados.drops || {};
            if (dados.tempoMinutos !== undefined) this.game.tempoMinutos = dados.tempoMinutos;
            if (dados.inimigos !== undefined) this.game.world.inimigos = dados.inimigos;
            if (dados.baus !== undefined) this.game.world.baus = dados.baus;
            if (dados.mudasPlantadas !== undefined) this.game.world.mudasPlantadas = dados.mudasPlantadas;
            const keys = Object.keys(this.game.player.jogadores);
            if (keys.length > 0) {
                this.game.player.meuJogador.x = this.game.player.jogadores[keys[0]].x;
                this.game.player.meuJogador.y = this.game.player.jogadores[keys[0]].y - 40;
            }
            this.game.player.jogadores[this.meuId] = this.game.player.meuJogador;
            this.game.world.inicializarIluminacao();
            this.game.loopJogo();
        }
        if (dados.tipo === 'ATUALIZAR_TEMPO') {
            this.game.tempoMinutos = dados.tempoMinutos;
        }
        if (dados.tipo === 'ATUALIZAR_INIMIGOS') {
            this.game.world.inimigos = dados.inimigos;
        }
        if (dados.tipo === 'ATUALIZAR_JOGADORES') {
            this.game.player.jogadores = dados.jogadores;
            this.game.player.jogadores[this.meuId] = this.game.player.meuJogador;
        }
        if (dados.tipo === 'MOVER' && this.souHost) {
            this.game.player.jogadores[dados.id] = dados.jogador;
            this.transmitir({ 
                tipo: 'ATUALIZAR_JOGADORES', 
                jogadores: this.game.player.jogadores 
            }, null);
        }
        if (dados.tipo === 'BLOCO') {
            if (this.game.world.mundo[dados.x]) {
                this.game.world.mundo[dados.x][dados.y] = dados.idBloco;
                const chave = `${dados.x},${dados.y}`;
                if (dados.idBloco === 'madeira' || dados.idBloco === 'madeira_selva' || dados.idBloco === 'madeira_pinheiro') {
                    this.game.world.madeiraColocada.add(chave);
                } else {
                    this.game.world.madeiraColocada.delete(chave);
                }

                if (dados.idBloco === 'muda' && this.souHost) {
                    this.game.world.mudasPlantadas = this.game.world.mudasPlantadas || {};
                    this.game.world.mudasPlantadas[chave] = Date.now();
                }
                
                this.game.world.atualizarLuzArea(dados.x, dados.y);
            }
            if (this.souHost) this.transmitir(dados);
        }
        if (dados.tipo === 'CRIAR_DROP') {
            this.game.world.drops[dados.idDrop] = dados.drop;
            if (this.souHost) this.transmitir(dados);
        }
        if (dados.tipo === 'REMOVER_DROP') {
            delete this.game.world.drops[dados.idDrop];
            if (this.souHost) this.transmitir(dados);
        }
        if (dados.tipo === 'DANO_INIMIGO' && this.souHost) {
            let enemy = this.game.world.inimigos[dados.indexInimigo];
            if (enemy) {
                enemy.vida -= dados.dano;
                if (enemy.vida <= 0) {
                    let dropGridX = Math.floor(dados.x / Config.TAM_BLOCO);
                    let dropGridY = Math.floor(dados.y / Config.TAM_BLOCO);
                    this.game.world.criarDrop(dropGridX, dropGridY, enemy.dropItem);
                    this.game.world.inimigos.splice(dados.indexInimigo, 1);
                }
                // Transmite IMEDIATAMENTE a atualização de vida/morte para todos
                this.transmitir({ tipo: 'ATUALIZAR_INIMIGOS', inimigos: this.game.world.inimigos });
            }
        }
        if (dados.tipo === 'ATUALIZAR_BAU') {
            this.game.world.baus[dados.chave] = dados.inventarioBau;
            if (this.souHost) {
                // Repassa para os outros
                this.transmitir(dados);
            }
            // Se estou com este baú aberto, atualizo a UI
            if (this.game.inventory.bauAbertoChave === dados.chave) {
                this.game.inventory.renderizarBauUI();
            }
        }
    }
}
window.NetworkManager = NetworkManager;
