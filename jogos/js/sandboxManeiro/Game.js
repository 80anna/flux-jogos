class Game {
    constructor() {
        this.canvas = document.getElementById('jogo');
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0 };
        this.musicaFundo = null;

        // Configuração do Ciclo Dia e Noite
        this.tempoMinutos = Config.HORA_INICIAL * 60; // Começa às 6:00 AM (360 minutos)
        this.lastTimeMinutesUpdate = Date.now();

        // Inicializa estrelas cintilantes para a noite
        this.estrelas = [];
        for (let i = 0; i < 120; i++) {
            this.estrelas.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height - 120),
                tamanho: 1 + Math.random() * 2,
                cintilacaoOffset: Math.random() * Math.PI * 2
            });
        }

        // Canvas de máscara de iluminação noturna (Spotlight)
        this.maskCanvas = document.createElement('canvas');
        this.maskCanvas.width = this.canvas.width;
        this.maskCanvas.height = this.canvas.height;
        this.maskCtx = this.maskCanvas.getContext('2d');

        // Buffer temporário offscreen para mascaramento de transparência em blocos escuros
        this.blockTempCanvas = document.createElement('canvas');
        this.blockTempCanvas.width = Config.TAM_BLOCO;
        this.blockTempCanvas.height = Config.TAM_BLOCO;
        this.blockTempCtx = this.blockTempCanvas.getContext('2d');

        // Canvas e contexto para iluminação suave (Smooth Lighting)
        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');

        // Lista de partículas ativas no mundo
        this.particulas = [];

        // Inicializa subsistemas
        this.textures = new TextureManager(this);
        this.inventory = new InventoryManager(this);
        this.world = new WorldManager(this);
        this.player = new PlayerManager(this);
        this.network = new NetworkManager(this);

        // Inicializações de texturas e UI
        this.textures.inicializarTexturas();
        this.inventory.renderizarInventarioUI();

        // Vincula funções globais de rede
        window.criarServidor = () => this.network.criarServidor();
        window.entrarNoMundo = () => this.network.entrarNoMundo();

        this.configurarInputs();
    }

    configurarInputs() {
        window.addEventListener('keydown', (e) => {
            if (['a', 'ArrowLeft'].includes(e.key)) this.player.teclas.a = true;
            if (['d', 'ArrowRight'].includes(e.key)) this.player.teclas.d = true;
            if (['w', 'ArrowUp', ' '].includes(e.key)) this.player.teclas.w = true;
            if (['s', 'ArrowDown'].includes(e.key)) this.player.teclas.s = true;
            if (e.key === 'Shift') this.player.teclas.shift = true;
            
            if (e.key >= '0' && e.key <= '9') {
                let num = parseInt(e.key);
                this.inventory.slotSelecionado = (num === 0) ? 9 : num - 1;
                this.inventory.renderizarInventarioUI();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (['a', 'ArrowLeft'].includes(e.key)) this.player.teclas.a = false;
            if (['d', 'ArrowRight'].includes(e.key)) this.player.teclas.d = false;
            if (['w', 'ArrowUp', ' '].includes(e.key)) this.player.teclas.w = false;
            if (['s', 'ArrowDown'].includes(e.key)) this.player.teclas.s = false;
            if (e.key === 'Shift') this.player.teclas.shift = false;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width) + this.camera.x;
            const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height) + this.camera.y;

            const gridX = Math.floor(mouseX / Config.TAM_BLOCO);
            const gridY = Math.floor(mouseY / Config.TAM_BLOCO);

            const centroJogadorX = this.player.meuJogador.x + this.player.meuJogador.width / 2;
            const centroJogadorY = this.player.meuJogador.y + this.player.meuJogador.height / 2;
            const centroAlvoX = gridX * Config.TAM_BLOCO + Config.TAM_BLOCO / 2;
            const centroAlvoY = gridY * Config.TAM_BLOCO + Config.TAM_BLOCO / 2;
            const distancia = Math.sqrt(Math.pow(centroAlvoX - centroJogadorX, 2) + Math.pow(centroAlvoY - centroJogadorY, 2));

            if (distancia > Config.ALCANCE_MINERACAO) return; 

            if (gridX >= 0 && gridX < Config.LARGURA_MUNDO && gridY >= 0 && gridY < Config.ALTURA_MUNDO) {
                let blocoAlvo = this.world.mundo[gridX][gridY];

                // Identifica se clicou em uma porta ou no topo de uma porta (2 blocos de altura)
                let ehPorta = blocoAlvo === 'porta' || blocoAlvo === 'porta_aberta';
                let ehPortaTopo = false;
                let portaX = gridX, portaY = gridY;
                
                if (!ehPorta && gridY + 1 < Config.ALTURA_MUNDO) {
                    let blocoAbaixo = this.world.mundo[gridX][gridY + 1];
                    if (blocoAbaixo === 'porta' || blocoAbaixo === 'porta_aberta') {
                        ehPortaTopo = true;
                        blocoAlvo = blocoAbaixo;
                        portaY = gridY + 1;
                    }
                }

                // Interação com porta (clique com botão direito para abrir/fechar)
                if (e.button === 2 && (ehPorta || ehPortaTopo)) {
                    let novoBloco = blocoAlvo === 'porta' ? 'porta_aberta' : 'porta';
                    this.world.mundo[portaX][portaY] = novoBloco;
                    
                    const pacote = { tipo: 'BLOCO', x: portaX, y: portaY, idBloco: novoBloco };
                    if (this.network.souHost) {
                        this.network.transmitir(pacote);
                    } else if (this.network.conexaoCliente) {
                        this.network.conexaoCliente.send(pacote);
                    }
                    return;
                }
                
                let quebrando = e.button != 2;
                
                let itemSelecionado = this.inventory.getItemSelecionado();
                let idItem = itemSelecionado ? itemSelecionado.id : null;

                let itemAtributos = idItem ? Config.ATRIBUTOS_ITENS[idItem] : null;
                let ehPicareta = itemAtributos && itemAtributos.tipo === 'picareta';
                let chave = `${portaX},${portaY}`;

                if (quebrando && blocoAlvo !== 0 && ehPicareta) {
                    // Ativa animação local de swing
                    this.player.triggerSwing();

                    // Cria partículas visuais de quebra de bloco
                    this.criarParticulas(portaX, portaY, blocoAlvo);

                    this.world.blockDamage = this.world.blockDamage || {};

                    let ehMadeiraColocada = (blocoAlvo === 'madeira' || blocoAlvo === 'madeira_selva' || blocoAlvo === 'madeira_pinheiro') && this.world.madeiraColocada.has(chave);
                    let resistencia = Config.REGISTRO_BLOCOS[blocoAlvo]?.resistencia || 1;
                    if (ehMadeiraColocada) resistencia = 1; // Madeira de construção quebra em 1 hit!
                    
                    let forca = itemAtributos.forca || 1;

                    this.world.blockDamage[chave] = (this.world.blockDamage[chave] || 0) + forca;

                    if (this.world.blockDamage[chave] >= resistencia) {
                        delete this.world.blockDamage[chave];

                        if ((blocoAlvo === 'madeira' || blocoAlvo === 'madeira_selva' || blocoAlvo === 'madeira_pinheiro') && !ehMadeiraColocada) {
                            this.world.quebrarArvoreInteira(portaX, portaY, blocoAlvo);
                        } else {
                            this.world.criarDrop(portaX, portaY, blocoAlvo);
                            this.world.mundo[portaX][portaY] = 0;
                            
                            // Remove do conjunto de madeira colocada
                            this.world.madeiraColocada.delete(chave);

                            const pacote = { tipo: 'BLOCO', x: portaX, y: portaY, idBloco: 0 };
                            if (this.network.souHost) {
                                this.network.transmitir(pacote);
                            } else if (this.network.conexaoCliente) {
                                this.network.conexaoCliente.send(pacote);
                            }

                            // Quebra plantas e decorações flutuantes diretamente acima
                            this.world.verificarQuebraPlantaAcima(portaX, portaY);
                        }
                    }
                } else if (!quebrando && blocoAlvo === 0 && idItem && Config.REGISTRO_BLOCOS[idItem]) {
                    // Previne a colocação de blocos por cima do corpo de uma porta existente
                    let blocoAbaixo = (gridY + 1 < Config.ALTURA_MUNDO) ? this.world.mundo[gridX][gridY + 1] : 0;
                    if (blocoAbaixo === 'porta' || blocoAbaixo === 'porta_aberta') {
                        return;
                    }

                    // Se for colocar porta, exige pelo menos 2 blocos verticais livres (gridY e gridY - 1)
                    if (idItem === 'porta') {
                        if (gridY - 1 < 0 || this.world.mundo[gridX][gridY - 1] !== 0) {
                            return;
                        }
                    }

                    // Ativa animação local de swing para colocação
                    this.player.triggerSwing();

                    this.world.mundo[gridX][gridY] = idItem;
                    
                    // Se o jogador colocou madeira, registra como madeira de construção colocada
                    if (idItem === 'madeira' || idItem === 'madeira_selva' || idItem === 'madeira_pinheiro') {
                        this.world.madeiraColocada.add(chave);
                    }

                    this.inventory.removerDoInventario(this.inventory.slotSelecionado, 1);
                    const pacote = { tipo: 'BLOCO', x: gridX, y: gridY, idBloco: idItem };
                    if (this.network.souHost) {
                        this.network.transmitir(pacote);
                    } else if (this.network.conexaoCliente) {
                        this.network.conexaoCliente.send(pacote);
                    }
                }
            }
        });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    obterCorBloco(tipo) {
        const cores = {
            'terra': '#5d4037',
            'grama': '#4CAF50',
            'pedra': '#757575',
            'areia': '#FFE082',
            'cacto': '#2E7D32',
            'neve': '#ECEFF1',
            'gelo': '#81D4FA',
            'tabua': '#DEB887',
            'tijolo_pedra': '#9e9e9e',
            'vidro': '#FFFFFF',
            'madeira': '#795548',
            'folha': '#2E7D32',
            'madeira_selva': '#4E342E',
            'folha_selva': '#004D40',
            'grama_alta': '#4CAF50',
            'arbusto': '#2E7D32',
            'flor_vermelha': '#E53935',
            'flor_amarela': '#FDD835',
            'madeira_pinheiro': '#37474F',
            'folha_pinheiro': '#004D40',
            'arbusto_congelado': '#00838f',
            'arbusto_seco': '#8d6e63',
            'bambu': '#4caf50',
            'arbusto_florido': '#ff4081'
        };
        return cores[tipo] || '#9e9e9e';
    }

    criarParticulas(x, y, tipo) {
        let cor = this.obterCorBloco(tipo);
        let px = x * Config.TAM_BLOCO + Config.TAM_BLOCO / 2;
        let py = y * Config.TAM_BLOCO + Config.TAM_BLOCO / 2;
        
        for (let i = 0; i < 10; i++) {
            this.particulas.push({
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 1,
                cor: cor,
                tamanho: 2 + Math.random() * 3,
                vida: 30
            });
        }
    }

    iniciarMusica() {
        if (this.musicaFundo) return; 
        
        this.musicaFundo = new Audio(Config.MUSICAS.floresta.arquivo); 
        this.musicaFundo.loop = true;
        this.musicaFundo.volume = 0.3;

        this.musicaFundo.play().catch(erro => console.log("O navegador bloqueou o áudio automático:", erro));
    }

    lerpColor(c1, c2, amt) {
        // Parse #hex para RGB
        let r1 = parseInt(c1.substring(1,3), 16);
        let g1 = parseInt(c1.substring(3,5), 16);
        let b1 = parseInt(c1.substring(5,7), 16);
        
        let r2 = parseInt(c2.substring(1,3), 16);
        let g2 = parseInt(c2.substring(3,5), 16);
        let b2 = parseInt(c2.substring(5,7), 16);
        
        let r = Math.floor(r1 + (r2 - r1) * amt);
        let g = Math.floor(g1 + (g2 - g1) * amt);
        let b = Math.floor(b1 + (b2 - b1) * amt);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    loopJogo = () => {
        // Controle de tempo robusto
        let now = Date.now();
        if (now - this.lastTimeMinutesUpdate >= Config.DURACAO_MINUTO_REAL) {
            this.tempoMinutos = (this.tempoMinutos + 1) % 1440; // 1440 minutos em um ciclo de 24h
            this.lastTimeMinutesUpdate = now;
        }

        this.player.atualizarFisica();

        // Atualização física das partículas
        this.particulas.forEach(p => {
            p.vy += 0.2; // gravidade
            p.x += p.vx;
            p.y += p.vy;
            p.vida--;
        });
        this.particulas = this.particulas.filter(p => p.vida > 0);

        if (this.network.souHost && Object.keys(this.player.jogadores).length > 1) {
            this.network.transmitir({ 
                tipo: 'ATUALIZAR_JOGADORES', 
                jogadores: this.player.jogadores 
            });
        }
        this.desenhar();
        requestAnimationFrame(this.loopJogo);
    }

    desenharFundo() {
        let H = this.tempoMinutos / 60;

        // 1. GRADIENTE DO CÉU (SKY BACKGROUND)
        const stops = [
            { h: 0.0, cTop: '#020208', cBot: '#08081a' },
            { h: 4.5, cTop: '#080515', cBot: '#150d2c' },
            { h: 6.0, cTop: '#2c0a4e', cBot: '#e65100' }, // Amanhecer laranja-escuro
            { h: 7.5, cTop: '#29b6f6', cBot: '#ffb74d' }, // Nascer do Sol
            { h: 12.0, cTop: '#0288d1', cBot: '#b3e5fc' }, // Pleno Dia
            { h: 16.5, cTop: '#0277bd', cBot: '#ff8a65' }, // Tarde
            { h: 18.0, cTop: '#311b92', cBot: '#e65100' }, // Pôr do sol
            { h: 19.5, cTop: '#1a0f30', cBot: '#0d1b2a' }, // Crepúsculo
            { h: 22.0, cTop: '#080518', cBot: '#050510' }, // Noite
            { h: 24.0, cTop: '#020208', cBot: '#08081a' }
        ];

        let idx = 0;
        for (let i = 0; i < stops.length - 1; i++) {
            if (H >= stops[i].h && H < stops[i+1].h) {
                idx = i;
                break;
            }
        }
        let amt = (H - stops[idx].h) / (stops[idx+1].h - stops[idx].h);
        let currentSkyTop = this.lerpColor(stops[idx].cTop, stops[idx+1].cTop, amt);
        let currentSkyBot = this.lerpColor(stops[idx].cBot, stops[idx+1].cBot, amt);

        let grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, currentSkyTop);
        grad.addColorStop(1, currentSkyBot);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. ESTRELAS CINTILANTES (STARS)
        let starOpacity = 0;
        if (H >= 19.5 || H <= 4.5) {
            starOpacity = 1;
        } else if (H > 4.5 && H < 6.5) {
            starOpacity = 1 - (H - 4.5) / 2;
        } else if (H > 17.5 && H < 19.5) {
            starOpacity = (H - 17.5) / 2;
        }

        if (starOpacity > 0.05) {
            this.estrelas.forEach(e => {
                let twinkle = Math.sin(Date.now() / 250 + e.cintilacaoOffset) * 0.4 + 0.6;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity * twinkle})`;
                this.ctx.fillRect(e.x, e.y, e.tamanho, e.tamanho);
            });
        }

        // 3. ÓRBITA CELESTE (SOL E LUA)
        let cx = this.canvas.width / 2;
        let cy = this.canvas.height + 100; // centro do arco deslocado para baixo
        let rx = this.canvas.width * 0.5; // Raio orbital horizontal
        let ry = cy - 120; // Garante que o pico orbital fique sempre a 120px de altura
        
        let sunX, sunY, moonX, moonY;
        
        // O dia vai de 6:00 (360 min) às 18:00 (1080 min)
        if (this.tempoMinutos >= 360 && this.tempoMinutos < 1080) {
            let t = (this.tempoMinutos - 360) / 720;
            let sunAngle = Math.PI + t * Math.PI;
            sunX = cx + Math.cos(sunAngle) * rx;
            sunY = cy + Math.sin(sunAngle) * ry;
            // A lua fica escondida embaixo do horizonte durante o dia
            moonX = -100;
            moonY = cy + 100;
        } else {
            // A noite vai de 18:00 (1080 min) às 6:00 (360 min)
            let minDesde18 = (this.tempoMinutos >= 1080) ? (this.tempoMinutos - 1080) : (this.tempoMinutos + 360);
            let t = minDesde18 / 720;
            let moonAngle = Math.PI + t * Math.PI;
            moonX = cx + Math.cos(moonAngle) * rx;
            moonY = cy + Math.sin(moonAngle) * ry;
            // O sol fica escondido embaixo do horizonte à noite
            sunX = -100;
            sunY = cy + 100;
        }

        // Renderiza Sol
        if (sunY < this.canvas.height) {
            this.ctx.save();
            let sunGrad = this.ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 28);
            sunGrad.addColorStop(0, '#FFFFFF');
            sunGrad.addColorStop(0.3, '#FFEE58');
            sunGrad.addColorStop(1, 'rgba(255, 112, 67, 0)');
            this.ctx.fillStyle = sunGrad;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Renderiza Lua
        if (moonY < this.canvas.height) {
            this.ctx.save();
            // Efeito glow luar
            let moonGrad = this.ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 22);
            moonGrad.addColorStop(0, '#FFFFFF');
            moonGrad.addColorStop(0.4, '#ECEFF1');
            moonGrad.addColorStop(1, 'rgba(144, 202, 249, 0)');
            this.ctx.fillStyle = moonGrad;
            this.ctx.beginPath();
            this.ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Desenha pequenas manchas de crateras na lua
            this.ctx.fillStyle = 'rgba(120, 144, 156, 0.45)';
            this.ctx.beginPath();
            this.ctx.arc(moonX - 5, moonY - 3, 3, 0, Math.PI * 2);
            this.ctx.arc(moonX + 3, moonY + 4, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 4. PARALAXE ENRIQUECIDA (3 CAMADAS HARMÔNICAS)
        let farMountainColor, nearMountainColor, pineColor;
        if (H >= 7.5 && H <= 16.5) { // Pleno Dia
            farMountainColor = '#90a4ae';
            nearMountainColor = '#455a64';
            pineColor = '#1b5e20';
        } else if (H >= 19.5 || H <= 4.5) { // Noite
            farMountainColor = '#151226';
            nearMountainColor = '#0b0918';
            pineColor = '#030f05';
        } else {
            // Interpolações harmônicas de transição crepuscular
            let transitionAmt = 0;
            let cFar1, cFar2, cNear1, cNear2, cPine1, cPine2;
            
            if (H > 4.5 && H < 6.0) { // Alvorecer
                transitionAmt = (H - 4.5) / 1.5;
                cFar1 = '#151226'; cFar2 = '#ab5c39';
                cNear1 = '#0b0918'; cNear2 = '#6d2d1f';
                cPine1 = '#030f05'; cPine2 = '#3e2723';
            } else if (H >= 6.0 && H < 7.5) { // Nascer do sol completo
                transitionAmt = (H - 6.0) / 1.5;
                cFar1 = '#ab5c39'; cFar2 = '#90a4ae';
                cNear1 = '#6d2d1f'; cNear2 = '#455a64';
                cPine1 = '#3e2723'; cPine2 = '#1b5e20';
            } else if (H > 16.5 && H < 18.0) { // Entardecer
                transitionAmt = (H - 16.5) / 1.5;
                cFar1 = '#90a4ae'; cFar2 = '#ab5c39';
                cNear1 = '#455a64'; cNear2 = '#6d2d1f';
                cPine1 = '#1b5e20'; cPine2 = '#3e2723';
            } else { // Crepúsculo para noite
                transitionAmt = (H - 18.0) / 1.5;
                cFar1 = '#ab5c39'; cFar2 = '#151226';
                cNear1 = '#6d2d1f'; cNear2 = '#0b0918';
                cPine1 = '#3e2723'; cPine2 = '#030f05';
            }
            
            farMountainColor = this.lerpColor(cFar1, cFar2, transitionAmt);
            nearMountainColor = this.lerpColor(cNear1, cNear2, transitionAmt);
            pineColor = this.lerpColor(cPine1, cPine2, transitionAmt);
        }

        // Camada Parallax 1: Montanhas Distantes (parallax = 0.08)
        this.ctx.fillStyle = farMountainColor;
        for (let i = 0; i < 20; i++) {
            let montanhaX = (i * 300) - this.camera.x * 0.08;
            let montanhaY = 270 - this.camera.y * 0.05;
            this.ctx.beginPath();
            this.ctx.moveTo(montanhaX, this.canvas.height);
            this.ctx.lineTo(montanhaX + 150, montanhaY);
            this.ctx.lineTo(montanhaX + 300, this.canvas.height);
            this.ctx.fill();
        }

        // Camada Parallax 2: Montanhas Próximas (parallax = 0.22)
        this.ctx.fillStyle = nearMountainColor;
        for (let i = 0; i < 25; i++) {
            let montanhaX = (i * 220) - this.camera.x * 0.22 - 50;
            let montanhaY = 310 - this.camera.y * 0.12;
            this.ctx.beginPath();
            this.ctx.moveTo(montanhaX, this.canvas.height);
            this.ctx.lineTo(montanhaX + 110, montanhaY);
            this.ctx.lineTo(montanhaX + 220, this.canvas.height);
            this.ctx.fill();
        }

        // Camada Parallax 3: Silhueta de Pinheiros (parallax = 0.45)
        this.ctx.fillStyle = pineColor;
        let arvoreLargura = 30;
        let totalArvores = Math.ceil(this.canvas.width / arvoreLargura) + 5;
        let offsetFar = - (this.camera.x * 0.45) % arvoreLargura;
        
        for (let i = -1; i < totalArvores; i++) {
            let ax = i * arvoreLargura + offsetFar;
            let ay = 650 - this.camera.y * 0.25;
            
            // Desenha triângulo duplo (estilo pinheiro pixelado)
            this.ctx.beginPath();
            this.ctx.moveTo(ax + arvoreLargura / 2, ay - 30);
            this.ctx.lineTo(ax, ay + 15);
            this.ctx.lineTo(ax + arvoreLargura, ay + 15);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.moveTo(ax + arvoreLargura / 2, ay - 15);
            this.ctx.lineTo(ax - 5, ay + 30);
            this.ctx.lineTo(ax + arvoreLargura + 5, ay + 30);
            this.ctx.fill();
            
            // Base da árvore até o fundo do canvas
            this.ctx.fillRect(ax - 5, ay + 30, arvoreLargura + 10, this.canvas.height - (ay + 30));
        }

        // 5. NUVENS DINÂMICAS DO CÉU
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        this.world.nuvens.forEach(n => {
            n.x += n.velocidade;
            if (n.x > Config.LARGURA_MUNDO * Config.TAM_BLOCO) n.x = -100;
            let renderX = n.x - this.camera.x * 0.15;
            let renderY = n.y - this.camera.y * 0.05;
            this.ctx.beginPath();
            this.ctx.arc(renderX, renderY, n.tamanho/2, 0, Math.PI*2);
            this.ctx.arc(renderX + n.tamanho/2, renderY - n.tamanho/4, n.tamanho/2.5, 0, Math.PI*2);
            this.ctx.arc(renderX + n.tamanho, renderY, n.tamanho/2.2, 0, Math.PI*2);
            this.ctx.fill();
        });
    }

    calcularEscuridaoBloco(x, y) {
        const bloco = this.world.mundo[x] ? this.world.mundo[x][y] : 0;
        if (bloco === 'tocha' || bloco === 'vidro') return 0;

        // 1. Procura por luz natural (dia) vindo de colunas abertas para o céu nos lados e em cima (raio de 5)
        let maiorLuzDia = 0;
        const raioLuz = 5;
        const inicioX = Math.max(0, x - raioLuz);
        const fimX = Math.min(Config.LARGURA_MUNDO - 1, x + raioLuz);
        const inicioY = Math.max(0, y - raioLuz);
        const fimY = Math.min(Config.ALTURA_MUNDO - 1, y + raioLuz);

        for (let tx = inicioX; tx <= fimX; tx++) {
            if (!this.world.mundo[tx]) continue;
            
            // Encontra a altura do primeiro bloco sólido que bloqueia a luz do sol nesta coluna
            let yPrimeiroSolido = 0;
            while (yPrimeiroSolido < Config.ALTURA_MUNDO) {
                let b = this.world.mundo[tx][yPrimeiroSolido];
                if (b !== 0 && b !== 'vidro' && Config.REGISTRO_BLOCOS[b] && Config.REGISTRO_BLOCOS[b].colisao) {
                    break;
                }
                yPrimeiroSolido++;
            }

            for (let ty = inicioY; ty <= fimY; ty++) {
                // Se ty estiver acima do primeiro bloco sólido, esse bloco (tx, ty) está exposto ao céu
                if (ty <= yPrimeiroSolido) {
                    let dist = Math.abs(x - tx) + Math.abs(y - ty);
                    if (dist <= raioLuz) {
                        let luz = 1.0 - (dist / (raioLuz + 1));
                        if (luz > maiorLuzDia) {
                            maiorLuzDia = luz;
                        }
                    }
                }
            }
        }

        let d = 0.95 * (1.0 - maiorLuzDia);
        if (d <= 0.01) return 0;

        // 2. Procura por tochas próximas para iluminar o local (raio de 5 blocos)
        let maiorLuzTocha = 0;
        const raioTocha = 5;
        const inicioBuscaX = Math.max(0, x - raioTocha);
        const fimBuscaX = Math.min(Config.LARGURA_MUNDO - 1, x + raioTocha);
        const inicioBuscaY = Math.max(0, y - raioTocha);
        const fimBuscaY = Math.min(Config.ALTURA_MUNDO - 1, y + raioTocha);

        for (let tx = inicioBuscaX; tx <= fimBuscaX; tx++) {
            for (let ty = inicioBuscaY; ty <= fimBuscaY; ty++) {
                if (this.world.mundo[tx] && this.world.mundo[tx][ty] === 'tocha') {
                    let dist = Math.abs(x - tx) + Math.abs(y - ty);
                    if (dist <= raioTocha) {
                        let luz = 1.0 - (dist / (raioTocha + 1));
                        if (luz > maiorLuzTocha) {
                            maiorLuzTocha = luz;
                        }
                    }
                }
            }
        }

        return Math.max(0, d * (1.0 - maiorLuzTocha));
    }

    desenhar() {
        this.desenharFundo();

        this.ctx.save();
        this.ctx.translate(Math.floor(-this.camera.x), Math.floor(-this.camera.y));

        let inicioX = Math.max(0, Math.floor(this.camera.x / Config.TAM_BLOCO));
        let fimX = Math.min(Config.LARGURA_MUNDO, Math.ceil((this.camera.x + this.canvas.width) / Config.TAM_BLOCO));
        let inicioY = Math.max(0, Math.floor(this.camera.y / Config.TAM_BLOCO) - 1);
        let fimY = Math.min(Config.ALTURA_MUNDO, Math.ceil((this.camera.y + this.canvas.height) / Config.TAM_BLOCO) + 1);

        for (let x = inicioX; x < fimX; x++) {
            for (let y = inicioY; y < fimY; y++) {
                if (this.world.mundo[x]) {
                    const bloco = this.world.mundo[x][y];
                    if (bloco !== 0 && bloco !== undefined) {
                        const tex = this.textures.get(bloco);
                        if (tex) {
                            if (bloco === 'porta' || bloco === 'porta_aberta') {
                                this.ctx.drawImage(tex, x * Config.TAM_BLOCO, (y - 1) * Config.TAM_BLOCO, Config.TAM_BLOCO, Config.TAM_BLOCO * 2);
                            } else {
                                this.ctx.drawImage(tex, x * Config.TAM_BLOCO, y * Config.TAM_BLOCO);
                            }
                        }
                    }
                }
            }
        }

        let flutuacao = Math.sin(Date.now() / 200) * 3;
        for (let id in this.world.drops) {
            let d = this.world.drops[id];
            const tex = this.textures.get(d.tipo);
            if (tex) {
                const dropSize = Config.TAM_BLOCO / 2;
                this.ctx.drawImage(tex, d.x, d.y + flutuacao, dropSize, dropSize);
            }
        }

        // Desenha partículas de quebra de bloco de forma dinâmica
        this.particulas.forEach(p => {
            this.ctx.save();
            this.ctx.fillStyle = p.cor;
            this.ctx.globalAlpha = p.vida / 30;
            this.ctx.fillRect(p.x - p.tamanho / 2, p.y - p.tamanho / 2, p.tamanho, p.tamanho);
            this.ctx.restore();
        });

        this.ctx.beginPath();
        this.ctx.arc(this.player.meuJogador.x + this.player.meuJogador.width / 2, this.player.meuJogador.y + this.player.meuJogador.height / 2, Config.ALCANCE_MINERACAO, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.player.desenharPlayers(this.ctx);

        // 4. MÁSCARA DE ILUMINAÇÃO SUAVE (SMOOTH LIGHTING OVERLAY)
        let cols = fimX - inicioX;
        let rows = fimY - inicioY;
        if (cols > 0 && rows > 0) {
            this.lightCanvas.width = cols;
            this.lightCanvas.height = rows;
            this.lightCtx.clearRect(0, 0, cols, rows);
            
            for (let cx = 0; cx < cols; cx++) {
                let worldX = inicioX + cx;
                for (let cy = 0; cy < rows; cy++) {
                    let worldY = inicioY + cy;
                    let esc = this.calcularEscuridaoBloco(worldX, worldY);
                    
                    this.lightCtx.fillStyle = `rgba(5, 5, 20, ${esc})`;
                    this.lightCtx.fillRect(cx, cy, 1, 1);
                }
            }
            
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(
                this.lightCanvas,
                inicioX * Config.TAM_BLOCO,
                inicioY * Config.TAM_BLOCO,
                cols * Config.TAM_BLOCO,
                rows * Config.TAM_BLOCO
            );
            this.ctx.restore();
        }

        this.ctx.restore();

        // 5. MÁSCARA DE CREPÚSCULO E ESCURIDÃO AMBIENTE (SUNRISE/SUNSET/NIGHT GLOW)
        let H = this.tempoMinutos / 60;
        
        // Efeito Alaranjado no Nascer/Pôr do sol
        let orangeTintOpacity = 0;
        if (H >= 5.5 && H <= 7.5) { // Nascer
            orangeTintOpacity = Math.sin((H - 5.5) / 2 * Math.PI) * 0.25;
        } else if (H >= 16.5 && H <= 18.5) { // Pôr do sol
            orangeTintOpacity = Math.sin((18.5 - H) / 2 * Math.PI) * 0.3;
        }
        if (orangeTintOpacity > 0.01) {
            this.ctx.fillStyle = `rgba(230, 81, 0, ${orangeTintOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Máscara de Escuridão Noturna com Spotlight no Player
        let darkness = 0;
        if (H >= 19.5 || H <= 4.5) {
            darkness = 0.85;
        } else if (H > 4.5 && H < 6.0) {
            darkness = 0.85 * (1 - (H - 4.5) / 1.5);
        } else if (H > 18.0 && H < 19.5) {
            darkness = 0.85 * ((H - 18.0) / 1.5);
        }

        if (darkness > 0.01) {
            let lightX = this.player.meuJogador.x + this.player.meuJogador.width / 2 - this.camera.x;
            let lightY = this.player.meuJogador.y + this.player.meuJogador.height / 2 - this.camera.y;
            
            // Limpa o canvas de máscara offscreen
            this.maskCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Preenche máscara com escuridão total da noite
            this.maskCtx.fillStyle = `rgba(5, 5, 20, ${darkness})`;
            this.maskCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Recorta o gradiente radial do spotlight na máscara (destination-out)
            this.maskCtx.save();
            this.maskCtx.globalCompositeOperation = 'destination-out';
            let grad = this.maskCtx.createRadialGradient(lightX, lightY, 15, lightX, lightY, 150);
            grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');      // Transparência total no centro
            grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');    // Meio-tom
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');      // Opacidade total nas bordas da máscara
            this.maskCtx.fillStyle = grad;
            this.maskCtx.beginPath();
            this.maskCtx.arc(lightX, lightY, 150, 0, Math.PI * 2);
            this.maskCtx.fill();
            this.maskCtx.restore();

            // Desenha a máscara por cima do canvas principal
            this.ctx.drawImage(this.maskCanvas, 0, 0);
        }

        const barX = 30;
        const barY = 30;
        const barW = 220;
        const barH = 18;
        const val = this.player.meuJogador.sprintBar; // 0 a 100

        this.ctx.save();
        
        // Sombra de texto para legibilidade premium
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 14px "Outfit", sans-serif';
        this.ctx.fillText('Stamina (SHIFT)', barX, barY - 8);
        this.ctx.shadowBlur = 0; // Desativa sombra

        // Fundo da barra (Glassmorphic dark capsule)
        this.ctx.fillStyle = 'rgba(15, 15, 25, 0.65)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(barX, barY, barW, barH, 8);
        } else {
            this.ctx.rect(barX, barY, barW, barH);
        }
        this.ctx.fill();
        this.ctx.stroke();

        // Barra preenchida
        if (val > 0) {
            let fillW = (val / 100) * (barW - 4);
            let fillX = barX + 2;
            let fillY = barY + 2;
            let fillH = barH - 4;

            let fillGrad = this.ctx.createLinearGradient(fillX, fillY, fillX + fillW, fillY);
            if (val < 25) {
                // Alerta de pouca energia (Vermelho/Rosa elétrico)
                fillGrad.addColorStop(0, '#ff4b2b');
                fillGrad.addColorStop(1, '#ff416c');
            } else {
                // Fôlego normal (Gradiente ciano/azul elétrico)
                fillGrad.addColorStop(0, '#00f2fe');
                fillGrad.addColorStop(1, '#4facfe');
            }

            this.ctx.fillStyle = fillGrad;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(fillX, fillY, fillW, fillH, 5);
            } else {
                this.ctx.rect(fillX, fillY, fillW, fillH);
            }
            this.ctx.fill();

            // Brilho/Gloss sutil na parte superior para dar profundidade 3D
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(fillX, fillY, fillW, fillH / 2, 3);
            } else {
                this.ctx.rect(fillX, fillY, fillW, fillH / 2);
            }
            this.ctx.fill();
        }
        this.ctx.restore();
    }
}
window.Game = Game;
