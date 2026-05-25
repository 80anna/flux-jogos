class Config {
    static TAM_BLOCO = 24;
    static LARGURA_MUNDO = 2000;
    static ALTURA_MUNDO = 1000;
    static ALCANCE_MINERACAO = 8 * 24; // 8 * TAM_BLOCO (alcance aumentado)
    static MAX_STACK = 9999;
    static ASSET_PATH = 'assets/sandboxManeiro/';

    // Configurações do Ciclo Dia e Noite
    static DURACAO_MINUTO_REAL = 1000; // 1 minuto do jogo = 1 segundo real (24 minutos reais = 24 horas do jogo)
    static HORA_INICIAL = 6; // O jogo inicia às 6:00 (amanhecer)

    static COLUNAS_INV = 5;
    static LINHAS_INV = 10;
    static TOTAL_SLOTS = 50; // COLUNAS_INV * LINHAS_INV

    static REGISTRO_BLOCOS = {
        'terra': { colisao: true, resistencia: 15 },
        'grama': { colisao: true, resistencia: 20 },
        'pedra': { colisao: true, resistencia: 25 },
        'areia': { colisao: true, resistencia: 15 },
        'cacto': { colisao: false, resistencia: 15 },
        'neve': { colisao: true, resistencia: 15 },
        'gelo': { colisao: true, resistencia: 15 },
        'tabua': { colisao: true, resistencia: 15 },
        'tijolo_pedra': { colisao: true, resistencia: 25 },
        'vidro': { colisao: true, resistencia: 15 },
        'madeira': { colisao: false, resistencia: 25 },
        'madeira_selva': { colisao: false, resistencia: 25 },
        'folha': { colisao: false, resistencia: 10 },
        'folha_selva': { colisao: false, resistencia: 10 },
        // Novas decorações e flora avançada (sem colisão)
        'grama_alta': { colisao: false, resistencia: 10 },
        'arbusto': { colisao: false, resistencia: 10 },
        'flor_vermelha': { colisao: false, resistencia: 10 },
        'flor_amarela': { colisao: false, resistencia: 10 },
        'madeira_pinheiro': { colisao: false, resistencia: 25 },
        'folha_pinheiro': { colisao: false, resistencia: 10 },
        'arbusto_congelado': { colisao: false, resistencia: 10 },
        'arbusto_seco': { colisao: false, resistencia: 10 },
        'bambu': { colisao: false, resistencia: 10 },
        'arbusto_florido': { colisao: false, resistencia: 10 },
        // Blocos novos
        'minerio_carvao': { colisao: true, resistencia: 30 },
        'tocha': { colisao: false, resistencia: 5 },
        // Blocos de Decoração e Plataformas
        'cadeira': { colisao: false, resistencia: 5 },
        'mesa': { colisao: false, resistencia: 5 },
        'porta': { colisao: true, resistencia: 5 },
        'porta_aberta': { colisao: false, resistencia: 5 },
        'plataforma_madeira': { colisao: false, resistencia: 5 },
        'lama': { colisao: true, resistencia: 15 },
        'granito': { colisao: true, resistencia: 30 }
    };

    static ATRIBUTOS_ITENS = {
        'picareta_cobre': { tipo: 'picareta', forca: 7 },
        'espada_cobre': { tipo: 'espada', dano: 10 }
    };

    static MUSICAS = {
        'floresta': {
            'arquivo': 'assets/sandboxManeiro/musica_main.mp3',
            'titulo': 'Floresta'
        },
    };

    static RECEITAS = [
        { resultado: 'tabua', qtdResultado: 4, label: '4 Tábuas', reqs: [{ id: 'madeira', qtd: 1, label: '1 Madeira' }] },
        { resultado: 'tijolo_pedra', qtdResultado: 4, label: '4 Tijolos', reqs: [{ id: 'pedra', qtd: 4, label: '4 Pedras' }] },
        { resultado: 'vidro', qtdResultado: 1, label: '1 Vidro', reqs: [{ id: 'areia', qtd: 2, label: '1 Areia' }] },
        { resultado: 'gelo', qtdResultado: 1, label: '1 Gelo', reqs: [{ id: 'neve', qtd: 4, label: '4 Neves' }] },
        { resultado: 'tocha', qtdResultado: 4, label: '4 Tochas', reqs: [{ id: 'carvao', qtd: 1, label: '1 Carvão' }, { id: 'tabua', qtd: 1, label: '1 Tábua' }] },
        { resultado: 'tocha', qtdResultado: 4, label: '4 Tochas (Gel)', reqs: [{ id: 'gel', qtd: 1, label: '1 Gel' }, { id: 'tabua', qtd: 1, label: '1 Tábua' }] },
        { resultado: 'cadeira', qtdResultado: 1, label: '1 Cadeira', reqs: [{ id: 'tabua', qtd: 4, label: '4 Tábuas' }] },
        { resultado: 'mesa', qtdResultado: 1, label: '1 Mesa', reqs: [{ id: 'tabua', qtd: 6, label: '6 Tábuas' }] },
        { resultado: 'porta', qtdResultado: 1, label: '1 Porta', reqs: [{ id: 'tabua', qtd: 6, label: '6 Tábuas' }] },
        { resultado: 'plataforma_madeira', qtdResultado: 4, label: '4 Plataformas', reqs: [{ id: 'tabua', qtd: 2, label: '2 Tábuas' }] }
    ];
}
// Vincula ao escopo global explicitamente
window.Config = Config;

