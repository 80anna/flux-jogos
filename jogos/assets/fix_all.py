from PIL import Image

def process_image(img_path, is_player):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # We will find the bounding box of the actual character.
    # The character pixels are those that are NOT the background.
    # Let's assume background for player is light (r>200, g>200, b>200)
    # Background for zombie is gray (abs(r-194)<20, abs(g-194)<20, abs(b-194)<20)
    
    min_x, min_y, max_x, max_y = width, height, 0, 0
    
    for x in range(width):
        for y in range(height):
            p = pixels[x, y]
            
            is_bg = False
            if is_player:
                if p[0] > 200 and p[1] > 200 and p[2] > 200:
                    is_bg = True
            else:
                if abs(p[0]-194) < 25 and abs(p[1]-194) < 25 and abs(p[2]-194) < 25:
                    is_bg = True
            
            if is_bg:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                
    if min_x <= max_x and min_y <= max_y:
        img = img.crop((min_x, min_y, max_x+1, max_y+1))
        img.save(img_path)
        print(f"{img_path} cropped and transparentized! BBox: {min_x}, {min_y}, {max_x}, {max_y}")
    else:
        print(f"{img_path} completely transparent?")

# Let's revert to the original generated images from the artifacts directory to do a clean pass.
import shutil
import glob
import os

player_artifact = glob.glob("/home/flux/.gemini/antigravity/brain/e90a38af-5c76-4af5-8bd9-4b3c79ec551b/player_sprite_*.png")[0]
zombie_artifact = glob.glob("/home/flux/.gemini/antigravity/brain/e90a38af-5c76-4af5-8bd9-4b3c79ec551b/zombie_sprite_*.png")[0]

shutil.copy(player_artifact, "player.png")
shutil.copy(zombie_artifact, "zombie.png")

process_image("player.png", True)
process_image("zombie.png", False)
