#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFilter
import math

def create_animated_player_sprite():
    """Convert the new player.png into an animated sprite sheet"""
    print("🎨 Creating animated player sprite from new player.png...")
    
    try:
        # Load the new player image
        original = Image.open('sprites/player.png').convert('RGBA')
        print(f"✅ Loaded player.png: {original.size}")
        
        # Resize to a reasonable size for the game
        target_size = (200, 200)
        player_img = original.resize(target_size, Image.Resampling.LANCZOS)
        
        # Create a sprite sheet with 8 frames (like the original)
        frame_width = 100
        frame_height = 100
        sheet_width = frame_width * 8
        sheet_height = frame_height
        
        # Create the sprite sheet
        sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
        
        # Create 8 frames with slight variations for animation
        for i in range(8):
            # Create a frame
            frame = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
            
            # Calculate animation offset (bounce effect)
            bounce_offset = int(5 * math.sin(i * math.pi / 4))
            
            # Paste the player image with slight variations
            if i % 2 == 0:
                # Even frames - normal position
                frame.paste(player_img, (0, bounce_offset), player_img)
            else:
                # Odd frames - slight tilt for running effect
                tilted = player_img.rotate(2, expand=True, fillcolor=(0, 0, 0, 0))
                frame.paste(tilted, (0, bounce_offset), tilted)
            
            # Add some running motion blur effect
            if i > 0 and i < 7:
                # Apply slight motion blur to middle frames
                blurred = frame.filter(ImageFilter.GaussianBlur(radius=0.5))
                frame = Image.blend(frame, blurred, 0.3)
            
            # Paste frame into sprite sheet
            sprite_sheet.paste(frame, (i * frame_width, 0))
        
        # Save the new animated sprite
        sprite_sheet.save('sprites/player_run_new.png')
        print("✅ Created animated sprite sheet: player_run_new.png")
        print(f"   Size: {sprite_sheet.size}")
        print(f"   Frames: 8")
        
        # Also create a smaller version for better performance
        small_sheet = sprite_sheet.resize((sheet_width // 2, sheet_height // 2), Image.Resampling.LANCZOS)
        small_sheet.save('sprites/player_run_small.png')
        print("✅ Created smaller version: player_run_small.png")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating sprite: {e}")
        return False

if __name__ == "__main__":
    success = create_animated_player_sprite()
    if success:
        print("\n🎉 Successfully created animated player sprite!")
        print("   You can now use player_run_new.png in your game.")
    else:
        print("\n❌ Failed to create animated sprite.") 