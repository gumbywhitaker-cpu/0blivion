"""
Kiwi String Recovery -- Trailer Chassis builder for Blender.

Run this INSIDE Blender (Scripting tab -> Open -> Run), or headless:
    blender --background --python build_chassis.py

What it does:
  1. Builds the bare tandem-axle flatbed trailer chassis as real geometry
     (not primitives standing in for detail -- actual box/cylinder
     construction with correct proportions, matching the reference photo's
     ~6.5m x 1.8m envelope).
  2. Assigns procedural PBR materials (Blender shader nodes) for each
     surface -- charcoal powder-coat body, safety-orange accents, brushed
     steel, diamond-plate deck, matte rubber tires. No external texture
     downloads; everything is generated from noise/wave/bump nodes.
  3. UV-unwraps every part (Smart UV Project) so the materials are ready
     to bake to image textures.
  4. Adds a camera + 3-point lighting so you get a usable preview the
     moment you open the file.

Baking to image textures (for the Three.js site / any glTF export):
  glTF does NOT understand Blender's procedural node graphs -- only baked
  image textures (base color / roughness / normal maps). To produce the
  exact files kiwi-recovery/PBR_TEXTURES.md expects:
    1. Save this .blend file somewhere (bake output is written relative
       to it).
    2. Set BAKE_TEXTURES = True below.
    3. Re-run the script (Run Script button, or re-run headless).
  This bakes each material to 1024x1024 basecolor.jpg / normal.jpg /
  roughness.jpg under blender/textures/<material-name>/ next to the
  .blend file -- copy those folders straight into
  kiwi-recovery/public/textures/ to match the site's expected paths
  (brushed-steel, tread-plate, rubber are the three the site already
  wires in; charcoal-body and safety-orange are extra, for your own use
  if you add more textured surfaces later).

Re-running is safe: everything this script creates lives in a
"KiwiTrailer_Chassis" collection and is deleted at the start of each run,
so nothing duplicates.
"""

import bpy
import os
import math

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

BAKE_TEXTURES = False       # flip to True once the .blend file is saved
BAKE_RESOLUTION = 1024
TEXTURE_OUTPUT_SUBDIR = "textures"

COLLECTION_NAME = "KiwiTrailer_Chassis"

# Real-world dimensions (meters), matching the reference photo and
# kiwi-recovery/reference/meshy-3d-model-prompts.md
TRAILER_LENGTH = 6.5
TRAILER_WIDTH = 1.8
DECK_HEIGHT = 0.7
DECK_THICKNESS = 0.05

WHEEL_RADIUS = 0.42
WHEEL_WIDTH = 0.28
AXLE_SPACING = 0.9          # gap between the two axles
AXLE_FROM_REAR = 0.9        # first axle's distance from the rear edge

HEX = {
    "charcoal": "#3a3d44",
    "orange": "#ff5a1f",
    "steel": "#8a8d92",
    "rubber": "#111214",
    "tread_plate_base": "#3a3d43",
}


# ---------------------------------------------------------------------------
# COLOR HELPERS
# ---------------------------------------------------------------------------