class SoundEffects {
    static ctx = null;

    static init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
        }
    }

    static play(type) {
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        try {
            switch (type) {
                case 'hit_enemy':
                    this.synthHitEnemy();
                    break;
                case 'hit_player':
                    this.synthHitPlayer();
                    break;
                case 'break_block':
                    this.synthBreakBlock();
                    break;
                case 'place_block':
                    this.synthPlaceBlock();
                    break;
                case 'jump':
                    this.synthJump();
                    break;
                case 'door':
                    this.synthDoor();
                    break;
                case 'craft':
                    this.synthCraft();
                    break;
                case 'collect':
                    this.synthCollect();
                    break;
                case 'walk':
                    this.synthWalk();
                    break;
                case 'land':
                    this.synthLand();
                    break;
                case 'slime_hop':
                    this.synthSlimeHop();
                    break;
                case 'zombie_growl':
                    this.synthZombieGrowl();
                    break;
            }
        } catch (e) {
            console.error("Erro ao reproduzir áudio procedural:", e);
        }
    }

    static synthHitEnemy() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.65, this.ctx.currentTime); // volume aumentado de 0.3
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    static synthHitPlayer() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime); // volume aumentado de 0.4
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    static synthBreakBlock() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.55, this.ctx.currentTime); // volume aumentado de 0.25
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    static synthPlaceBlock() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.45, this.ctx.currentTime); // volume aumentado de 0.2
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    static synthJump() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.45, this.ctx.currentTime); // volume aumentado de 0.2
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    static synthDoor() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.setValueAtTime(220, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime); // volume aumentado de 0.25
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
    }

    static synthCraft() {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(330, this.ctx.currentTime); // Mi
        osc1.frequency.setValueAtTime(440, this.ctx.currentTime + 0.1); // Lá
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(523.25, this.ctx.currentTime + 0.1); // Dó
        
        gain.gain.setValueAtTime(0.55, this.ctx.currentTime); // volume aumentado de 0.25
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.start();
        osc2.start(this.ctx.currentTime + 0.1);
        osc1.stop(this.ctx.currentTime + 0.35);
        osc2.stop(this.ctx.currentTime + 0.35);
    }

    static synthCollect() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // Ré
        osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // Lá
        
        gain.gain.setValueAtTime(0.45, this.ctx.currentTime); // volume aumentado de 0.2
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
    }

    static synthWalk() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime); // Passos sutis para não enjoar
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    static synthLand() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.18);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
    }

    static synthSlimeHop() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.14);
        
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.14);
    }

    static synthZombieGrowl() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.45);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.55, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
    }
}
window.SoundEffects = SoundEffects;