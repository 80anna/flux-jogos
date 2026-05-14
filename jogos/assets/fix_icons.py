from PIL import Image
import shutil
import glob
import os

health_artifact = glob.glob("health_green_*.png")[0]
bullets_artifact = glob.glob("bullets_green_*.png")[0]

shutil.copy(health_artifact, "health_icon.png")
shutil.copy(bullets_artifact, "bullets_icon.png")

def process_image(img_path):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    min_x, min_y, max_x, max_y = width, height, 0, 0
    
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
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
        img.save(img_path)
        print(f"{img_path} processed! BBox: {min_x}, {min_y}, {max_x}, {max_y}")

process_image("health_icon.png")
process_image("bullets_icon.png")
