from PIL import Image, ImageDraw

def save_img(img, name):
    img.save(f"sprites/{name}.png")

# Jungle background
bg = Image.new("RGB", (480, 800), "#4caf50")
draw = ImageDraw.Draw(bg)
draw.rectangle([0, 700, 480, 800], fill="#795548")  # ground
save_img(bg, "jungle_bg")

# Player run sprite sheet (8 frames, larger for testing, feet at bottom)
player_run_width = 180
player_run_height = 480
player_run = Image.new("RGBA", (player_run_width*8, player_run_height), (0,0,0,0))
for i in range(8):
    frame = Image.new("RGBA", (player_run_width, player_run_height), (255, 224, 178, 255))
    d = ImageDraw.Draw(frame)
    # Head
    d.ellipse([player_run_width//2-40, 40, player_run_width//2+40, 120], fill="#ff9800")
    # Body
    d.rectangle([player_run_width//2-20, 120, player_run_width//2+20, player_run_height-40], fill="#3e2723")
    # Feet (at very bottom)
    d.rectangle([player_run_width//2-30, player_run_height-40, player_run_width//2+30, player_run_height-10], fill="#795548")
    player_run.paste(frame, (i*player_run_width, 0))
save_img(player_run, "player_run")

# Player static
player = Image.new("RGBA", (72, 97), (255, 224, 178, 255))
d = ImageDraw.Draw(player)
d.ellipse([16, 16, 56, 56], fill="#ff9800")
d.rectangle([28, 56, 44, 90], fill="#3e2723")
save_img(player, "player")

# Coin
coin = Image.new("RGBA", (40, 40), (0,0,0,0))
d = ImageDraw.Draw(coin)
d.ellipse([4, 4, 36, 36], fill="#ffd700", outline="#bfa000", width=4)
save_img(coin, "coin")

# Obstacles
for i, color in enumerate(["#607d8b", "#795548", "#8bc34a"]):
    obs = Image.new("RGBA", (60, 60), (0,0,0,0))
    d = ImageDraw.Draw(obs)
    d.rectangle([10, 30, 50, 55], fill=color)
    d.ellipse([10, 10, 50, 50], fill=color)
    save_img(obs, f"obstacle{i+1 if i else ''}")

# Magnet
magnet = Image.new("RGBA", (48, 48), (0,0,0,0))
d = ImageDraw.Draw(magnet)
d.arc([8, 8, 40, 40], 45, 315, fill="#f44336", width=8)
d.arc([8, 8, 40, 40], 45, 135, fill="#2196f3", width=8)
save_img(magnet, "magnet")

# Shield
shield = Image.new("RGBA", (48, 48), (0,0,0,0))
d = ImageDraw.Draw(shield)
d.ellipse([4, 4, 44, 44], fill="#b3e5fc", outline="#0288d1", width=4)
d.ellipse([16, 16, 32, 32], fill="#0288d1")
save_img(shield, "shield") 