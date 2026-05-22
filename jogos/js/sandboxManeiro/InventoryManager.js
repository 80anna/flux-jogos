class InventoryManager {
    constructor(game) {
        this.game = game;
        this.inventario = new Array(Config.TOTAL_SLOTS).fill(null);
        this.slotSelecionado = 0;
        
        // Inicializa item inicial
        this.inventario[0] = { id: 'picareta_cobre', quantidade: 1 };
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
                let hotkey = document.createElement('span');
                hotkey.className = 'hotkey-inv';
                hotkey.innerText = (i === 9) ? '0' : (i + 1);
                slotDiv.appendChild(hotkey);
                slotDiv.onclick = () => { 
                    this.slotSelecionado = i; 
                    this.renderizarInventarioUI(); 
                };
            }

            let item = this.inventario[i];
            if (item) {
                const tex = this.game.textures.get(item.id);
                if (tex) {
                    // Crie um elemento canvas para desenhar a textura de forma nítida e evitar o bug do pixel de baixo vazando no topo
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

            // Configura o arrastar e soltar (Drag and Drop)
            slotDiv.draggable = !!item;

            slotDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', i);
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
                const deIndex = parseInt(e.dataTransfer.getData('text/plain'));
                if (!isNaN(deIndex) && deIndex !== i) {
                    // Troca os itens de posição no array
                    const temp = this.inventario[deIndex];
                    this.inventario[deIndex] = this.inventario[i];
                    this.inventario[i] = temp;
                    this.renderizarInventarioUI();
                }
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
            if (this.contarItemNoInventario(receita.reqId) >= receita.reqQtd) {
                mostrouAlgo = true;
                let btn = document.createElement('button');
                btn.className = 'btn-craft';
                btn.innerHTML = `<span>${receita.labelReq}</span> ➔ <b>${receita.label}</b>`;
                btn.onclick = () => this.craftar(receita.reqId, receita.reqQtd, receita.resultado, receita.qtdResultado);
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

    craftar(ingrediente, qtdNecessaria, resultado, qtdResultado) {
        if (this.contarItemNoInventario(ingrediente) >= qtdNecessaria) {
            this.consumirItensParaCrafting(ingrediente, qtdNecessaria);
            this.adicionarAoInventario(resultado, qtdResultado);
        }
    }

    getItemSelecionado() {
        return this.inventario[this.slotSelecionado];
    }
}
window.InventoryManager = InventoryManager;
