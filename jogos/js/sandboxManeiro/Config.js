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
        // Blocos novos
        'minerio_carvao': { colisao: true, resistencia: 5 },
        'tocha': { colisao: false, resistencia: 1 },
        // Blocos de Decoração e Plataformas
        'cadeira': { colisao: false, resistencia: 1 },
        'mesa': { colisao: false, resistencia: 1 },
        'porta': { colisao: true, resistencia: 1 },
        'porta_aberta': { colisao: false, resistencia: 1 },
        'plataforma_madeira': { colisao: false, resistencia: 1 }
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
        { resultado: 'tabua', qtdResultado: 4, label: '4 Tábuas', reqs: [{ id: 'madeira', qtd: 1, label: '1 Madeira' }] },
        { resultado: 'tijolo_pedra', qtdResultado: 4, label: '4 Tijolos', reqs: [{ id: 'pedra', qtd: 4, label: '4 Pedras' }] },
        { resultado: 'vidro', qtdResultado: 1, label: '1 Vidro', reqs: [{ id: 'areia', qtd: 2, label: '1 Areia' }] },
        { resultado: 'gelo', qtdResultado: 1, label: '1 Gelo', reqs: [{ id: 'neve', qtd: 4, label: '4 Neves' }] },
        { resultado: 'tocha', qtdResultado: 4, label: '4 Tochas', reqs: [{ id: 'carvao', qtd: 1, label: '1 Carvão' }, { id: 'tabua', qtd: 1, label: '1 Tábua' }] },
        { resultado: 'cadeira', qtdResultado: 1, label: '1 Cadeira', reqs: [{ id: 'tabua', qtd: 4, label: '4 Tábuas' }] },
        { resultado: 'mesa', qtdResultado: 1, label: '1 Mesa', reqs: [{ id: 'tabua', qtd: 6, label: '6 Tábuas' }] },
        { resultado: 'porta', qtdResultado: 1, label: '1 Porta', reqs: [{ id: 'tabua', qtd: 6, label: '6 Tábuas' }] },
        { resultado: 'plataforma_madeira', qtdResultado: 4, label: '4 Plataformas', reqs: [{ id: 'tabua', qtd: 2, label: '2 Tábuas' }] }
    ];
}
// Vincula ao escopo global explicitamente
window.Config = Config;
