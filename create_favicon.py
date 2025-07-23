#!/usr/bin/env python3
from PIL import Image, ImageDraw

def create_favicon():
    """Create a favicon for the game"""
    print("🎨 Creating favicon...")
    
    # Create a 32x32 favicon
    favicon = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(favicon)
    
    # Draw a simple coin icon
    draw.ellipse([4, 4, 28, 28], fill="#FFD700", outline="#FFA500", width=2)
    draw.text((16, 16), "🪙", fill="#FFA500", anchor="mm")
    
    # Save as favicon.ico
    favicon.save('favicon.ico')
    print("✅ Created favicon.ico")
    
    # Also save as PNG for better compatibility
    favicon.save('favicon.png')
    print("✅ Created favicon.png")

if __name__ == "__main__":
    create_favicon() 