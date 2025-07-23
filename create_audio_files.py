#!/usr/bin/env python3
import wave
import struct
import math

def create_simple_audio(filename, frequency, duration, volume=0.3):
    """Create a simple WAV audio file"""
    # Audio parameters
    sample_rate = 44100
    num_samples = int(sample_rate * duration)
    
    # Create audio data
    audio_data = []
    for i in range(num_samples):
        # Simple sine wave
        sample = volume * math.sin(2 * math.pi * frequency * i / sample_rate)
        # Convert to 16-bit integer
        audio_data.append(int(sample * 32767))
    
    # Create WAV file
    with wave.open(f'audio/{filename}.wav', 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        
        # Write audio data
        for sample in audio_data:
            wav_file.writeframes(struct.pack('<h', sample))
    
    print(f"✅ Created {filename}.wav")

def create_audio_files():
    """Create all needed audio files"""
    print("🎵 Creating audio files...")
    
    # Create coin sound (high pitch, short duration)
    create_simple_audio('coin', 800, 0.2, 0.4)
    
    # Create jump sound (medium pitch, medium duration)
    create_simple_audio('jump', 400, 0.3, 0.3)
    
    print("✅ All audio files created successfully!")

if __name__ == "__main__":
    create_audio_files() 