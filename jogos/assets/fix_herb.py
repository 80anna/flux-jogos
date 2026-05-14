from PIL import Image

def process_herb(img_path):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    min_x, min_y, max_x, max_y = width, height, 0, 0
    
    # Let's find background. 
    # Usually AI generated items with a black background have very dark colors.
    # Let's use a threshold: r < 30, g < 30, b < 30.
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            # Dark background check
            if r < 35 and g < 35 and b < 40:
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
    else:
        print("Image became completely transparent?")

process_herb("herb.png")
