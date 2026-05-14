from PIL import Image

def make_transparent_global(img_path, threshold_fn):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    for x in range(width):
        for y in range(height):
            p = pixels[x, y]
            if threshold_fn(p):
                pixels[x, y] = (0, 0, 0, 0)
                
    img.save(img_path)

def player_thresh(p):
    return p[0] > 220 and p[1] > 220 and p[2] > 220

def zombie_thresh(p):
    return abs(p[0]-194) < 15 and abs(p[1]-194) < 15 and abs(p[2]-194) < 15

make_transparent_global("player.png", player_thresh)
make_transparent_global("zombie.png", zombie_thresh)

def crop_image(img_path):
    img = Image.open(img_path).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        img.save(img_path)
        print(f"{img_path} cropped to {bbox}")

crop_image("player.png")
crop_image("zombie.png")
