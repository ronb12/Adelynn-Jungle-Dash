#!/usr/bin/env python3
from PIL import Image, ImageDraw

def create_pwa_icon(size, filename):
    """Create a PWA icon with the specified size"""
    # Create a new image with the specified size
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate coin size (80% of the icon size)
    coin_size = int(size * 0.8)
    x = (size - coin_size) // 2
    y = (size - coin_size) // 2
    
    # Draw a gold coin
    draw.ellipse([x, y, x + coin_size, y + coin_size], fill="#FFD700", outline="#FFA500", width=3)
    
    # Add a dollar sign or coin symbol
    text_size = int(coin_size * 0.4)
    try:
        # Try to use a coin emoji or symbol
        draw.text((size//2, size//2), "🪙", fill="#FFA500", anchor="mm")
    except:
        # Fallback to a simple circle
        draw.ellipse([x + coin_size//4, y + coin_size//4, x + 3*coin_size//4, y + 3*coin_size//4], fill="#FFA500")
    
    # Save the icon
    img.save(f"sprites/{filename}")
    print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    # Create PWA icons
    create_pwa_icon(192, "pwa_coin_192.png")
    create_pwa_icon(512, "pwa_coin_512.png")
    print("✅ PWA icons created successfully!") 