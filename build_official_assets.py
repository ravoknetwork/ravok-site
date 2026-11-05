import os
from PIL import Image, ImageDraw, ImageFilter

REF_DIR = r'C:\Users\guiil\.gemini\antigravity\brain\eb4f6f09-ca4b-488f-af5e-ac6d67090b9f\.user_uploaded'
OUT_DIRS = [
    r'images\products',
    r'public\images\products'
]

for d in OUT_DIRS:
    os.makedirs(d, exist_ok=True)

# Load references
ref_book = Image.open(os.path.join(REF_DIR, 'media_1793842705902_843c9b7b.png')).convert('RGBA')
ref_green_key = Image.open(os.path.join(REF_DIR, 'media_1793842705903_993f0b62.png')).convert('RGBA')
ref_purple_key = Image.open(os.path.join(REF_DIR, 'media_1793842705904_c5cb59d3.png')).convert('RGBA')
ref_cyan_wrench = Image.open(os.path.join(REF_DIR, 'media_1793842705903_76486205.png')).convert('RGBA')
ref_yellow_wrench = Image.open(os.path.join(REF_DIR, 'media_1793842705903_e02bb938.png')).convert('RGBA')

def scale_and_save(img16, filename, add_glow=True, glow_color=(255, 215, 0, 50)):
    # Create 512x512 canvas
    final_size = 512
    canvas = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
    
    # Scale 16x16 up to 400x400 (nearest neighbor) centered
    sprite_size = 400
    scaled = img16.resize((sprite_size, sprite_size), Image.Resampling.NEAREST)
    offset = ((final_size - sprite_size) // 2, (final_size - sprite_size) // 2)
    
    if add_glow:
        # Create subtle bloom glow behind sprite
        glow = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        center = final_size // 2
        # Soft radial gradient
        for r in range(220, 40, -10):
            alpha = int(glow_color[3] * (1.0 - (r / 220.0)))
            glow_draw.ellipse(
                (center - r, center - r, center + r, center + r),
                fill=(glow_color[0], glow_color[1], glow_color[2], alpha)
            )
        glow = glow.filter(ImageFilter.GaussianBlur(15))
        canvas.paste(glow, (0, 0), glow)
    
    canvas.paste(scaled, offset, scaled)
    
    for d in OUT_DIRS:
        dest = os.path.join(d, filename)
        canvas.save(dest, 'PNG')
        print(f"Saved: {dest}")

# =========================================================================
# 1. BOOKS GENERATOR (Based on exact 16x16 reference sprite)
# =========================================================================
def generate_book(palette, filename, glow_color):
    """
    palette: dict with:
      frame: [highlight, mid, shadow]
      cover: [mid, shadow, dark]
      glyph: [bright, mid]
      spine: [mid, shadow]
    """
    out = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    
    for y in range(16):
        for x in range(16):
            r, g, b, a = ref_book.getpixel((x, y))
            if a < 30:
                continue
            
            # Dark outline
            if r < 20 and g < 20 and b < 20:
                out.putpixel((x, y), (14, 12, 14, 255))
            # Pages
            elif (y == 12 or y == 13) and 4 <= x <= 12:
                out.putpixel((x, y), (r, g, b, 255))
            # Spine
            elif x in (1, 2) and 2 <= y <= 13:
                # Use spine shading based on brightness
                brightness = (r + g + b) / 3.0
                c = palette['spine'][0] if brightness > 60 else palette['spine'][1]
                out.putpixel((x, y), c)
            # Golden Frame
            elif (y in (1, 10) and 3 <= x <= 13) or (x in (3, 13) and 1 <= y <= 10):
                brightness = (r + g + b) / 3.0
                if brightness > 180:
                    c = palette['frame'][0]
                elif brightness > 120:
                    c = palette['frame'][1]
                else:
                    c = palette['frame'][2]
                out.putpixel((x, y), c)
            # Cover edge (bottom)
            elif y in (11, 14):
                brightness = (r + g + b) / 3.0
                c = palette['cover'][0] if brightness > 80 else palette['cover'][1]
                out.putpixel((x, y), c)
            # Glyph / Rune in center
            elif r > 100 and g > 60 and b < 50:
                brightness = (r + g + b) / 3.0
                c = palette['glyph'][0] if brightness > 85 else palette['glyph'][1]
                out.putpixel((x, y), c)
            # Cover / Leather field
            else:
                brightness = (r + g + b) / 3.0
                if brightness > 55:
                    c = palette['cover'][0]
                elif brightness > 40:
                    c = palette['cover'][1]
                else:
                    c = palette['cover'][2]
                out.putpixel((x, y), c)
                
    scale_and_save(out, filename, add_glow=True, glow_color=glow_color)

# 1. Fortuna IV (Gold Frame + Emerald Green Cover + Brilliant Gold Glyph)
generate_book({
    'frame': [(255, 220, 80, 255), (220, 160, 20, 255), (160, 100, 5, 255)],
    'cover': [(34, 110, 55, 255), (20, 75, 35, 255), (12, 45, 22, 255)],
    'glyph': [(255, 240, 120, 255), (255, 195, 30, 255)],
    'spine': [(60, 120, 70, 255), (35, 75, 45, 255)]
}, 'livro_fortuna_4.png', (255, 215, 0, 70))

# 2. Eficiência VI (Diamond Cyan Frame + Deep Azure Ocean Cover + Electric Cyan Rune)
generate_book({
    'frame': [(180, 250, 255, 255), (70, 205, 235, 255), (20, 130, 175, 255)],
    'cover': [(18, 65, 120, 255), (12, 45, 90, 255), (8, 28, 60, 255)],
    'glyph': [(220, 255, 255, 255), (80, 230, 255, 255)],
    'spine': [(40, 95, 150, 255), (20, 60, 105, 255)]
}, 'livro_eficiencia_6.png', (0, 220, 255, 70))

# 3. Inquebrável IV (Amethyst Arcane Purple Frame + Obsidian Deep Purple Cover + Radiant Violet Rune)
generate_book({
    'frame': [(230, 170, 255, 255), (175, 90, 225, 255), (115, 40, 160, 255)],
    'cover': [(65, 25, 105, 255), (42, 14, 72, 255), (26, 8, 48, 255)],
    'glyph': [(250, 205, 255, 255), (210, 110, 255, 255)],
    'spine': [(95, 45, 140, 255), (55, 22, 90, 255)]
}, 'livro_inquebravel_4.png', (185, 80, 255, 70))

# 4. Remendo / Mending (Lime XP Frame + Dark Jade Cover + Glowing Lime XP Orb Rune)
generate_book({
    'frame': [(210, 255, 80, 255), (150, 225, 30, 255), (90, 160, 15, 255)],
    'cover': [(25, 90, 45, 255), (15, 60, 30, 255), (10, 38, 18, 255)],
    'glyph': [(235, 255, 150, 255), (140, 255, 40, 255)],
    'spine': [(55, 115, 50, 255), (32, 70, 30, 255)]
}, 'livro_remendo.png', (120, 255, 40, 75))

# 5. Soulbound / Perder ferramenta se morrer (Fiery Crimson Bronze Frame + Netherite Black Cover + Crimson Ember Rune)
generate_book({
    'frame': [(255, 140, 80, 255), (220, 70, 40, 255), (150, 30, 20, 255)],
    'cover': [(48, 38, 42, 255), (32, 24, 28, 255), (18, 14, 16, 255)],
    'glyph': [(255, 180, 150, 255), (255, 50, 40, 255)],
    'spine': [(80, 45, 45, 255), (50, 28, 28, 255)]
}, 'livro_soulbound.png', (255, 60, 40, 70))

# 6. Telecinese (Cosmic Rose Frame + Ender Void Purple Cover + Neon Pink/Magenta Rune)
generate_book({
    'frame': [(255, 170, 220, 255), (235, 75, 160, 255), (160, 25, 100, 255)],
    'cover': [(70, 20, 95, 255), (45, 10, 65, 255), (25, 5, 40, 255)],
    'glyph': [(255, 210, 240, 255), (255, 80, 190, 255)],
    'spine': [(105, 35, 120, 255), (65, 18, 80, 255)]
}, 'livro_telecinese.png', (255, 60, 180, 70))

print("=== All 6 Enchanted Books Generated Successfully ===")

# =========================================================================
# 2. WRENCHES / COMANDOS GENERATOR (Based on exact reference wrenches)
# =========================================================================
def generate_wrench_variant(src_wrench, palette_map, filename, glow_color):
    """
    src_wrench: 16x16 image
    palette_map: function (r, g, b, a) -> (r', g', b', a')
    """
    out = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y in range(16):
        for x in range(16):
            rgba = src_wrench.getpixel((x, y))
            if rgba[3] < 20:
                continue
            out.putpixel((x, y), palette_map(*rgba))
    scale_and_save(out, filename, add_glow=True, glow_color=glow_color)

# 1. /fly: Cyan Diamond Wrench (Exact reference ref_cyan_wrench)
generate_wrench_variant(ref_cyan_wrench, lambda r, g, b, a: (r, g, b, a), 'cmd_fly_hd.png', (0, 220, 255, 70))

# 2. /feed: Golden Amber Sustenance Wrench (Exact reference ref_yellow_wrench)
generate_wrench_variant(ref_yellow_wrench, lambda r, g, b, a: (r, g, b, a), 'cmd_feed_hd.png', (255, 193, 7, 70))

# Helper to recolor cyan wrench to other hues based on brightness
def recolor_from_cyan(src, bright_color, mid_color, dark_color, outline_color):
    def mapper(r, g, b, a):
        val = (r + g + b) / 3.0
        if val < 40:
            return outline_color
        elif val > 210:
            return bright_color
        elif val > 150:
            return mid_color
        else:
            return dark_color
    return mapper

# 3. /heal: Emerald Jade Healing Wrench
generate_wrench_variant(
    ref_cyan_wrench,
    recolor_from_cyan(ref_cyan_wrench, (210, 255, 210, 255), (75, 230, 110, 255), (20, 150, 55, 255), (10, 45, 18, 255)),
    'cmd_heal_hd.png',
    (50, 230, 90, 70)
)

# 4. /repair: Polished Steel / Iron Anvil Wrench
generate_wrench_variant(
    ref_cyan_wrench,
    recolor_from_cyan(ref_cyan_wrench, (245, 248, 255, 255), (180, 195, 210, 255), (110, 125, 140, 255), (35, 42, 50, 255)),
    'cmd_repair_hd.png',
    (190, 210, 240, 60)
)

# 5. /back: Ender Amethyst Portal Wrench
generate_wrench_variant(
    ref_cyan_wrench,
    recolor_from_cyan(ref_cyan_wrench, (245, 215, 255, 255), (185, 95, 235, 255), (115, 35, 165, 255), (35, 12, 55, 255)),
    'cmd_back_hd.png',
    (180, 70, 240, 70)
)

print("=== All 5 Command Wrenches Generated Successfully ===")

# =========================================================================
# 3. KEYS GENERATOR (Based on exact reference green & purple keys)
# =========================================================================
def recolor_key(src_key, bright_c, mid_c, dark_c, outline_c):
    def mapper(r, g, b, a):
        val = (r + g + b) / 3.0
        if val < 50:
            return outline_c
        elif val > 210:
            return bright_c
        elif val > 150:
            return mid_c
        else:
            return dark_c
    return mapper

# 1. Chave Comum: Exact reference ref_green_key (Emerald Green)
generate_wrench_variant(ref_green_key, lambda r, g, b, a: (r, g, b, a), 'key_comum_hd.png', (46, 204, 113, 70))

# 2. Chave Épica: Exact reference ref_purple_key (Amethyst Purple)
generate_wrench_variant(ref_purple_key, lambda r, g, b, a: (r, g, b, a), 'key_epica_hd.png', (155, 89, 182, 70))

# 3. Chave Rara: Sapphire Cyan Blue
generate_wrench_variant(
    ref_green_key,
    recolor_key(ref_green_key, (200, 245, 255, 255), (52, 152, 219, 255), (25, 90, 160, 255), (10, 35, 70, 255)),
    'key_rara_hd.png',
    (52, 152, 219, 70)
)

# 4. Chave Superior: Radiant Gold Sun
generate_wrench_variant(
    ref_green_key,
    recolor_key(ref_green_key, (255, 245, 180, 255), (241, 196, 15, 255), (211, 84, 0, 255), (60, 25, 5, 255)),
    'key_superior_hd.png',
    (241, 196, 15, 75)
)

# 5. Chave de Voto: 3x Vote Keys Combo ("a de voto faz uma imagen q tem 3 pq la e um combo ne")
def build_3x_vote_key_combo():
    final_size = 512
    canvas = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
    glow = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    center = final_size // 2
    for r in range(230, 40, -10):
        alpha = int(75 * (1.0 - (r / 230.0)))
        glow_draw.ellipse((center - r, center - r, center + r, center + r), fill=(255, 193, 7, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    canvas.paste(glow, (0, 0), glow)

    # Vote key recolor: Golden / Honey Amber
    vote_key_16 = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    vote_mapper = recolor_key(ref_green_key, (255, 248, 200, 255), (255, 185, 15, 255), (210, 120, 10, 255), (65, 30, 5, 255))
    for y in range(16):
        for x in range(16):
            rgba = ref_green_key.getpixel((x, y))
            if rgba[3] >= 20:
                vote_key_16.putpixel((x, y), vote_mapper(*rgba))
    
    key_sz = 300
    scaled_key = vote_key_16.resize((key_sz, key_sz), Image.Resampling.NEAREST)
    
    # 3 Keys fanned: Left (-18 deg), Right (+18 deg), Center (0 deg in front)
    k_left = scaled_key.rotate(22, resample=Image.Resampling.NEAREST, expand=True)
    k_right = scaled_key.rotate(-22, resample=Image.Resampling.NEAREST, expand=True)
    
    # Paste Left
    canvas.paste(k_left, (35, 100), k_left)
    # Paste Right
    canvas.paste(k_right, (180, 100), k_right)
    # Paste Center
    canvas.paste(scaled_key, (106, 90), scaled_key)
    
    for d in OUT_DIRS:
        canvas.save(os.path.join(d, 'key_voto_3x_hd.png'), 'PNG')
    print("Saved: key_voto_3x_hd.png (3x Vote Key Combo)")

build_3x_vote_key_combo()

# 6. Combo Master 4x Keys (Green, Blue, Purple, Gold)
def build_4x_combo_master():
    final_size = 512
    canvas = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
    glow = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    center = final_size // 2
    for r in range(240, 40, -10):
        alpha = int(75 * (1.0 - (r / 240.0)))
        glow_draw.ellipse((center - r, center - r, center + r, center + r), fill=(180, 80, 255, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    canvas.paste(glow, (0, 0), glow)

    def get_scaled(src, bright, mid, dark, outl):
        tmp = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        mapper = recolor_key(src, bright, mid, dark, outl)
        for y in range(16):
            for x in range(16):
                rgba = src.getpixel((x, y))
                if rgba[3] >= 20:
                    tmp.putpixel((x, y), mapper(*rgba))
        return tmp.resize((260, 260), Image.Resampling.NEAREST)

    k_green = get_scaled(ref_green_key, (210, 255, 210, 255), (46, 204, 113, 255), (20, 130, 50, 255), (10, 45, 20, 255))
    k_blue = get_scaled(ref_green_key, (200, 245, 255, 255), (52, 152, 219, 255), (25, 90, 160, 255), (10, 35, 70, 255))
    k_purple = get_scaled(ref_purple_key, (245, 210, 255, 255), (155, 89, 182, 255), (105, 45, 145, 255), (35, 12, 50, 255))
    k_gold = get_scaled(ref_green_key, (255, 245, 180, 255), (241, 196, 15, 255), (211, 84, 0, 255), (60, 25, 5, 255))

    rot_g = k_green.rotate(30, resample=Image.Resampling.NEAREST, expand=True)
    rot_b = k_blue.rotate(10, resample=Image.Resampling.NEAREST, expand=True)
    rot_p = k_purple.rotate(-10, resample=Image.Resampling.NEAREST, expand=True)
    rot_gold = k_gold.rotate(-30, resample=Image.Resampling.NEAREST, expand=True)

    canvas.paste(rot_g, (20, 130), rot_g)
    canvas.paste(rot_b, (95, 105), rot_b)
    canvas.paste(rot_p, (170, 105), rot_p)
    canvas.paste(rot_gold, (245, 130), rot_gold)

    for d in OUT_DIRS:
        canvas.save(os.path.join(d, 'key_combo_4x_hd.png'), 'PNG')
    print("Saved: key_combo_4x_hd.png (4x Master Combo)")

build_4x_combo_master()

# =========================================================================
# 4. ENHANCED VOUCHER DE SKIN ("DA TMB UMA MELHORADA NO VOUCHER SABE")
# =========================================================================
def build_enhanced_voucher():
    # 32x32 pixel art parchment scroll with golden ribbon, wax seal, sword silhouette & magical sparkles
    sc = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sc)
    
    # Outer dark border of rolled parchment
    # Body: x: 5..26, y: 4..27
    paper_border = (50, 35, 25, 255)
    paper_bg = (235, 215, 175, 255)
    paper_shadow = (205, 180, 140, 255)
    paper_dark = (175, 145, 105, 255)
    
    # Rolled top
    for x in range(6, 26):
        sc.putpixel((x, 3), paper_border)
        sc.putpixel((x, 4), paper_dark)
        sc.putpixel((x, 5), paper_shadow)
    # Rolled bottom
    for x in range(6, 26):
        sc.putpixel((x, 26), paper_shadow)
        sc.putpixel((x, 27), paper_dark)
        sc.putpixel((x, 28), paper_border)
    # Sides
    for y in range(4, 28):
        sc.putpixel((5, y), paper_border)
        sc.putpixel((26, y), paper_border)
        for x in range(6, 26):
            if y not in (3, 4, 5, 26, 27, 28):
                sc.putpixel((x, y), paper_bg)
    
    # Golden decorative ribbon across diagonal
    gold_hi = (255, 235, 120, 255)
    gold_mid = (255, 193, 7, 255)
    gold_dark = (195, 130, 0, 255)
    
    # Wax seal in center (x: 13..18, y: 13..18)
    wax_border = (130, 20, 20, 255)
    wax_mid = (215, 40, 40, 255)
    wax_hi = (255, 90, 80, 255)
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            dist = dx*dx + dy*dy
            if dist <= 8:
                sc.putpixel((16 + dx, 16 + dy), wax_mid)
            elif dist <= 12:
                sc.putpixel((16 + dx, 16 + dy), wax_border)
    sc.putpixel((15, 15), wax_hi)
    sc.putpixel((16, 15), wax_hi)
    
    # Golden star crest on wax seal
    sc.putpixel((16, 16), gold_hi)
    sc.putpixel((15, 16), gold_mid)
    sc.putpixel((17, 16), gold_mid)
    sc.putpixel((16, 15), gold_mid)
    sc.putpixel((16, 17), gold_mid)
    
    # Weapon silhouettes (Pixel sword on top-left, pickaxe on bottom-right)
    sword_c = (90, 75, 65, 255)
    for i in range(4):
        sc.putpixel((8 + i, 8 + i), sword_c)
    sc.putpixel((7, 10), sword_c)
    sc.putpixel((9, 12), sword_c)
    
    # Sparkles
    sparkle = (255, 255, 255, 255)
    sc.putpixel((3, 6), sparkle)
    sc.putpixel((28, 7), sparkle)
    sc.putpixel((4, 23), sparkle)
    sc.putpixel((28, 24), sparkle)
    
    # Scale to 512x512
    final_size = 512
    canvas = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
    glow = Image.new('RGBA', (final_size, final_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    center = final_size // 2
    for r in range(230, 40, -10):
        alpha = int(75 * (1.0 - (r / 230.0)))
        glow_draw.ellipse((center - r, center - r, center + r, center + r), fill=(255, 193, 7, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    canvas.paste(glow, (0, 0), glow)
    
    scaled = sc.resize((410, 410), Image.Resampling.NEAREST)
    canvas.paste(scaled, (51, 51), scaled)
    
    for d in OUT_DIRS:
        canvas.save(os.path.join(d, 'voucher_skin_pixel_hd.png'), 'PNG')
    print("Saved: voucher_skin_pixel_hd.png (Enhanced Skin Voucher)")

build_enhanced_voucher()

print("ALL ASSETS SUCCESSFULLY GENERATED & SAVED TO BOTH LOCAL AND PUBLIC FOLDERS!")
