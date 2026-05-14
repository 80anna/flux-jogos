from PIL import Image
import shutil
import glob
import os

player_artifact = glob.glob("player_green_*.png")[0]
zombie_artifact = glob.glob("zombie_green_*.png")[0]

shutil.copy(player_artifact, "player.png")
shutil.copy(zombie_artifact, "zombie.png")

def process_image(img_path, flip=False):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    min_x, min_y, max_x, max_y = width, height, 0, 0
    
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            # Detect pure green background
            # The green screen is roughly 0, 255, 0. Allow some margin.
            if g > 150 and r < 100 and b < 100:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                if a > 0:
                    if x < min_x: min_x = x
                    if y < min_y: min_y = y
                    if x > max_x: max_x = x
                    if y > max_y: max_y = y
                    
    if min_x <= max_x and min_y <= max_y:
        img = img.crop((min_x, min_y, max_x+1, max_y+1))
        if flip:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        img.save(img_path)
        print(f"{img_path} processed! BBox: {min_x}, {min_y}, {max_x}, {max_y}. Flipped: {flip}")

# Player is facing left, so flip it to face right natively
process_image("player.png", flip=True)
# Zombie is facing right, no need to flip
process_image("zombie.png", flip=False)
