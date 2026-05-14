from PIL import Image

def crop_image(img_path):
    img = Image.open(img_path).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        img.save(img_path)
        print(f"{img_path} cropped to {bbox}")

crop_image("player.png")
crop_image("zombie.png")