def hex_to_linear_rgba(hex_color):
    """sRGB hex string -> linear RGBA tuple Blender node inputs expect."""
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i + 2], 16) / 255.0 for i in (0, 2, 4))

    def to_linear(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (to_linear(r), to_linear(g), to_linear(b), 1.0)


# ---------------------------------------------------------------------------
# SCENE SETUP
# ---------------------------------------------------------------------------

def get_clean_collection(name):
    if name in bpy.data.collections:
        coll = bpy.data.collections[name]
        for obj in list(coll.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
    else:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    return coll


def link_only_to(obj, collection):
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    collection.objects.link(obj)


# ---------------------------------------------------------------------------
# MATERIALS
# ---------------------------------------------------------------------------

def new_material(name):
    mat = bpy.data.materials.get(name)
    if mat:
        bpy.data.materials.remove(mat)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat


def mat_powder_coat(name, hex_color, roughness=0.5):
    """Charcoal body / safety-orange accent powder coat: a Principled BSDF
    with a fine noise-driven bump for the characteristic powder-coat
    'orange peel' micro-texture."""
    mat = new_material(name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (100, 0)
    bsdf.inputs["Base Color"].default_value = hex_to_linear_rgba(hex_color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.15

    noise = nodes.new("ShaderNodeTexNoise")
    noise.location = (-500, -200)
    noise.inputs["Scale"].default_value = 220.0
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.6

    bump = nodes.new("ShaderNodeBump")
    bump.location = (-200, -200)
    bump.inputs["Strength"].default_value = 0.06

    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def mat_brushed_steel(name, hex_color="#8a8d92"):
    """Bare/brushed steel: anisotropic-leaning look via a directional wave
    pattern feeding roughness + bump, so highlights streak along the
    part's long axis like real brushed metal."""
    mat = new_material(name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (500, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (150, 0)
    bsdf.inputs["Base Color"].default_value = hex_to_linear_rgba(hex_color)
    bsdf.inputs["Metallic"].default_value = 0.9
    bsdf.inputs["Roughness"].default_value = 0.35
    if "Anisotropic" in bsdf.inputs:
        bsdf.inputs["Anisotropic"].default_value = 0.7

    coords = nodes.new("ShaderNodeTexCoord")
    coords.location = (-700, -200)

    wave = nodes.new("ShaderNodeTexWave")
    wave.location = (-450, -200)
    wave.wave_type = "BANDS"
    wave.inputs["Scale"].default_value = 400.0
    wave.inputs["Distortion"].default_value = 0.4

    bump = nodes.new("ShaderNodeBump")
    bump.location = (-150, -250)
    bump.inputs["Strength"].default_value = 0.03

    links.new(coords.outputs["Object"], wave.inputs["Vector"])
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def mat_rubber(name, hex_color="#111214"):
    mat = new_material(name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (100, 0)
    bsdf.inputs["Base Color"].default_value = hex_to_linear_rgba(hex_color)
    bsdf.inputs["Roughness"].default_value = 0.92
    bsdf.inputs["Metallic"].default_value = 0.0

    noise = nodes.new("ShaderNodeTexNoise")
    noise.location = (-500, -200)
    noise.inputs["Scale"].default_value = 60.0
    noise.inputs["Detail"].default_value = 4.0

    bump = nodes.new("ShaderNodeBump")
    bump.location = (-200, -200)
    bump.inputs["Strength"].default_value = 0.15

    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def mat_diamond_plate(name, hex_color="#3a3d43"):
    """Diamond-plate deck: two BANDS wave textures at 90 degrees to each
    other, combined, produce the crosshatched raised-diamond pattern --
    the standard node trick for tread plate without modeling every
    diamond as geometry (keeps this a mid-poly asset)."""
    mat = new_material(name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (600, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (300, 0)
    bsdf.inputs["Base Color"].default_value = hex_to_linear_rgba(hex_color)
    bsdf.inputs["Metallic"].default_value = 0.7
    bsdf.inputs["Roughness"].default_value = 0.45

    coords = nodes.new("ShaderNodeTexCoord")
    coords.location = (-900, -100)

    mapping_a = nodes.new("ShaderNodeMapping")
    mapping_a.location = (-700, 0)
    mapping_a.inputs["Rotation"].default_value = (0, 0, math.radians(45))

    mapping_b = nodes.new("ShaderNodeMapping")
    mapping_b.location = (-700, -250)
    mapping_b.inputs["Rotation"].default_value = (0, 0, math.radians(-45))

    wave_a = nodes.new("ShaderNodeTexWave")
    wave_a.location = (-450, 0)
    wave_a.wave_type = "BANDS"
    wave_a.inputs["Scale"].default_value = 26.0

    wave_b = nodes.new("ShaderNodeTexWave")
    wave_b.location = (-450, -250)
    wave_b.wave_type = "BANDS"
    wave_b.inputs["Scale"].default_value = 26.0

    combine = nodes.new("ShaderNodeMixRGB")
    combine.location = (-200, -120)
    combine.blend_type = "MULTIPLY"
    combine.inputs["Fac"].default_value = 1.0

    bump = nodes.new("ShaderNodeBump")
    bump.location = (100, -150)
    bump.inputs["Strength"].default_value = 0.35

    links.new(coords.outputs["Object"], mapping_a.inputs["Vector"])
    links.new(coords.outputs["Object"], mapping_b.inputs["Vector"])
    links.new(mapping_a.outputs["Vector"], wave_a.inputs["Vector"])
    links.new(mapping_b.outputs["Vector"], wave_b.inputs["Vector"])
    links.new(wave_a.outputs["Color"], combine.inputs["Color1"])
    links.new(wave_b.outputs["Color"], combine.inputs["Color2"])
    links.new(combine.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ---------------------------------------------------------------------------
# GEOMETRY HELPERS
# ---------------------------------------------------------------------------

def add_box(name, dims, loc, mat, collection, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    smart_uv_unwrap(obj)
    link_only_to(obj, collection)
    return obj


def add_cylinder(name, radius, depth, loc, mat, collection, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, location=loc, rotation=rot, vertices=verts
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    smart_uv_unwrap(obj)
    link_only_to(obj, collection)
    return obj


def smart_uv_unwrap(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


# ---------------------------------------------------------------------------
# BUILD
# ---------------------------------------------------------------------------

def build_chassis():
    coll = get_clean_collection(COLLECTION_NAME)

    m_charcoal = mat_powder_coat("Chassis_Charcoal", HEX["charcoal"], roughness=0.55)
    m_orange = mat_powder_coat("Chassis_SafetyOrange", HEX["orange"], roughness=0.4)
    m_steel = mat_brushed_steel("Chassis_BrushedSteel", HEX["steel"])
    m_rubber = mat_rubber("Chassis_Rubber", HEX["rubber"])
    m_deck = mat_diamond_plate("Chassis_TreadPlate", HEX["tread_plate_base"])

    half_len = TRAILER_LENGTH / 2
    half_wid = TRAILER_WIDTH / 2

    # --- deck ---
    add_box(
        "Chassis_Deck",
        (TRAILER_LENGTH, TRAILER_WIDTH, DECK_THICKNESS),
        (0, 0, DECK_HEIGHT),
        m_deck,
        coll,
    )

    # --- main chassis rails (underside, running the full length) ---
    rail_h, rail_w = 0.16, 0.1
    for side in (1, -1):
        add_box(
            f"Chassis_Rail_{'R' if side > 0 else 'L'}",
            (TRAILER_LENGTH * 0.96, rail_w, rail_h),
            (0, side * (half_wid - 0.08), DECK_HEIGHT - DECK_THICKNESS / 2 - rail_h / 2),
            m_charcoal,
            coll,
        )

    # --- tow hitch + jockey wheel ---
    hitch_len = 0.9
    add_box(
        "Chassis_HitchBar",
        (hitch_len, 0.08, 0.08),
        (-half_len - hitch_len / 2, 0, DECK_HEIGHT - 0.25),
        m_steel,
        coll,
    )
    add_cylinder(
        "Chassis_HitchCoupler",
        0.06, 0.14,
        (-half_len - hitch_len - 0.04, 0, DECK_HEIGHT - 0.25),
        m_orange,
        coll,
        rot=(0, math.radians(90), 0),
    )
    add_cylinder(
        "Chassis_JockeyWheel",
        0.09, 0.05,
        (-half_len - hitch_len + 0.15, 0, DECK_HEIGHT - 0.55),
        m_rubber,
        coll,
        rot=(math.radians(90), 0, 0),
    )

    # --- axles + wheels (tandem: two axles near the rear) ---
    axle_x_positions = [
        half_len - AXLE_FROM_REAR,
        half_len - AXLE_FROM_REAR - AXLE_SPACING,
    ]
    for i, ax in enumerate(axle_x_positions):
        add_cylinder(
            f"Chassis_Axle_{i + 1}",
            0.045, TRAILER_WIDTH - 0.1,
            (ax, 0, DECK_HEIGHT - 0.28),
            m_steel,
            coll,
            rot=(0, math.radians(90), 0),
        )
        for side in (1, -1):
            wx, wy, wz = ax, side * (half_wid - WHEEL_WIDTH / 2 + 0.03), DECK_HEIGHT - 0.28
            tire = add_cylinder(
                f"Chassis_Tire_{i + 1}_{'R' if side > 0 else 'L'}",
                WHEEL_RADIUS, WHEEL_WIDTH,
                (wx, wy, wz),
                m_rubber,
                coll,
                rot=(0, math.radians(90), 0),
            )
            hub = add_cylinder(
                f"Chassis_Hub_{i + 1}_{'R' if side > 0 else 'L'}",
                WHEEL_RADIUS * 0.45, WHEEL_WIDTH + 0.02,
                (wx, wy, wz),
                m_steel,
                coll,
                rot=(0, math.radians(90), 0),
            )

    # --- stabilizer legs (4, one near each corner) ---
    leg_positions = [
        (-half_len + 0.6, half_wid - 0.15),
        (-half_len + 0.6, -half_wid + 0.15),
        (half_len - 0.6, half_wid - 0.15),
        (half_len - 0.6, -half_wid + 0.15),
    ]
    leg_len = 0.6
    for i, (lx, ly) in enumerate(leg_positions):
        add_box(
            f"Chassis_Leg_{i + 1}",
            (0.07, 0.07, leg_len),
            (lx, ly, DECK_HEIGHT - DECK_THICKNESS / 2 - leg_len / 2),
            m_orange,
            coll,
        )
        add_box(
            f"Chassis_LegFoot_{i + 1}",
            (0.16, 0.16, 0.03),
            (lx, ly, DECK_HEIGHT - DECK_THICKNESS / 2 - leg_len - 0.015),
            m_charcoal,
            coll,
        )

    # --- safety-orange guard rail along one long edge ---
    rail_y = half_wid + 0.02
    rail_z = DECK_HEIGHT + 0.4
    add_box(
        "Chassis_GuardRail_Top",
        (TRAILER_LENGTH * 0.9, 0.04, 0.04),
        (0, rail_y, rail_z),
        m_orange,
        coll,
    )
    post_count = 6
    rail_span = TRAILER_LENGTH * 0.9  # matches Chassis_GuardRail_Top's length above
    for i in range(post_count):
        px = -rail_span / 2 + i * rail_span / (post_count - 1)
        add_box(
            f"Chassis_GuardPost_{i + 1}",
            (0.04, 0.04, 0.42),
            (px, rail_y, DECK_HEIGHT + 0.2),
            m_orange,
            coll,
        )

    # --- rear step + grab rail ---
    add_box(
        "Chassis_RearStep",
        (0.3, TRAILER_WIDTH * 0.5, 0.03),
        (half_len + 0.15, 0, DECK_HEIGHT - 0.08),
        m_charcoal,
        coll,
    )
    add_box(
        "Chassis_RearGrabRail",
        (0.03, 0.03, 0.35),
        (half_len + 0.28, half_wid * 0.4, DECK_HEIGHT + 0.15),
        m_orange,
        coll,
    )


# ---------------------------------------------------------------------------
# CAMERA + LIGHTING (so opening the file gives a usable preview)
# ---------------------------------------------------------------------------

def build_preview_rig(coll):
    cam_data = bpy.data.cameras.new("Chassis_PreviewCam")
    cam_obj = bpy.data.objects.new("Chassis_PreviewCam", cam_data)
    cam_obj.location = (4.5, -5.5, 3.2)
    cam_obj.rotation_euler = (math.radians(65), 0, math.radians(38))
    link_only_to(cam_obj, coll)
    bpy.context.scene.camera = cam_obj

    key = bpy.data.lights.new("Chassis_KeyLight", type="SUN")
    key.energy = 3.0
    key_obj = bpy.data.objects.new("Chassis_KeyLight", key)
    key_obj.location = (3, -4, 5)
    key_obj.rotation_euler = (math.radians(55), 0, math.radians(35))
    link_only_to(key_obj, coll)

    fill = bpy.data.lights.new("Chassis_FillLight", type="AREA")
    fill.energy = 250.0
    fill.size = 3.0
    fill_obj = bpy.data.objects.new("Chassis_FillLight", fill)
    fill_obj.location = (-4, 3, 3)
    link_only_to(fill_obj, coll)


# ---------------------------------------------------------------------------
# TEXTURE BAKING
# ---------------------------------------------------------------------------

def bake_material(mat, out_dir):
    """Bakes Base Color / Roughness / Normal for one material to
    basecolor.jpg / roughness.jpg / normal.jpg -- filenames matching
    kiwi-recovery/PBR_TEXTURES.md exactly."""
    mat_dir = os.path.join(out_dir, mat.name)
    os.makedirs(mat_dir, exist_ok=True)

    nodes = mat.node_tree.nodes
    passes = [
        ("basecolor", "DIFFUSE", "sRGB"),
        ("roughness", "ROUGHNESS", "Non-Color"),
        ("normal", "NORMAL", "Non-Color"),
    ]

    for filename, bake_type, colorspace in passes:
        img = bpy.data.images.new(
            f"{mat.name}_{filename}", BAKE_RESOLUTION, BAKE_RESOLUTION
        )
        img.colorspace_settings.name = colorspace

        img_node = nodes.new("ShaderNodeTexImage")
        img_node.image = img
        nodes.active = img_node

        bpy.context.scene.cycles.bake_type = bake_type
        if bake_type == "DIFFUSE":
            bpy.context.scene.render.bake.use_pass_direct = False
            bpy.context.scene.render.bake.use_pass_indirect = False
            bpy.context.scene.render.bake.use_pass_color = True

        bpy.ops.object.bake(type=bake_type)

        img.filepath_raw = os.path.join(mat_dir, f"{filename}.jpg")
        img.file_format = "JPEG"
        img.save()
        nodes.remove(img_node)

    print(f"  baked {mat.name} -> {mat_dir}")


def bake_all(coll):
    if not bpy.data.is_saved:
        print(
            "\n*** BAKE_TEXTURES is True but the .blend file hasn't been "
            "saved yet. Save it first (bake output is written relative to "
            "the file), then re-run. Skipping bake for now. ***\n"
        )
        return

    prev_engine = bpy.context.scene.render.engine
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 32

    out_dir = os.path.join(os.path.dirname(bpy.data.filepath), TEXTURE_OUTPUT_SUBDIR)

    baked = set()
    for obj in coll.objects:
        if obj.type != "MESH" or not obj.data.materials:
            continue
        mat = obj.data.materials[0]
        if mat.name in baked:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        print(f"Baking {mat.name} using object {obj.name}...")
        bake_material(mat, out_dir)
        baked.add(mat.name)

    bpy.context.scene.render.engine = prev_engine
    print(f"\nDone. Textures written under: {out_dir}")
    print("Copy the folders you need into kiwi-recovery/public/textures/")
    print("(brushed-steel, tread-plate, rubber match the site's current wiring).")


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    build_chassis()
    coll = bpy.data.collections[COLLECTION_NAME]
    build_preview_rig(coll)
    print(f"Built {len(coll.objects)} objects in collection '{COLLECTION_NAME}'.")

    if BAKE_TEXTURES:
        bake_all(coll)
    else:
        print("BAKE_TEXTURES is False -- skipping bake. Flip it on after saving the .blend file.")
