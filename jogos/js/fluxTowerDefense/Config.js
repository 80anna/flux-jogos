const Config = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    TILE_SIZE: 50, // 24 cols x 14 rows
    STARTING_MONEY: 300,
    STARTING_LIVES: 20,
    
    // Grid Setup
    COLS: 24,
    ROWS: 14,

    // Colors & Styles for IT Office
    COLORS: {
        bg: '#121214',
        grass: '#3a404d', // Carpet
        grassAlt: '#343a46', // Carpet pattern
        path: '#e0e0e0', // White tile
        pathBorder: '#aaaaaa', // Tile grout
        base: '#8257e5',
        spawn: '#e83f5b',
        rangePreview: 'rgba(255, 255, 255, 0.1)',
        rangeValid: 'rgba(4, 211, 97, 0.2)',
        rangeInvalid: 'rgba(232, 63, 91, 0.2)',
        projectile: '#f1e05a',
        freeze: 'rgba(100, 200, 255, 0.5)'
    },

    TOWERS: {
        'cafeteira': {
            id: 'cafeteira',
            name: 'Cafeteira',
            desc: 'Disparo rápido',
            cost: 50,
            range: 95,
            damage: 10,
            fireRate: 300, 
            color: '#6f4e37',
            emoji: '☕'
        },
        'teclado': {
            id: 'teclado',
            name: 'Teclado Mecânico',
            desc: 'Dano em área',
            cost: 100,
            range: 80,
            damage: 15,
            fireRate: 1000,
            splashRadius: 50,
            color: '#c0c0c0',
            emoji: '⌨️'
        },
        'roteador': {
            id: 'roteador',
            name: 'Roteador',
            desc: 'Desacelera inimigos',
            cost: 80,
            range: 120,
            damage: 2,
            fireRate: 500,
            slowFactor: 0.5,
            slowDuration: 2000,
            color: '#0055ff',
            emoji: '🛜'
        },
        'monitor': {
            id: 'monitor',
            name: 'Monitor CRT',
            desc: 'Dano alto em área',
            cost: 1000,
            range: 155,
            damage: 50,
            fireRate: 2000,
            isSplash: true,
            splashRadius: 70,
            color: '#1a1a1a',
            emoji: '🖥️'
        },
        'arcondicionado': {
            id: 'arcondicionado',
            name: 'Ar-Condicionado',
            desc: 'Congela por 1s',
            cost: 120,
            range: 100,
            damage: 5,
            fireRate: 1500,
            stunDuration: 1000,
            color: '#aaddff',
            emoji: '❄️'
        },
        'firewall': {
            id: 'firewall',
            name: 'Firewall (Aura)',
            desc: '+20% de vel. p/ vizinhos',
            cost: 200,
            range: 100, // covers adjacent tiles
            damage: 0,
            fireRate: 0,
            color: '#ff4444',
            emoji: '🧱'
        },
        'nobreak': {
            id: 'nobreak',
            name: 'No-Break',
            desc: 'Gera $ na onda',
            cost: 200,
            range: 0,
            damage: 0,
            fireRate: 5000,
            income: 25,
            color: '#55ff55',
            emoji: '🔋'
        }
    },

    ENEMIES: {
        'junior': {
            id: 'junior',
            name: 'Careca Júnior',
            hp: 30,
            speed: 1.0,
            reward: 5,
            color: '#55b3ff',
            emoji: '👨‍🦲'
        },
        'pleno': {
            id: 'pleno',
            name: 'Careca Pleno',
            hp: 80,
            speed: 1.8,
            reward: 10,
            color: '#ffb355',
            emoji: '🧑‍🦲'
        },
        'senior': {
            id: 'senior',
            name: 'Careca Sênior',
            hp: 300,
            speed: 0.6,
            reward: 30,
            color: '#ff5555',
            emoji: '👴'
        },
        'boss': {
            id: 'boss',
            name: 'CEO Careca',
            hp: 20000,
            speed: 0.4,
            reward: 5000,
            color: '#ff0000',
            emoji: '🤬'
        },
        'estagiario': {
            id: 'estagiario',
            name: 'Careca Estagiário',
            hp: 50,
            speed: 1.2,
            reward: 8,
            color: '#aaffaa',
            emoji: '🧒'
        },
        'bug': {
            id: 'bug',
            name: 'Bug',
            hp: 15,
            speed: 2.5,
            reward: 2,
            color: '#000000',
            emoji: '🐛'
        },
        'hacker': {
            id: 'hacker',
            name: 'Careca Hacker',
            hp: 120,
            speed: 1.5,
            reward: 20,
            color: '#11ff11',
            emoji: '🥷'
        }
    }
};
