from PIL import Image

def make_transparent(img_path, threshold_fn):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    visited = set()
    queue = []
    
    # Start flood fill from borders
    for x in range(width):
        queue.extend([(x, 0), (x, height - 1)])
    for y in range(height):
        queue.extend([(0, y), (width - 1, y)])
        
    for q in queue:
        visited.add(q)
        
    while queue:
        x, y = queue.pop(0)
        p = pixels[x, y]
        if threshold_fn(p):
            pixels[x, y] = (0, 0, 0, 0)
            for nx, ny in [(x+1,y), (x-1,y), (x,y+1), (x,y-1)]:
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
    img.save(img_path)

def player_thresh(p):
    # Colors are around 240-251
    return p[0] > 220 and p[1] > 220 and p[2] > 220

def zombie_thresh(p):
    # Colors are around 191-197, basically gray
    return abs(p[0]-194) < 15 and abs(p[1]-194) < 15 and abs(p[2]-194) < 15

make_transparent("player.png", player_thresh)
make_transparent("zombie.png", zombie_thresh)
print("Background removed.")
