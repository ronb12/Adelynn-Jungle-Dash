import bpy
import os
import sys

# --- CONFIGURATION ---
fbx_file = os.path.abspath("Run Forward.fbx")
output_dir = os.path.abspath("renders/RunForward")
os.makedirs(output_dir, exist_ok=True)
frame_start = 1
frame_end = 60  # Adjust as needed for your animation

# --- CLEAN SCENE ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# --- IMPORT FBX ---
bpy.ops.import_scene.fbx(filepath=fbx_file)

# --- SET CAMERA ---
cam = bpy.data.cameras.new("Camera")
cam_obj = bpy.data.objects.new("Camera", cam)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
cam_obj.location = (0, -5, 1.5)
cam_obj.rotation_euler = (1.5708, 0, 0)

# --- SET LIGHT ---
light_data = bpy.data.lights.new(name="Light", type='SUN')
light_obj = bpy.data.objects.new(name="Light", object_data=light_data)
bpy.context.scene.collection.objects.link(light_obj)
light_obj.location = (0, -2, 5)

# --- RENDER SETTINGS ---
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.resolution_x = 512
bpy.context.scene.render.resolution_y = 512
bpy.context.scene.render.film_transparent = True

# --- RENDER FRAMES WITH PROGRESS BAR ---
total = frame_end - frame_start + 1
for idx, frame in enumerate(range(frame_start, frame_end + 1), 1):
    bpy.context.scene.frame_set(frame)
    bpy.context.scene.render.filepath = os.path.join(output_dir, f"frame_{frame:03d}.png")
    bpy.ops.render.render(write_still=True)
    # Print progress bar
    bar = ('#' * (idx * 20 // total)).ljust(20)
    sys.stdout.write(f"\rRendering: [{bar}] {idx}/{total} frames")
    sys.stdout.flush()
print("\nRendering complete! Check the renders/RunForward/ folder.") 