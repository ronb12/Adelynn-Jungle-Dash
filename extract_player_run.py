from PIL import Image

# Load the uploaded sprite sheet
img = Image.open('downloaded/sprite.png').convert('RGBA')
w, h = img.size
frame_w, frame_h = w // 3, h // 2
frames = []

# Extract 6 frames (3 columns x 2 rows)
for row in range(2):
    for col in range(3):
        frame = img.crop((col * frame_w, row * frame_h, (col + 1) * frame_w, (row + 1) * frame_h))
        frames.append(frame)

# Create a horizontal sprite strip
sheet = Image.new('RGBA', (frame_w * 6, frame_h), (0, 0, 0, 0))
for i, frame in enumerate(frames):
    sheet.paste(frame, (i * frame_w, 0))

# Save as player_run.png
sheet.save('sprites/player_run.png')
print('Created sprites/player_run.png with 6 frames.') 