#!/bin/bash

FBX="Idle.fbx"
TOTAL_FRAMES=60
WORKERS=30
FRAMES_PER_WORKER=$(( (TOTAL_FRAMES + WORKERS - 1) / WORKERS ))

for ((i=0; i<WORKERS; i++)); do
  START=$(( i * FRAMES_PER_WORKER + 1 ))
  END=$(( (i+1) * FRAMES_PER_WORKER ))
  if [ $END -gt $TOTAL_FRAMES ]; then END=$TOTAL_FRAMES; fi
  if [ $START -le $END ]; then
    blender --background --python-expr "
import bpy, os
fbx_file = os.path.abspath('$FBX')
output_dir = os.path.abspath('renders/Idle')
os.makedirs(output_dir, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=fbx_file)
cam = bpy.data.cameras.new('Camera')
cam_obj = bpy.data.objects.new('Camera', cam)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
cam_obj.location = (0, -5, 1.5)
cam_obj.rotation_euler = (1.5708, 0, 0)
light_data = bpy.data.lights.new(name='Light', type='SUN')
light_obj = bpy.data.objects.new(name='Light', object_data=light_data)
bpy.context.scene.collection.objects.link(light_obj)
light_obj.location = (0, -2, 5)
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.resolution_x = 512
bpy.context.scene.render.resolution_y = 512
bpy.context.scene.render.film_transparent = True
for frame in range($START, $END+1):
    bpy.context.scene.frame_set(frame)
    bpy.context.scene.render.filepath = os.path.join(output_dir, f'frame_{frame:03d}.png')
    bpy.ops.render.render(write_still=True)
" &
  fi
done

wait
echo "All parallel renders complete!" 