class MapManager {
    constructor(game) {
        this.game = game;
        this.grid = [];
        this.path = [];
        this.decorations = ['💻', '🪑', '🪴', '🚰', '🗑️', '🗄️'];
        this.generateMap();
    }

    generateMap() {
        for (let y = 0; y < Config.ROWS; y++) {
            let row = [];
            for (let x = 0; x < Config.COLS; x++) {
                row.push({
                    x: x,
                    y: y,
                    type: 'grass',
                    tower: null,
                    decoration: Math.random() < 0.15 ? this.decorations[Math.floor(Math.random() * this.decorations.length)] : null
                });
            }
            this.grid.push(row);
        }

        const pathCoords = [
            {x:0, y:2}, {x:1, y:2}, {x:2, y:2}, {x:3, y:2}, {x:4, y:2},
            {x:4, y:3}, {x:4, y:4}, {x:4, y:5}, {x:4, y:6}, {x:4, y:7}, {x:4, y:8}, {x:4, y:9},
            {x:5, y:9}, {x:6, y:9}, {x:7, y:9}, {x:8, y:9}, {x:9, y:9}, {x:10, y:9}, {x:11, y:9}, {x:12, y:9},
            {x:12, y:8}, {x:12, y:7}, {x:12, y:6}, {x:12, y:5}, {x:12, y:4}, {x:12, y:3}, {x:12, y:2},
            {x:13, y:2}, {x:14, y:2}, {x:15, y:2}, {x:16, y:2}, {x:17, y:2}, {x:18, y:2}, {x:19, y:2},
            {x:19, y:3}, {x:19, y:4}, {x:19, y:5}, {x:19, y:6}, {x:19, y:7}, {x:19, y:8}, {x:19, y:9}, {x:19, y:10}, {x:19, y:11},
            {x:20, y:11}, {x:21, y:11}, {x:22, y:11}, {x:23, y:11}
        ];

        this.path = pathCoords;

        for (let p of this.path) {
            this.grid[p.y][p.x].type = 'path';
            this.grid[p.y][p.x].decoration = null;
        }
    }

    draw(ctx) {
        for (let y = 0; y < Config.ROWS; y++) {
            for (let x = 0; x < Config.COLS; x++) {
                const cell = this.grid[y][x];
                const px = x * Config.TILE_SIZE;
                const py = y * Config.TILE_SIZE;

                if (cell.type === 'grass') {
                    ctx.fillStyle = (x + y) % 2 === 0 ? Config.COLORS.grass : Config.COLORS.grassAlt;
                    ctx.fillRect(px, py, Config.TILE_SIZE, Config.TILE_SIZE);
                    
                    if (cell.decoration && !cell.tower) {
                        ctx.font = '24px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.globalAlpha = 0.6;
                        ctx.fillText(cell.decoration, px + Config.TILE_SIZE/2, py + Config.TILE_SIZE/2);
                        ctx.globalAlpha = 1.0;
                    }

                } else if (cell.type === 'path') {
                    ctx.fillStyle = Config.COLORS.path;
                    ctx.fillRect(px, py, Config.TILE_SIZE, Config.TILE_SIZE);
                    
                    ctx.strokeStyle = Config.COLORS.pathBorder;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, Config.TILE_SIZE, Config.TILE_SIZE);
                }
                
                if (x === this.path[0].x && y === this.path[0].y) {
                    ctx.fillStyle = Config.COLORS.spawn;
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(px, py, Config.TILE_SIZE, Config.TILE_SIZE);
                    ctx.globalAlpha = 1.0;
                }
                if (x === this.path[this.path.length-1].x && y === this.path[this.path.length-1].y) {
                    ctx.fillStyle = Config.COLORS.base;
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(px, py, Config.TILE_SIZE, Config.TILE_SIZE);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    getWaypoints() {
        return this.path.map(p => ({
            x: p.x * Config.TILE_SIZE + Config.TILE_SIZE / 2,
            y: p.y * Config.TILE_SIZE + Config.TILE_SIZE / 2
        }));
    }

    canPlaceTower(gridX, gridY) {
        if (gridX < 0 || gridX >= Config.COLS || gridY < 0 || gridY >= Config.ROWS) return false;
        const cell = this.grid[gridY][gridX];
        return cell.type === 'grass' && cell.tower === null;
    }
}
