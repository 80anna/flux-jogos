class TextureManager {
    constructor(game) {
        this.game = game;
        this.texturas = {};
    }

    criarTextura(nomeId, renderCmds, hBlocos = 1) {
        let c = document.createElement('canvas');
        c.width = Config.TAM_BLOCO;
        c.height = Config.TAM_BLOCO * hBlocos;
        let cx = c.getContext('2d');
        cx.save();
        cx.scale(Config.TAM_BLOCO / 20, Config.TAM_BLOCO / 20);
        renderCmds(cx);
        cx.restore();
        this.texturas[nomeId] = c;
    }

    inicializarTexturas() {
        // 1. TERRA
        this.criarTextura('terra', (cx) => {
            cx.fillStyle = '#5d4037'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#4e342e';
            cx.fillRect(2, 2, 4, 4); cx.fillRect(12, 12, 4, 4); cx.fillRect(6, 14, 2, 2); cx.fillRect(14, 4, 3, 3);
            cx.fillStyle = '#6d4c41';
            cx.fillRect(8, 6, 2, 2); cx.fillRect(2, 12, 3, 2); cx.fillRect(16, 16, 2, 2);
            // Bevel highlights
            cx.fillStyle = 'rgba(255, 255, 255, 0.08)'; cx.fillRect(0, 0, 20, 1); cx.fillRect(0, 0, 1, 20);
            cx.fillStyle = 'rgba(0, 0, 0, 0.15)'; cx.fillRect(0, 19, 20, 1); cx.fillRect(19, 0, 1, 20);
        });

        // 2. GRAMA
        this.criarTextura('grama', (cx) => {
            // Base de terra
            cx.fillStyle = '#5d4037'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#4e342e'; cx.fillRect(2, 10, 4, 4); cx.fillRect(12, 14, 4, 4);
            // Camadas de grama
            cx.fillStyle = '#388E3C'; cx.fillRect(0, 0, 20, 8);
            cx.fillStyle = '#4CAF50'; cx.fillRect(0, 0, 20, 5);
            cx.fillStyle = '#81C784'; cx.fillRect(0, 0, 20, 2);
            // Lâminas de grama irregulares
            cx.fillStyle = '#388E3C';
            cx.fillRect(1, 8, 2, 2); cx.fillRect(5, 8, 2, 3); cx.fillRect(9, 8, 1, 2); cx.fillRect(13, 8, 2, 3); cx.fillRect(17, 8, 2, 1);
            cx.fillStyle = '#4CAF50';
            cx.fillRect(2, 5, 2, 2); cx.fillRect(6, 5, 1, 2); cx.fillRect(14, 5, 2, 2);
        });

        // 3. PEDRA
        this.criarTextura('pedra', (cx) => {
            cx.fillStyle = '#757575'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#616161'; cx.fillRect(1, 1, 18, 18);
            // Rachaduras e Detalhes
            cx.fillStyle = '#424242';
            cx.fillRect(2, 4, 6, 2); cx.fillRect(6, 6, 2, 4); cx.fillRect(12, 3, 2, 8); cx.fillRect(8, 14, 8, 2);
            // Destaques
            cx.fillStyle = '#9e9e9e';
            cx.fillRect(2, 2, 4, 2); cx.fillRect(14, 11, 4, 2); cx.fillRect(3, 16, 2, 2);
            cx.fillStyle = 'rgba(255, 255, 255, 0.15)'; cx.fillRect(0, 0, 20, 1); cx.fillRect(0, 0, 1, 20);
            cx.fillStyle = 'rgba(0, 0, 0, 0.3)'; cx.fillRect(0, 19, 20, 1); cx.fillRect(19, 0, 1, 20);
        });

        // 4. MADEIRA
        this.criarTextura('madeira', (cx) => {
            cx.fillStyle = '#5D4037'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#795548'; cx.fillRect(3, 0, 14, 20);
            cx.fillStyle = '#8D6E63'; cx.fillRect(6, 0, 8, 20);
            cx.fillStyle = '#3E2723';
            cx.fillRect(2, 0, 1, 20); cx.fillRect(17, 0, 1, 20);
            cx.fillRect(8, 4, 1, 3); cx.fillRect(12, 12, 1, 4);
        });

        // 5. FOLHA
        this.criarTextura('folha', (cx) => {
            cx.fillStyle = '#1B5E20'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#2E7D32';
            cx.fillRect(2, 1, 16, 18); cx.fillRect(1, 3, 18, 14);
            cx.fillStyle = '#4CAF50';
            cx.fillRect(4, 4, 4, 4); cx.fillRect(11, 3, 5, 4); cx.fillRect(6, 11, 8, 5);
            cx.fillStyle = '#81C784';
            cx.fillRect(5, 5, 2, 2); cx.fillRect(12, 4, 2, 2);
        });

        // 6. AREIA
        this.criarTextura('areia', (cx) => {
            cx.fillStyle = '#FFE082'; cx.fillRect(0, 0, 20, 20);
            // Ondulações da duna
            cx.fillStyle = '#FFCA28';
            cx.fillRect(2, 3, 5, 2); cx.fillRect(11, 7, 6, 2); cx.fillRect(4, 12, 7, 2); cx.fillRect(13, 15, 4, 2);
            // Grãos e Destaques
            cx.fillStyle = '#FFF59D';
            cx.fillRect(3, 2, 1, 1); cx.fillRect(12, 6, 1, 1); cx.fillRect(5, 11, 1, 1);
            cx.fillStyle = '#BCAAA4';
            cx.fillRect(8, 5, 1, 1); cx.fillRect(15, 11, 1, 1);
        });

        // 7. CACTO
        this.criarTextura('cacto', (cx) => {
            cx.fillStyle = '#1B5E20'; cx.fillRect(2, 0, 16, 20);
            cx.fillStyle = '#2E7D32'; cx.fillRect(4, 0, 12, 20);
            // Linhas de frisos do cacto
            cx.fillStyle = '#194D1F';
            cx.fillRect(5, 0, 1, 20); cx.fillRect(10, 0, 1, 20); cx.fillRect(14, 0, 1, 20);
            // Espinhos amarelos
            cx.fillStyle = '#FFEE58';
            cx.fillRect(3, 4, 1, 1); cx.fillRect(7, 8, 1, 1); cx.fillRect(12, 2, 1, 1); cx.fillRect(16, 10, 1, 1); cx.fillRect(8, 15, 1, 1);
        });

        // 8. NEVE
        this.criarTextura('neve', (cx) => {
            cx.fillStyle = '#ECEFF1'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#FFFFFF'; cx.fillRect(0, 0, 20, 15);
            cx.fillStyle = '#B0BEC5'; cx.fillRect(3, 16, 5, 2); cx.fillRect(12, 17, 4, 2);
            cx.fillStyle = '#FFFFFF'; cx.fillRect(2, 3, 4, 2); cx.fillRect(10, 5, 5, 2);
        });

        // 9. GELO
        this.criarTextura('gelo', (cx) => {
            cx.fillStyle = 'rgba(129, 212, 250, 0.6)'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            // Brilho diagonal
            cx.fillRect(3, 3, 2, 2);
            cx.beginPath(); cx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; cx.lineWidth = 1;
            cx.moveTo(2, 18); cx.lineTo(18, 2); cx.stroke();
            // Bevel borders
            cx.fillStyle = 'rgba(255, 255, 255, 0.8)'; cx.fillRect(0, 0, 20, 1); cx.fillRect(0, 0, 1, 20);
            cx.fillStyle = 'rgba(2, 119, 189, 0.8)'; cx.fillRect(0, 19, 20, 1); cx.fillRect(19, 0, 1, 20);
        });

        // 10. MADEIRA DA SELVA
        this.criarTextura('madeira_selva', (cx) => {
            cx.fillStyle = '#3E2723'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#4E342E'; cx.fillRect(2, 0, 16, 20);
            cx.fillStyle = '#5D4037'; cx.fillRect(5, 0, 10, 20);
            cx.fillStyle = '#27120C';
            cx.fillRect(1, 0, 1, 20); cx.fillRect(18, 0, 1, 20);
            cx.fillRect(4, 5, 1, 5); cx.fillRect(12, 10, 1, 6);
        });

        // 11. FOLHA DA SELVA
        this.criarTextura('folha_selva', (cx) => {
            cx.fillStyle = '#1B5E20'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#004D40'; cx.fillRect(2, 2, 16, 16);
            cx.fillStyle = '#2E7D32'; cx.fillRect(4, 4, 12, 12);
            cx.fillStyle = '#4CAF50';
            cx.fillRect(3, 3, 2, 2); cx.fillRect(13, 5, 3, 3); cx.fillRect(6, 12, 4, 4);
        });

        // 12. TABUA (MADEIRA PROCESSADA)
        this.criarTextura('tabua', (cx) => {
            cx.fillStyle = '#CD853F'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#DEB887';
            cx.fillRect(0, 0, 20, 5); cx.fillRect(0, 6, 20, 6); cx.fillRect(0, 13, 20, 6);
            // Divisórias de tábua
            cx.fillStyle = '#8B4513';
            cx.fillRect(0, 5, 20, 1); cx.fillRect(0, 12, 20, 1); cx.fillRect(0, 19, 20, 1);
            cx.fillRect(6, 0, 1, 5); cx.fillRect(14, 6, 1, 6); cx.fillRect(8, 13, 1, 6);
        });

        // 13. TIJOLO DE PEDRA
        this.criarTextura('tijolo_pedra', (cx) => {
            cx.fillStyle = '#9e9e9e'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#757575';
            cx.fillRect(0, 0, 9, 8); cx.fillRect(10, 0, 10, 8);
            cx.fillRect(0, 10, 14, 9); cx.fillRect(15, 10, 5, 9);
            // Argamassa escura
            cx.fillStyle = '#212121';
            cx.fillRect(0, 8, 20, 2); cx.fillRect(0, 19, 20, 1);
            cx.fillRect(9, 0, 1, 8); cx.fillRect(14, 10, 1, 9);
            // Destaques e chanfro do tijolo
            cx.fillStyle = '#BDBDBD';
            cx.fillRect(1, 1, 7, 1); cx.fillRect(11, 1, 8, 1);
            cx.fillRect(1, 11, 12, 1);
        });

        // 14. VIDRO
        this.criarTextura('vidro', (cx) => {
            cx.fillStyle = 'rgba(224, 247, 250, 0.25)'; cx.fillRect(0, 0, 20, 20);
            cx.strokeStyle = '#FFFFFF'; cx.lineWidth = 1;
            cx.strokeRect(1, 1, 18, 18);
            // Reflexos diagonais
            cx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            cx.fillRect(3, 3, 6, 1); cx.fillRect(3, 3, 1, 6);
            cx.fillRect(13, 13, 3, 1); cx.fillRect(15, 11, 1, 3);
        });

        // 15. PICARETA DE COBRE
        this.criarTextura('picareta_cobre', (cx) => {
            // Cabo de madeira
            cx.fillStyle = '#5D4037'; cx.fillRect(8, 8, 4, 12);
            cx.fillStyle = '#8D6E63'; cx.fillRect(9, 9, 2, 10);
            // Lâmina metálica de cobre
            cx.fillStyle = '#D84315'; // Sombra
            cx.fillRect(2, 4, 16, 4);
            cx.fillStyle = '#FF7043'; // Cobre principal
            cx.fillRect(3, 3, 14, 2); cx.fillRect(1, 5, 2, 2); cx.fillRect(17, 5, 2, 2);
            // Brilho de reflexão metálica
            cx.fillStyle = '#FFAB91'; 
            cx.fillRect(7, 3, 6, 1); cx.fillRect(14, 4, 2, 1);
        });

        // 16. GRAMA ALTA (FLORESTA)
        this.criarTextura('grama_alta', (cx) => {
            cx.fillStyle = '#388E3C';
            cx.fillRect(2, 12, 2, 8); cx.fillRect(5, 6, 2, 14); cx.fillRect(10, 8, 2, 12); cx.fillRect(14, 11, 2, 9);
            cx.fillStyle = '#4CAF50';
            cx.fillRect(3, 10, 1, 10); cx.fillRect(6, 4, 1, 16); cx.fillRect(11, 6, 1, 14); cx.fillRect(15, 9, 1, 11);
            cx.fillStyle = '#81C784';
            cx.fillRect(7, 2, 1, 18); cx.fillRect(12, 5, 1, 15);
        });

        // 17. ARBUSTO (FLORESTA)
        this.criarTextura('arbusto', (cx) => {
            cx.fillStyle = '#1B5E20';
            cx.beginPath(); cx.arc(10, 12, 8, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#2E7D32';
            cx.beginPath(); cx.arc(8, 11, 6, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#4CAF50';
            cx.beginPath(); cx.arc(11, 9, 5, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#81C784';
            cx.beginPath(); cx.arc(12, 8, 3, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#2E7D32';
            cx.fillRect(4, 14, 2, 2); cx.fillRect(14, 13, 2, 2);
            cx.fillStyle = '#81C784';
            cx.fillRect(7, 6, 2, 1); cx.fillRect(10, 5, 1, 1);
        });

        // 18. FLOR VERMELHA (FLORESTA)
        this.criarTextura('flor_vermelha', (cx) => {
            cx.fillStyle = '#388E3C'; cx.fillRect(9, 9, 2, 11);
            cx.fillStyle = '#4CAF50'; cx.fillRect(8, 12, 1, 2); cx.fillRect(11, 14, 1, 2);
            cx.fillStyle = '#E53935';
            cx.fillRect(7, 5, 6, 4); cx.fillRect(8, 4, 4, 6);
            cx.fillStyle = '#B71C1C';
            cx.fillRect(7, 7, 2, 2); cx.fillRect(11, 7, 2, 2);
            cx.fillStyle = '#FFEE58'; cx.fillRect(9, 6, 2, 2);
        });

        // 19. FLOR AMARELA (FLORESTA)
        this.criarTextura('flor_amarela', (cx) => {
            cx.fillStyle = '#388E3C'; cx.fillRect(9, 9, 2, 11);
            cx.fillStyle = '#4CAF50'; cx.fillRect(7, 13, 2, 1); cx.fillRect(11, 11, 2, 1);
            cx.fillStyle = '#FDD835';
            cx.fillRect(6, 5, 8, 4); cx.fillRect(8, 3, 4, 8);
            cx.fillStyle = '#F57F17';
            cx.fillRect(7, 7, 1, 1); cx.fillRect(12, 7, 1, 1);
            cx.fillStyle = '#FF9800'; cx.fillRect(9, 6, 2, 2);
        });

        // 20. MADEIRA DE PINHEIRO (TUNDRA)
        this.criarTextura('madeira_pinheiro', (cx) => {
            cx.fillStyle = '#212121'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#37474F'; cx.fillRect(2, 0, 16, 20);
            cx.fillStyle = '#455A64'; cx.fillRect(5, 0, 10, 20);
            cx.fillStyle = '#1A1A1A';
            cx.fillRect(1, 0, 1, 20); cx.fillRect(18, 0, 1, 20);
            cx.fillRect(3, 4, 1, 6); cx.fillRect(14, 8, 1, 8); cx.fillRect(8, 2, 1, 4);
        });

        // 21. FOLHA DE PINHEIRO (TUNDRA)
        this.criarTextura('folha_pinheiro', (cx) => {
            cx.fillStyle = '#00332c'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#004D40'; cx.fillRect(2, 2, 16, 16);
            cx.fillStyle = '#00695C'; cx.fillRect(4, 4, 12, 12);
            cx.fillStyle = '#00796B';
            cx.fillRect(1, 3, 2, 2); cx.fillRect(15, 6, 3, 2); cx.fillRect(5, 12, 4, 3); cx.fillRect(11, 4, 4, 4);
            cx.fillStyle = '#00897B';
            cx.fillRect(2, 4, 1, 1); cx.fillRect(12, 5, 2, 2);
        });

        // 22. ARBUSTO CONGELADO (TUNDRA)
        this.criarTextura('arbusto_congelado', (cx) => {
            cx.fillStyle = '#004d40';
            cx.beginPath(); cx.arc(10, 12, 8, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#00838f';
            cx.beginPath(); cx.arc(9, 11, 6, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#00acc1';
            cx.beginPath(); cx.arc(11, 9, 5, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#ffffff';
            cx.fillRect(6, 4, 8, 2); cx.fillRect(8, 3, 4, 1); cx.fillRect(4, 8, 3, 1); cx.fillRect(12, 7, 4, 1);
            cx.fillStyle = '#e0f7fa';
            cx.fillRect(8, 7, 2, 2); cx.fillRect(13, 11, 2, 2); cx.fillRect(5, 13, 1, 2);
        });

        // 23. ARBUSTO SECO (DESERTO)
        this.criarTextura('arbusto_seco', (cx) => {
            cx.fillStyle = '#5d4037';
            cx.fillRect(9, 8, 2, 12);
            cx.fillRect(6, 12, 4, 2); cx.fillRect(5, 10, 2, 2);
            cx.fillRect(11, 14, 5, 2); cx.fillRect(14, 11, 2, 3);
            cx.fillStyle = '#8d6e63';
            cx.fillRect(4, 8, 2, 2); cx.fillRect(8, 6, 2, 2); cx.fillRect(12, 8, 2, 3); cx.fillRect(15, 6, 2, 2);
            cx.fillStyle = '#a1887f';
            cx.fillRect(3, 7, 1, 1); cx.fillRect(8, 5, 1, 1); cx.fillRect(16, 5, 1, 1); cx.fillRect(13, 7, 1, 1);
        });

        // 24. BAMBU (SELVA)
        this.criarTextura('bambu', (cx) => {
            cx.fillStyle = '#1b5e20'; cx.fillRect(8, 0, 4, 20);
            cx.fillStyle = '#4caf50'; cx.fillRect(9, 0, 2, 20);
            cx.fillStyle = '#1b5e20';
            cx.fillRect(7, 5, 6, 2);
            cx.fillRect(7, 13, 6, 2);
            cx.fillStyle = '#81c784';
            cx.fillRect(8, 4, 4, 1);
            cx.fillRect(8, 12, 4, 1);
            cx.fillStyle = '#2e7d32';
            cx.fillRect(4, 6, 3, 2); cx.fillRect(13, 14, 3, 2);
            cx.fillStyle = '#4caf50';
            cx.fillRect(3, 5, 2, 1); cx.fillRect(15, 13, 2, 1);
        });

        // 25. ARBUSTO FLORIDO (SELVA)
        this.criarTextura('arbusto_florido', (cx) => {
            cx.fillStyle = '#004d40';
            cx.beginPath(); cx.arc(10, 12, 8, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#1b5e20';
            cx.beginPath(); cx.arc(9, 11, 6, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#2e7d32';
            cx.beginPath(); cx.arc(11, 9, 5, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#4caf50';
            cx.beginPath(); cx.arc(12, 8, 3, 0, Math.PI*2); cx.fill();
            cx.fillStyle = '#e91e63';
            cx.fillRect(4, 10, 2, 2); cx.fillRect(13, 7, 2, 2); cx.fillRect(7, 13, 2, 2); cx.fillRect(14, 13, 2, 2);
            cx.fillStyle = '#ff4081';
            cx.fillRect(5, 10, 1, 1); cx.fillRect(14, 7, 1, 1); cx.fillRect(8, 13, 1, 1); cx.fillRect(11, 10, 2, 2);
            cx.fillStyle = '#ffffff';
            cx.fillRect(11, 10, 1, 1); cx.fillRect(5, 10, 1, 1); cx.fillRect(14, 7, 1, 1);
        });

        // 26. MINÉRIO DE CARVÃO (SUBTERRÂNEO)
        this.criarTextura('minerio_carvao', (cx) => {
            // Base de pedra
            cx.fillStyle = '#757575'; cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#616161'; cx.fillRect(1, 1, 18, 18);
            // Rachaduras de pedra
            cx.fillStyle = '#424242';
            cx.fillRect(2, 4, 6, 2); cx.fillRect(6, 6, 2, 4); cx.fillRect(12, 3, 2, 8); cx.fillRect(8, 14, 8, 2);
            // Detalhes pretos de carvão
            cx.fillStyle = '#1a1a1a';
            cx.fillRect(3, 3, 4, 3); cx.fillRect(13, 5, 3, 4); cx.fillRect(5, 12, 4, 3); cx.fillRect(11, 13, 3, 3);
            cx.fillStyle = '#2d2d2d';
            cx.fillRect(4, 4, 2, 2); cx.fillRect(14, 6, 2, 2); cx.fillRect(6, 13, 2, 1); cx.fillRect(12, 14, 1, 1);
            // Bevel highlights
            cx.fillStyle = 'rgba(255, 255, 255, 0.15)'; cx.fillRect(0, 0, 20, 1); cx.fillRect(0, 0, 1, 20);
            cx.fillStyle = 'rgba(0, 0, 0, 0.3)'; cx.fillRect(0, 19, 20, 1); cx.fillRect(19, 0, 1, 20);
        });

        // 27. CARVÃO (ITEM DROP)
        this.criarTextura('carvao', (cx) => {
            // Formato irregular de carvão
            cx.fillStyle = '#151515';
            cx.beginPath();
            cx.moveTo(10, 2);
            cx.lineTo(17, 7);
            cx.lineTo(16, 15);
            cx.lineTo(8, 18);
            cx.lineTo(3, 11);
            cx.lineTo(4, 5);
            cx.closePath();
            cx.fill();
            
            // Detalhes internos tridimensionais
            cx.fillStyle = '#2a2a2a';
            cx.beginPath();
            cx.moveTo(9, 4);
            cx.lineTo(15, 8);
            cx.lineTo(14, 14);
            cx.lineTo(8, 16);
            cx.lineTo(5, 11);
            cx.closePath();
            cx.fill();

            // Facetas de brilho metálico
            cx.fillStyle = '#555555';
            cx.fillRect(8, 5, 3, 2);
            cx.fillRect(6, 10, 2, 3);
            cx.fillStyle = '#ffffff';
            cx.fillRect(11, 7, 2, 1);
            cx.fillRect(8, 12, 1, 1);
        });

        // 28. TOCHA (ILUMINAÇÃO DE LUGARES)
        this.criarTextura('tocha', (cx) => {
            // Bastão de madeira
            cx.fillStyle = '#8B4513';
            cx.fillRect(8, 9, 4, 11);
            cx.fillStyle = '#A0522D';
            cx.fillRect(9, 10, 2, 10);
            
            // Carvão na ponta
            cx.fillStyle = '#2F4F4F';
            cx.fillRect(8, 7, 4, 2);
            cx.fillStyle = '#1C1C1C';
            cx.fillRect(9, 7, 2, 2);
            
            // Chama viva e calorosa (Orange, Yellow, White)
            cx.fillStyle = '#FF3D00'; // Laranja externo
            cx.fillRect(6, 2, 8, 5);
            cx.fillStyle = '#FFEA00'; // Amarelo médio
            cx.fillRect(7, 3, 6, 3);
            cx.fillStyle = '#FFFFFF'; // Núcleo branco quente
            cx.fillRect(8, 4, 4, 2);
        });

        // 29. CADEIRA
        this.criarTextura('cadeira', (cx) => {
            // Assento da cadeira
            cx.fillStyle = '#CD853F'; cx.fillRect(3, 10, 14, 2);
            cx.fillStyle = '#8B4513'; cx.fillRect(3, 12, 14, 1);
            
            // Encosto
            cx.fillStyle = '#CD853F'; cx.fillRect(3, 2, 3, 8);
            cx.fillStyle = '#8B4513'; cx.fillRect(3, 2, 1, 8);
            // Travas decorativas do encosto
            cx.fillStyle = '#D2B48C'; cx.fillRect(6, 4, 3, 1); cx.fillRect(6, 7, 3, 1);
            
            // Pernas da frente
            cx.fillStyle = '#8B4513'; cx.fillRect(4, 13, 2, 7); cx.fillRect(14, 13, 2, 7);
            // Pernas de trás (sombreadas/mais escuras)
            cx.fillStyle = '#5C2E0B'; cx.fillRect(3, 13, 1, 7); cx.fillRect(13, 13, 1, 7);
        });

        // 30. MESA
        this.criarTextura('mesa', (cx) => {
            // Tampo superior da mesa
            cx.fillStyle = '#DEB887'; cx.fillRect(1, 4, 18, 3);
            cx.fillStyle = '#CD853F'; cx.fillRect(1, 7, 18, 1);
            cx.fillStyle = '#8B4513'; cx.fillRect(1, 8, 18, 1); // Sombra embaixo
            
            // Perna esquerda
            cx.fillStyle = '#CD853F'; cx.fillRect(3, 9, 3, 11);
            cx.fillStyle = '#8B4513'; cx.fillRect(3, 9, 1, 11);
            
            // Perna direita
            cx.fillStyle = '#CD853F'; cx.fillRect(14, 9, 3, 11);
            cx.fillStyle = '#8B4513'; cx.fillRect(14, 9, 1, 11);
            
            // Trave horizontal de reforço
            cx.fillStyle = '#5C2E0B'; cx.fillRect(6, 12, 8, 2);
        });

        // 31. PORTA
        this.criarTextura('porta', (cx) => {
            // Fundo da porta
            cx.fillStyle = '#CD853F'; cx.fillRect(1, 0, 18, 40);
            
            // Moldura externa
            cx.fillStyle = '#8B4513';
            cx.fillRect(1, 0, 18, 1);  // Topo
            cx.fillRect(1, 0, 1, 40);   // Esquerda
            cx.fillRect(18, 0, 1, 40);  // Direita
            cx.fillRect(1, 39, 18, 1);  // Base
            
            // 4 painéis esculpidos verticais para riqueza de detalhes
            for (let p = 0; p < 4; p++) {
                let py = 2 + p * 9;
                cx.fillStyle = '#DEB887'; cx.fillRect(3, py, 14, 7);
                cx.strokeStyle = '#5C2E0B'; cx.lineWidth = 1; cx.strokeRect(3, py, 14, 7);
            }
            
            // Maçaneta de ouro/latão no centro vertical (y = 19)
            cx.fillStyle = '#FFD700'; cx.fillRect(14, 19, 3, 2);
            cx.fillStyle = '#B8860B'; cx.fillRect(15, 19, 1, 2);
        }, 2);

        // 32. PORTA_ABERTA
        this.criarTextura('porta_aberta', (cx) => {
            // Moldura externa da porta vazia (portal)
            cx.fillStyle = '#8B4513';
            cx.fillRect(1, 0, 2, 40);   // Batente esquerdo
            cx.fillRect(17, 0, 2, 40);  // Batente direito
            cx.fillRect(1, 0, 18, 2);   // Batente superior
            
            // Porta aberta e encostada completamente na lateral esquerda (vista como placa fina vertical)
            cx.fillStyle = '#CD853F'; cx.fillRect(3, 1, 3, 38);
            
            // Borda e divisórias da porta na lateral
            cx.fillStyle = '#8B4513';
            cx.fillRect(3, 1, 1, 38);
            cx.fillRect(5, 1, 1, 38);
            
            // Reentrâncias dos painéis vistos de perfil lateral
            cx.fillStyle = '#DEB887';
            for (let p = 0; p < 4; p++) {
                let py = 3 + p * 9;
                cx.fillRect(4, py, 1, 5);
            }
            
            // Maçaneta vista de perfil
            cx.fillStyle = '#FFD700'; cx.fillRect(4, 19, 1, 2);
        }, 2);

        // 33. PLATAFORMA DE MADEIRA
        this.criarTextura('plataforma_madeira', (cx) => {
            // Prancha de madeira superior
            cx.fillStyle = '#DEB887'; cx.fillRect(0, 0, 20, 3);
            cx.fillStyle = '#CD853F'; cx.fillRect(0, 3, 20, 1);
            cx.fillStyle = '#8B4513'; cx.fillRect(0, 4, 20, 1); // Sombreamento da prancha
            
            // Suportes / Mão francesa nas laterais inferiores
            cx.fillStyle = '#8B4513';
            // Suporte esquerdo
            cx.fillRect(1, 5, 2, 2);
            cx.fillRect(2, 7, 2, 2);
            cx.fillRect(3, 9, 1, 1);
            
            // Suporte direito
            cx.fillRect(17, 5, 2, 2);
            cx.fillRect(16, 7, 2, 2);
            cx.fillRect(16, 9, 1, 1);
        });

        // 34. ESPADA DE COBRE
        this.criarTextura('espada_cobre', (cx) => {
            // Cabo de madeira/couro
            cx.fillStyle = '#5D4037'; cx.fillRect(3, 17, 3, 3);
            cx.fillStyle = '#8D6E63'; cx.fillRect(4, 16, 2, 2);
            // Guarda de mão (guarda de cobre)
            cx.fillStyle = '#D84315';
            cx.fillRect(5, 14, 5, 2);
            cx.fillRect(4, 15, 2, 3);
            // Lâmina de cobre diagonal
            cx.fillStyle = '#FF7043'; // Cobre principal
            for (let i = 0; i < 11; i++) {
                cx.fillRect(6 + i, 13 - i, 2, 2);
            }
            cx.fillStyle = '#FFAB91'; // Brilho metálico superior
            for (let i = 0; i < 11; i++) {
                cx.fillRect(7 + i, 13 - i, 1, 1);
            }
        });

        // 35. GEL (DROP DE SLIME)
        this.criarTextura('gel', (cx) => {
            // Sombra e base azul translúcida
            cx.fillStyle = 'rgba(33, 150, 243, 0.85)';
            cx.beginPath();
            cx.arc(10, 11, 7, 0, Math.PI * 2);
            cx.fill();
            // Camada interna brilhante
            cx.fillStyle = 'rgba(129, 212, 250, 0.9)';
            cx.beginPath();
            cx.arc(8, 9, 4, 0, Math.PI * 2);
            cx.fill();
            // Pequeno reflexo de luz branca
            cx.fillStyle = '#FFFFFF';
            cx.fillRect(6, 6, 2, 2);
        });

        // 36. CARNE PODRE (DROP DE ZUMBI)
        this.criarTextura('carne_podre', (cx) => {
            // Formato irregular de bife/carne podre
            cx.fillStyle = '#4e342e'; // Marrom escuro de base
            cx.fillRect(4, 6, 12, 9);
            cx.fillRect(6, 4, 8, 12);
            // Tom esverdeado apodrecido por cima
            cx.fillStyle = '#558B2F'; // Verde zumbi
            cx.fillRect(6, 6, 8, 7);
            cx.fillRect(8, 5, 5, 9);
            // Detalhes de ossos ou nervos cinzentos
            cx.fillStyle = '#ECEFF1';
            cx.fillRect(3, 8, 2, 2);
            cx.fillRect(15, 10, 2, 2);
        });
        // 37. LAMA (Mud)
        this.criarTextura('lama', (cx) => {
            cx.fillStyle = '#4e342e'; // Marrom base escuro
            cx.fillRect(0, 0, 20, 20);
            // Manchas mais escuras úmidas
            cx.fillStyle = '#3e2723';
            cx.fillRect(2, 2, 4, 3);
            cx.fillRect(10, 4, 6, 4);
            cx.fillRect(4, 12, 5, 5);
            cx.fillRect(12, 11, 4, 3);
            // Detalhes brilhantes de água
            cx.fillStyle = '#6d4c41';
            cx.fillRect(8, 2, 1, 1);
            cx.fillRect(4, 8, 2, 1);
            cx.fillRect(14, 8, 1, 1);
        });

        // 38. GRANITO (Granite)
        this.criarTextura('granito', (cx) => {
            cx.fillStyle = '#b0bec5'; // Base cinza azulada claro
            cx.fillRect(0, 0, 20, 20);
            // Manchas rosa/vermelho granito clássicas
            cx.fillStyle = '#ef9a9a';
            cx.fillRect(2, 1, 3, 3);
            cx.fillRect(11, 3, 4, 4);
            cx.fillRect(4, 10, 5, 3);
            cx.fillRect(12, 12, 4, 5);
            // Partículas minerais pretas/brilhantes
            cx.fillStyle = '#37474f';
            cx.fillRect(6, 4, 2, 2);
            cx.fillRect(14, 2, 2, 2);
            cx.fillRect(2, 14, 2, 2);
            cx.fillRect(10, 10, 2, 2);
        });

        // 39. BANDAID (ITEM CURA)
        this.criarTextura('bandaid', (cx) => {
            cx.fillStyle = '#ffccaa'; // Bege base
            cx.fillRect(3, 8, 14, 4);
            cx.fillStyle = '#eeaa88'; // Borda
            cx.fillRect(4, 7, 12, 1);
            cx.fillRect(4, 12, 12, 1);
            cx.fillStyle = '#ffffff'; // Centro branco
            cx.fillRect(7, 7, 6, 6);
            cx.fillStyle = '#d32f2f'; // Cruz vermelha
            cx.fillRect(9, 8, 2, 4);
            cx.fillRect(8, 9, 4, 2);
        });

        // 40. MINERIO DE FERRO (BLOCO)
        this.criarTextura('minerio_ferro', (cx) => {
            cx.fillStyle = '#616161'; // Pedra base
            cx.fillRect(0, 0, 20, 20);
            cx.fillStyle = '#424242'; // Textura pedra
            cx.fillRect(2, 2, 6, 6);
            cx.fillRect(10, 8, 8, 5);
            cx.fillRect(4, 12, 5, 6);
            // Pontinhos de ferro (metálico/alaranjado)
            cx.fillStyle = '#ffcc80'; // Ferrugem leve
            cx.fillRect(3, 4, 2, 2);
            cx.fillRect(12, 3, 2, 2);
            cx.fillRect(14, 10, 2, 2);
            cx.fillStyle = '#eeeeee'; // Prata
            cx.fillRect(5, 14, 2, 2);
            cx.fillRect(8, 7, 2, 2);
        });

        // 41. FERRO (ITEM)
        this.criarTextura('ferro', (cx) => {
            cx.fillStyle = '#e0e0e0'; // Prata claro
            cx.fillRect(4, 6, 12, 8);
            cx.fillStyle = '#9e9e9e'; // Prata escuro borda
            cx.fillRect(5, 7, 10, 6);
            cx.fillStyle = '#ffffff'; // Brilho
            cx.fillRect(6, 8, 3, 2);
        });

        // 42. ESPADA DE FERRO
        this.criarTextura('espada_ferro', (cx) => {
            cx.translate(10, 10);
            cx.rotate(Math.PI / 4);
            cx.translate(-10, -10);
            
            cx.fillStyle = '#5d4037'; // Cabo
            cx.fillRect(8, 12, 4, 6);
            cx.fillStyle = '#795548'; // Guarda
            cx.fillRect(4, 10, 12, 2);
            
            cx.fillStyle = '#e0e0e0'; // Lâmina base
            cx.fillRect(8, 2, 4, 8);
            cx.fillStyle = '#bdbdbd'; // Fio da lâmina
            cx.fillRect(10, 2, 2, 8);
            
            cx.fillStyle = '#e0e0e0'; // Ponta
            cx.beginPath();
            cx.moveTo(8, 2);
            cx.lineTo(10, 0);
            cx.lineTo(12, 2);
            cx.fill();
        });

        // 43. PICARETA DE FERRO
        this.criarTextura('picareta_ferro', (cx) => {
            cx.translate(10, 10);
            cx.rotate(Math.PI / 4);
            cx.translate(-10, -10);
            
            cx.fillStyle = '#5d4037'; // Cabo
            cx.fillRect(9, 6, 2, 12);
            
            cx.fillStyle = '#e0e0e0'; // Cabeça de ferro
            cx.beginPath();
            cx.moveTo(10, 6);
            cx.lineTo(2, 8);
            cx.lineTo(3, 4);
            cx.lineTo(10, 2);
            cx.lineTo(17, 4);
            cx.lineTo(18, 8);
            cx.fill();
            
            cx.fillStyle = '#bdbdbd'; // Sombra da cabeça
            cx.beginPath();
            cx.moveTo(10, 6);
            cx.lineTo(10, 2);
            cx.lineTo(17, 4);
            cx.lineTo(18, 8);
            cx.fill();
        });
    }

    get(id) {
        return this.texturas[id];
    }
}
window.TextureManager = TextureManager;
