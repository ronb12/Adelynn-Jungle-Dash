from PIL import Image, ImageDraw
import os

# Sprite sheet settings
frame_width = 48
frame_height = 64
frames = 3

# Colors
skin = (255, 224, 189)
hair = (120, 72, 24)
shirt = (255, 105, 180)
pants = (70, 130, 180)
shoes = (60, 60, 60)

# Create output dir
os.makedirs('sprites', exist_ok=True)
sheet = Image.new('RGBA', (frame_width * frames, frame_height), (0, 0, 0, 0))

def draw_girl(draw, pose):
    # Head
    draw.ellipse((16, 4, 32, 20), fill=skin)  # face
    draw.ellipse((14, 2, 34, 18), fill=hair)  # hair
    # Body
    draw.rectangle((20, 20, 28, 44), fill=shirt)
    # Arms
    if pose == 'stand':
        draw.rectangle((12, 24, 20, 32), fill=skin)  # left
        draw.rectangle((28, 24, 36, 32), fill=skin)  # right
    elif pose == 'run':
        draw.rectangle((10, 28, 20, 32), fill=skin)  # left back
        draw.rectangle((28, 20, 38, 24), fill=skin)  # right forward
    elif pose == 'jump':
        draw.rectangle((10, 18, 20, 22), fill=skin)  # left up
        draw.rectangle((28, 18, 38, 22), fill=skin)  # right up
    # Legs
    if pose == 'stand':
        draw.rectangle((20, 44, 24, 60), fill=pants)
        draw.rectangle((24, 44, 28, 60), fill=pants)
    elif pose == 'run':
        draw.rectangle((18, 48, 24, 60), fill=pants)  # left back
        draw.rectangle((24, 44, 30, 56), fill=pants)  # right forward
    elif pose == 'jump':
        draw.rectangle((20, 44, 24, 54), fill=pants)
        draw.rectangle((24, 44, 28, 54), fill=pants)
    # Shoes
    draw.rectangle((20, 60, 24, 64), fill=shoes)
    draw.rectangle((24, 60, 28, 64), fill=shoes)

# Draw each frame
for i, pose in enumerate(['stand', 'run', 'jump']):
    frame = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    draw_girl(draw, pose)
    sheet.paste(frame, (i * frame_width, 0))

sheet.save('sprites/girl_sprite.png')
print('Sprite sheet saved as sprites/girl_sprite.png') 