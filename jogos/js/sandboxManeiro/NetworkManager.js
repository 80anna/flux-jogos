class NetworkManager {
    constructor(game) {
        this.game = game;
        this.peer = new Peer();
        this.souHost = false;
        this.conexoesHost = [];
        this.conexaoCliente = null;
        this.meuId = null;

        this.peer.on('open', (id) => { 
            this.meuId = id; 
        });
    }

    habilitarUIJogando() {
        this.game.player.meuJogador.nome = document.getElementById('nome-jogador').value || 'Jogador';
        document.getElementById('menu-inicial').style.display = 'none';
        document.getElementById('info-rede').style.display = 'flex';
        
        document.getElementById('painel-inventario').style.display = 'grid';
        document.getElementById('painel-crafting').style.display = 'flex';
        
        this.game.iniciarMusica();
        this.game.inventory.renderizarCraftingUI();
    }

    criarServidor() {
        this.souHost = true;
        this.game.world.gerarMundo();

        let centroX = Math.floor(Config.LARGURA_MUNDO / 2);
        for (let y = 0; y < Config.ALTURA_MUNDO; y++) {
            if (this.game.world.mundo[centroX][y] !== 0) { 
                this.game.player.meuJogador.y = (y - 2) * Config.TAM_BLOCO; 
                break; 
            }
        }
        this.game.player.jogadores[this.meuId] = this.game.player.meuJogador;

        this.habilitarUIJogando();
        document.getElementById('meu-id').innerText = this.meuId;

        this.peer.on('connection', (conn) => {
            this.conexoesHost.push(conn);
            conn.on('open', () => {
                conn.send({ 
                    tipo: 'INIT', 
                    mundo: this.game.world.mundo, 
                    jogadores: this.game.player.jogadores, 
                    drops: this.game.world.drops 
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
            const keys = Object.keys(this.game.player.jogadores);
            if (keys.length > 0) {
                this.game.player.meuJogador.x = this.game.player.jogadores[keys[0]].x;
                this.game.player.meuJogador.y = this.game.player.jogadores[keys[0]].y - 40;
            }
            this.game.player.jogadores[this.meuId] = this.game.player.meuJogador;
            this.game.loopJogo();
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
    }
}
window.NetworkManager = NetworkManager;
