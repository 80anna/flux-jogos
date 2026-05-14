from PIL import Image
import shutil
import glob

player_artifact = glob.glob("/home/flux/.gemini/antigravity/brain/e90a38af-5c76-4af5-8bd9-4b3c79ec551b/player_walk_sheet_*.png")[0]
zombie_artifact = glob.glob("/home/flux/.gemini/antigravity/brain/e90a38af-5c76-4af5-8bd9-4b3c79ec551b/zombie_walk_sheet_*.png")[0]

shutil.copy(player_artifact, "player_walk.png")
shutil.copy(zombie_artifact, "zombie_walk.png")

def process_sheet(img_path):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # Remove green background
    min_y = height
    max_y = 0
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            if g > 150 and r < 100 and b < 100:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                if a > 0:
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
                    
    # We will just crop the vertical empty space to make the sprite tight vertically.
    # Horizontally we will keep the full width, so img.width / 3 works.
    if min_y <= max_y:
        img = img.crop((0, min_y, width, max_y+1))
        img.save(img_path)
        print(f"{img_path} processed and vertically cropped to {min_y} - {max_y}")

process_sheet("player_walk.png")
process_sheet("zombie_walk.png")
