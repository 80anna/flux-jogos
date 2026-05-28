class InventoryManager {
    constructor(game) {
        this.game = game;
        this.inventario = new Array(Config.TOTAL_SLOTS).fill(null);
        this.slotSelecionado = 0;
        
        // Inicializa itens iniciais
        this.inventario[0] = { id: 'picareta_cobre', quantidade: 1 };
        this.inventario[1] = { id: 'espada_cobre', quantidade: 1 };
        this.inventario[2] = { id: 'tocha', quantidade: 10 };

        // Inicializa ou reaproveita o elemento de tooltip no DOM
        this.tooltip = document.getElementById('inventory-tooltip');
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'inventory-tooltip';
            document.body.appendChild(this.tooltip);
        }
    }

    renderizarInventarioUI() {
        const painel = document.getElementById('painel-inventario');
        if (!painel) return;
        painel.innerHTML = '';
        
        for (let i = 0; i < Config.TOTAL_SLOTS; i++) {
            let slotDiv = document.createElement('div');
            slotDiv.className = 'slot-inv';
            if (i === this.slotSelecionado) slotDiv.classList.add('selecionado');
            
            if (i < 10) {
                slotDiv.onclick = () => { 
                    this.slotSelecionado = i; 
                    this.renderizarInventarioUI(); 
                };
            }

            let item = this.inventario[i];
            if (item) {
                const tex = this.game.textures.get(item.id);
                if (tex) {
                    let itemCanvas = document.createElement('canvas');
                    itemCanvas.width = tex.width;
                    itemCanvas.height = tex.height;
                    let itemCtx = itemCanvas.getContext('2d');
                    itemCtx.drawImage(tex, 0, 0);
                    itemCanvas.className = 'item-img-inv';
                    slotDiv.appendChild(itemCanvas);
                }
                if (item.id !== 'picareta_cobre') {
                    let contador = document.createElement('span');
                    contador.className = 'contador-inv';
                    contador.innerText = item.quantidade;
                    slotDiv.appendChild(contador);
                }
            }

            // Garante que o hotkey span seja inserido por último (por cima do item)
            if (i < 10) {
                let hotkey = document.createElement('span');
                hotkey.className = 'hotkey-inv';
                hotkey.innerText = (i === 9) ? '0' : (i + 1);
                slotDiv.appendChild(hotkey);
            }

            // Configura o arrastar e soltar (Drag and Drop)
            slotDiv.draggable = !!item;

            // Adiciona eventos do Tooltip se o slot contiver um item
            if (item) {
                slotDiv.addEventListener('mouseenter', (e) => this.mostrarTooltip(e, item.id, item.quantidade));
                slotDiv.addEventListener('mousemove', (e) => this.posicionarTooltip(e));
                slotDiv.addEventListener('mouseleave', () => this.ocultarTooltip());
            }

            slotDiv.addEventListener('dragstart', (e) => {
                this.ocultarTooltip(); // Oculta o tooltip ao arrastar
                e.dataTransfer.setData('text/plain', JSON.stringify({ tipo: 'inv', idx: i }));
                slotDiv.classList.add('arrastando');
            });

            slotDiv.addEventListener('dragend', () => {
                slotDiv.classList.remove('arrastando');
            });

            slotDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            slotDiv.addEventListener('dragenter', (e) => {
                e.preventDefault();
                slotDiv.classList.add('drag-over');
            });

            slotDiv.addEventListener('dragleave', () => {
                slotDiv.classList.remove('drag-over');
            });

            slotDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                slotDiv.classList.remove('drag-over');
                try {
                    let dados = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (dados.tipo === 'inv' && dados.idx !== i) {
                        const temp = this.inventario[dados.idx];
                        this.inventario[dados.idx] = this.inventario[i];
                        this.inventario[i] = temp;
                        this.renderizarInventarioUI();
                    } else if (dados.tipo === 'bau' && this.bauAbertoChave) {
                        let inventarioBau = this.game.world.baus[this.bauAbertoChave];
                        if (inventarioBau) {
                            const temp = inventarioBau[dados.idx];
                            inventarioBau[dados.idx] = this.inventario[i];
                            this.inventario[i] = temp;
                            this.renderizarInventarioUI();
                            this.renderizarBauUI();
                            
                            const pacote = { tipo: 'ATUALIZAR_BAU', chave: this.bauAbertoChave, inventarioBau: inventarioBau };
                            if (this.game.network.souHost) {
                                this.game.network.transmitir(pacote);
                            } else if (this.game.network.conexaoCliente) {
                                this.game.network.conexaoCliente.send(pacote);
                            }
                        }
                    }
                } catch(err) {}
            });

            painel.appendChild(slotDiv);
        }
        this.renderizarCraftingUI();
    }

    renderizarCraftingUI() {
        const lista = document.getElementById('lista-crafting');
        if (!lista) return;
        lista.innerHTML = '';
        let mostrouAlgo = false;

        Config.RECEITAS.forEach(receita => {
            // Verifica se o jogador possui TODOS os ingredientes da receita
            let temTudo = receita.reqs.every(req => this.contarItemNoInventario(req.id) >= req.qtd);
            
            if (temTudo) {
                mostrouAlgo = true;
                let btn = document.createElement('button');
                btn.className = 'btn-craft';
                
                // 1. Container de Ingredientes
                let divIngredientes = document.createElement('div');
                divIngredientes.className = 'craft-ingredients';
                
                receita.reqs.forEach(req => {
                    let slot = document.createElement('div');
                    slot.className = 'craft-item-slot';
                    
                    slot.addEventListener('mouseenter', (e) => this.mostrarTooltip(e, req.id, req.qtd));
                    slot.addEventListener('mousemove', (e) => this.posicionarTooltip(e));
                    slot.addEventListener('mouseleave', () => this.ocultarTooltip());
                    
                    const tex = this.game.textures.get(req.id);
                    if (tex) {
                        let canvas = document.createElement('canvas');
                        canvas.width = tex.width;
                        canvas.height = tex.height;
                        let ctx = canvas.getContext('2d');
                        ctx.drawImage(tex, 0, 0);
                        slot.appendChild(canvas);
                    }
                    
                    let spanCount = document.createElement('span');
                    spanCount.className = 'craft-item-count';
                    spanCount.innerText = req.qtd;
                    slot.appendChild(spanCount);
                    
                    divIngredientes.appendChild(slot);
                });
                
                btn.appendChild(divIngredientes);
                
                // 2. Seta Indicadora
                let seta = document.createElement('span');
                seta.className = 'craft-arrow';
                seta.innerText = '➔';
                btn.appendChild(seta);
                
                // 3. Container de Resultado
                let divResultado = document.createElement('div');
                divResultado.className = 'craft-ingredients';
                
                let resultSlot = document.createElement('div');
                resultSlot.className = 'craft-item-slot';
                resultSlot.style.borderColor = '#ffeb3b'; // Borda amarela destacando o resultado
                
                resultSlot.addEventListener('mouseenter', (e) => this.mostrarTooltip(e, receita.resultado, receita.qtdResultado));
                resultSlot.addEventListener('mousemove', (e) => this.posicionarTooltip(e));
                resultSlot.addEventListener('mouseleave', () => this.ocultarTooltip());
                
                const resTex = this.game.textures.get(receita.resultado);
                if (resTex) {
                    let resCanvas = document.createElement('canvas');
                    resCanvas.width = resTex.width;
                    resCanvas.height = resTex.height;
                    let resCtx = resCanvas.getContext('2d');
                    resCtx.drawImage(resTex, 0, 0);
                    resultSlot.appendChild(resCanvas);
                }
                
                let resSpanCount = document.createElement('span');
                resSpanCount.className = 'craft-item-count';
                resSpanCount.innerText = receita.qtdResultado;
                resultSlot.appendChild(resSpanCount);
                
                divResultado.appendChild(resultSlot);
                btn.appendChild(divResultado);
                
                btn.onclick = () => this.craftar(receita.reqs, receita.resultado, receita.qtdResultado);
                lista.appendChild(btn);
            }
        });

        if (!mostrouAlgo) {
            lista.innerHTML = '<span class="msg-vazio">Sem materiais...</span>';
        }
    }

    adicionarAoInventario(id, quantidade) {
        for (let i = 0; i < Config.TOTAL_SLOTS; i++) {
            if (this.inventario[i] && this.inventario[i].id === id && this.inventario[i].quantidade < Config.MAX_STACK) {
                let espacoLivre = Config.MAX_STACK - this.inventario[i].quantidade;
                if (quantidade <= espacoLivre) {
                    this.inventario[i].quantidade += quantidade;
                    this.renderizarInventarioUI();
                    return true;
                } else {
                    this.inventario[i].quantidade = Config.MAX_STACK;
                    quantidade -= espacoLivre;
                }
            }
        }
        for (let i = 0; i < Config.TOTAL_SLOTS; i++) {
            if (!this.inventario[i]) {
                this.inventario[i] = { id: id, quantidade: quantidade };
                this.renderizarInventarioUI();
                return true;
            }
        }
        return false;
    }

    removerDoInventario(index, quantidade) {
        if (this.inventario[index]) {
            this.inventario[index].quantidade -= quantidade;
            if (this.inventario[index].quantidade <= 0) this.inventario[index] = null;
            this.renderizarInventarioUI();
        }
    }

    contarItemNoInventario(id) {
        return this.inventario.reduce((acc, slot) => (slot && slot.id === id) ? acc + slot.quantidade : acc, 0);
    }

    consumirItensParaCrafting(id, quantidade) {
        let restante = quantidade;
        for (let i = 0; i < Config.TOTAL_SLOTS && restante > 0; i++) {
            if (this.inventario[i] && this.inventario[i].id === id) {
                if (this.inventario[i].quantidade >= restante) {
                    this.inventario[i].quantidade -= restante;
                    restante = 0;
                    if (this.inventario[i].quantidade === 0) this.inventario[i] = null;
                } else {
                    restante -= this.inventario[i].quantidade;
                    this.inventario[i] = null;
                }
            }
        }
        this.renderizarInventarioUI();
    }

    craftar(reqs, resultado, qtdResultado) {
        let temTudo = reqs.every(req => this.contarItemNoInventario(req.id) >= req.qtd);
        if (temTudo) {
            reqs.forEach(req => {
                this.consumirItensParaCrafting(req.id, req.qtd);
            });
            this.adicionarAoInventario(resultado, qtdResultado);
            SoundEffects.play('craft');
        }
    }

    abrirBau(x, y) {
        let chave = `${x},${y}`;
        if (!this.game.world.baus[chave]) {
            this.game.world.baus[chave] = new Array(25).fill(null);
        }
        this.bauAbertoChave = chave;
        let painel = document.getElementById('painel-bau');
        if(painel) painel.style.display = 'flex';
        this.renderizarBauUI();
        SoundEffects.play('door'); // som genérico
    }

    fecharBau() {
        this.bauAbertoChave = null;
        let painel = document.getElementById('painel-bau');
        if(painel) painel.style.display = 'none';
        SoundEffects.play('door');
    }

    renderizarBauUI() {
        if (!this.bauAbertoChave) return;
        const grid = document.getElementById('grid-bau');
        if (!grid) return;
        grid.innerHTML = '';

        let inventarioBau = this.game.world.baus[this.bauAbertoChave];
        if (!inventarioBau) return;

        for (let i = 0; i < 25; i++) {
            let slotDiv = document.createElement('div');
            slotDiv.className = 'slot-inv';

            let item = inventarioBau[i];
            if (item) {
                const tex = this.game.textures.get(item.id);
                if (tex) {
                    let itemCanvas = document.createElement('canvas');
                    itemCanvas.width = tex.width;
                    itemCanvas.height = tex.height;
                    let itemCtx = itemCanvas.getContext('2d');
                    itemCtx.drawImage(tex, 0, 0);
                    itemCanvas.className = 'item-img-inv';
                    slotDiv.appendChild(itemCanvas);
                }
                if (item.id !== 'picareta_cobre') {
                    let contador = document.createElement('span');
                    contador.className = 'contador-inv';
                    contador.innerText = item.quantidade;
                    slotDiv.appendChild(contador);
                }
            }

            slotDiv.draggable = !!item;

            if (item) {
                slotDiv.addEventListener('mouseenter', (e) => this.mostrarTooltip(e, item.id, item.quantidade));
                slotDiv.addEventListener('mousemove', (e) => this.posicionarTooltip(e));
                slotDiv.addEventListener('mouseleave', () => this.ocultarTooltip());
            }

            slotDiv.addEventListener('dragstart', (e) => {
                this.ocultarTooltip();
                e.dataTransfer.setData('text/plain', JSON.stringify({ tipo: 'bau', idx: i }));
                slotDiv.classList.add('arrastando');
            });

            slotDiv.addEventListener('dragend', () => {
                slotDiv.classList.remove('arrastando');
            });

            slotDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            slotDiv.addEventListener('dragenter', (e) => {
                e.preventDefault();
                slotDiv.classList.add('drag-over');
            });

            slotDiv.addEventListener('dragleave', () => {
                slotDiv.classList.remove('drag-over');
            });

            slotDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                slotDiv.classList.remove('drag-over');
                try {
                    let dados = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (dados.tipo === 'bau' && dados.idx !== i) {
                        const temp = inventarioBau[dados.idx];
                        inventarioBau[dados.idx] = inventarioBau[i];
                        inventarioBau[i] = temp;
                        this.renderizarBauUI();
                        
                        const pacote = { tipo: 'ATUALIZAR_BAU', chave: this.bauAbertoChave, inventarioBau: inventarioBau };
                        if (this.game.network.souHost) {
                            this.game.network.transmitir(pacote);
                        } else if (this.game.network.conexaoCliente) {
                            this.game.network.conexaoCliente.send(pacote);
                        }
                    } else if (dados.tipo === 'inv') {
                        const temp = this.inventario[dados.idx];
                        this.inventario[dados.idx] = inventarioBau[i];
                        inventarioBau[i] = temp;
                        this.renderizarInventarioUI();
                        this.renderizarBauUI();
                        
                        const pacote = { tipo: 'ATUALIZAR_BAU', chave: this.bauAbertoChave, inventarioBau: inventarioBau };
                        if (this.game.network.souHost) {
                            this.game.network.transmitir(pacote);
                        } else if (this.game.network.conexaoCliente) {
                            this.game.network.conexaoCliente.send(pacote);
                        }
                    }
                } catch(err) {}
            });

            grid.appendChild(slotDiv);
        }
    }

    getItemSelecionado() {
        return this.inventario[this.slotSelecionado];
    }

    mostrarTooltip(e, idItem, quantidade = null) {
        if (!idItem) return;

        let label = idItem.replace(/_/g, ' ');
        let tipo = "Material";
        let statsHtml = "";
        let desc = "";

        // Determina os atributos do item
        let attrs = Config.ATRIBUTOS_ITENS[idItem];
        let registro = Config.REGISTRO_BLOCOS[idItem];

        if (attrs) {
            if (attrs.tipo === 'espada') {
                tipo = "⚔️ Arma de Combate";
                statsHtml += `<div class="tooltip-stat">⚔️ Dano: <strong>${attrs.dano} HP</strong></div>`;
                statsHtml += `<div class="tooltip-stat">⏱️ Cooldown: <strong>0.58s</strong></div>`;
                desc = "Uma lâmina afiada perfeita para fatiar slimes e repelir zumbis em área.";
            } else if (attrs.tipo === 'picareta') {
                tipo = "⛏️ Ferramenta";
                statsHtml += `<div class="tooltip-stat">⛏️ Força: <strong>${attrs.forca}</strong></div>`;
                statsHtml += `<div class="tooltip-stat">⚔️ Dano: <strong>3 HP</strong></div>`;
                desc = "Essencial para minerar rochas, minérios resistentes e derrubar árvores.";
            }
        } else if (registro) {
            tipo = "🧱 Bloco Sólido";
            if (registro.colisao === false) {
                tipo = "🌿 Bloco Decorativo";
            }
            statsHtml += `<div class="tooltip-stat">🧱 Resistência: <strong>${registro.resistencia}</strong></div>`;
            statsHtml += `<div class="tooltip-stat">🚶 Colisão: <strong>${registro.colisao ? 'Sólido' : 'Atravessável'}</strong></div>`;
            
            // Descrições personalizadas para blocos comuns
            if (idItem === 'porta' || idItem === 'porta_aberta') {
                desc = "Uma porta de madeira de 2 blocos de altura. Clique com botão direito para abrir/fechar.";
            } else if (idItem === 'plataforma_madeira') {
                desc = "Plataforma unidirecional. Atravesse pulando ou pressione para baixo (S) para descer.";
            } else if (idItem === 'cadeira') {
                desc = "Uma bela cadeira de madeira para decorar seu abrigo.";
            } else if (idItem === 'mesa') {
                desc = "Uma mesa de madeira resistente. Combina com as cadeiras.";
            } else if (idItem === 'tocha') {
                desc = "Ilumina o cenário em volta e afasta a escuridão absoluta das cavernas.";
            } else if (idItem === 'lama') {
                desc = "Bloco de lama úmida obtido nas camadas superficiais de transição.";
            } else if (idItem === 'granito') {
                desc = "Pedra mineral densa e decorativa extraída das cavernas rochosas profundas.";
            } else {
                desc = "Bloco de construção comum. Posicione no mundo para erguer estruturas.";
            }
        } else {
            // Itens de drop / materiais comuns
            if (idItem === 'carvao') {
                tipo = "💎 Minério";
                desc = "Carvão bruto extraído do subsolo. Usado para fabricar tochas.";
            } else if (idItem === 'gel') {
                tipo = "🧪 Material Biológico";
                desc = "Gel viscoso e inflamável obtido de slimes. Excelente para fazer tochas.";
            } else if (idItem === 'carne_podre') {
                tipo = "🥩 Drop de Monstro";
                desc = "Carne em decomposição dropada por zumbis. Cheira muito mal.";
            } else {
                tipo = "📦 Recurso";
                desc = "Recurso de inventário acumulável usado em receitas de fabricação.";
            }
        }

        let conteudo = `
            <div class="tooltip-title">${label}</div>
            <div class="tooltip-type">${tipo}</div>
            <div class="tooltip-stats">${statsHtml}</div>
        `;
        if (quantidade) {
            conteudo += `<div class="tooltip-stat">📦 Quantidade: <strong>${quantidade}</strong></div>`;
        }
        if (desc) {
            conteudo += `<div class="tooltip-desc">${desc}</div>`;
        }

        this.tooltip.innerHTML = conteudo;
        this.tooltip.style.display = 'block';
        
        // Posicionamento inteligente próximo ao cursor
        this.posicionarTooltip(e);
        
        // Fade in suave
        setTimeout(() => {
            this.tooltip.style.opacity = '1';
        }, 10);
    }

    posicionarTooltip(e) {
        let tx = e.pageX + 15;
        let ty = e.pageY + 15;
        
        // Evita que o tooltip saia das bordas da tela
        if (tx + this.tooltip.offsetWidth > window.innerWidth) {
            tx = e.pageX - this.tooltip.offsetWidth - 15;
        }
        if (ty + this.tooltip.offsetHeight > window.innerHeight) {
            ty = e.pageY - this.tooltip.offsetHeight - 15;
        }
        
        this.tooltip.style.left = tx + 'px';
        this.tooltip.style.top = ty + 'px';
    }

    ocultarTooltip() {
        this.tooltip.style.opacity = '0';
        this.tooltip.style.display = 'none';
    }
}
window.InventoryManager = InventoryManager;
