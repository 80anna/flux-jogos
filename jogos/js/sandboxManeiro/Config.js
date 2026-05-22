class Config {
    static TAM_BLOCO = 24;
    static LARGURA_MUNDO = 2000;
    static ALTURA_MUNDO = 1000;
    static ALCANCE_MINERACAO = 5 * 24; // 5 * TAM_BLOCO
    static MAX_STACK = 9999;
    static ASSET_PATH = 'assets/sandboxManeiro/';
    
    // Configurações do Ciclo Dia e Noite
    static DURACAO_MINUTO_REAL = 1000; // 1 minuto do jogo = 1 segundo real (24 minutos reais = 24 horas do jogo)
    static HORA_INICIAL = 6; // O jogo inicia às 6:00 (amanhecer)
    
    static COLUNAS_INV = 5;
    static LINHAS_INV = 10;
    static TOTAL_SLOTS = 50; // COLUNAS_INV * LINHAS_INV

    static REGISTRO_BLOCOS = {
        'terra': { colisao: true, resistencia: 1 },
        'grama': { colisao: true, resistencia: 1 },
        'pedra': { colisao: true, resistencia: 5 },
        'areia': { colisao: true, resistencia: 1 },
        'cacto': { colisao: false, resistencia: 1 },
        'neve': { colisao: true, resistencia: 1 },
        'gelo': { colisao: true, resistencia: 1 },
        'tabua': { colisao: true, resistencia: 1 },
        'tijolo_pedra': { colisao: true, resistencia: 5 },
        'vidro': { colisao: true, resistencia: 1 },
        'madeira': { colisao: false, resistencia: 25 },
        'madeira_selva': { colisao: false, resistencia: 25 },
        'folha': { colisao: false, resistencia: 1 },
        'folha_selva': { colisao: false, resistencia: 1 },
        // Novas decorações e flora avançada (sem colisão)
        'grama_alta': { colisao: false, resistencia: 1 },
        'arbusto': { colisao: false, resistencia: 1 },
        'flor_vermelha': { colisao: false, resistencia: 1 },
        'flor_amarela': { colisao: false, resistencia: 1 },
        'madeira_pinheiro': { colisao: false, resistencia: 25 },
        'folha_pinheiro': { colisao: false, resistencia: 1 },
        'arbusto_congelado': { colisao: false, resistencia: 1 },
        'arbusto_seco': { colisao: false, resistencia: 1 },
        'bambu': { colisao: false, resistencia: 1 },
        'arbusto_florido': { colisao: false, resistencia: 1 },
    };

    static ATRIBUTOS_ITENS = {
        'picareta_cobre': { tipo: 'picareta', forca: 5 }
    };

    static MUSICAS = {
        'floresta': {
            'arquivo': 'assets/sandboxManeiro/musica_main.mp3',
            'titulo': 'Floresta'
        },
    };

    static RECEITAS = [
        { resultado: 'tabua', qtdResultado: 4, label: '4 Tábuas', reqId: 'madeira', reqQtd: 2, labelReq: '2 Madeira' },
        { resultado: 'tijolo_pedra', qtdResultado: 4, label: '4 Tijolos', reqId: 'pedra', reqQtd: 4, labelReq: '4 Pedra' },
        { resultado: 'vidro', qtdResultado: 1, label: '1 Vidro', reqId: 'areia', reqQtd: 2, labelReq: '2 Areia' },
        { resultado: 'gelo', qtdResultado: 1, label: '1 Gelo', reqId: 'neve', reqQtd: 4, labelReq: '4 Neve' }
    ];
}
// Vincula ao escopo global explicitamente
window.Config = Config;
