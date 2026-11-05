import os, math
from PIL import Image, ImageDraw

FONT = {
    '[': ['##', '#.', '#.', '#.', '##'],
    ']': ['##', '.#', '.#', '.#', '##'],
    'A': ['###', '#.#', '###', '#.#', '#.#'],
    'B': ['##.', '#.#', '##.', '#.#', '##.'],
    'C': ['###', '#..', '#..', '#..', '###'],
    'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'E': ['###', '#..', '###', '#..', '###'],
    'F': ['###', '#..', '##.', '#..', '#..'],
    'G': ['###', '#..', '#.#', '#.#', '###'],
    'H': ['#.#', '#.#', '###', '#.#', '#.#'],
    'I': ['###', '.#.', '.#.', '.#.', '###'],
    'J': ['..#', '..#', '..#', '#.#', '###'],
    'K': ['#.#', '#.#', '##.', '#.#', '#.#'],
    'L': ['#..', '#..', '#..', '#..', '###'],
    'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
    'N': ['#..#', '##.#', '#.##', '#..#', '#..#'],
    'O': ['###', '#.#', '#.#', '#.#', '###'],
    'P': ['###', '#.#', '###', '#..', '#..'],
    'Q': ['###', '#.#', '#.#', '##.', '..#'],
    'R': ['###', '#.#', '###', '##.', '#.#'],
    'S': ['###', '#..', '###', '..#', '###'],
    'T': ['###', '.#.', '.#.', '.#.', '.#.'],
    'U': ['#.#', '#.#', '#.#', '#.#', '###'],
    'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
    'W': ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
    'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
    'Y': ['#.#', '#.#', '###', '.#.', '.#.'],
    'Z': ['###', '..#', '.#.', '#..', '###']
}

def get_text_width(text):
    return sum(len(FONT.get(ch, FONT['A'])[0]) + 1 for ch in text) - 1

def draw_pixel_text(draw, x_start, y_start, text, color, shadow_color=None, bracket_color=None):
    cur_x = x_start
    if shadow_color:
        sx = x_start + 1
        sy = y_start + 1
        for ch in text:
            mat = FONT.get(ch, FONT['A'])
            w = len(mat[0])
            for r in range(5):
                for c in range(w):
                    if mat[r][c] == '#':
                        draw.point((sx + c, sy + r), fill=shadow_color)
            sx += w + 1
            
    for ch in text:
        mat = FONT.get(ch, FONT['A'])
        w = len(mat[0])
        col = bracket_color if (bracket_color and ch in '[]') else color
        for r in range(5):
            for c in range(w):
                if mat[r][c] == '#':
                    draw.point((cur_x + c, y_start + r), fill=col)
        cur_x += w + 1

def create_vip_compass(cfg):
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = 32, 25
    r_outer = 19
    r_bezel = 18
    r_inner = 15

    # 1. Outer ambient glow / shadow
    for dy in range(-23, 24):
        for dx in range(-23, 24):
            dist = math.hypot(dx, dy)
            if dist <= 23:
                alpha = int(max(0, 1.0 - (dist / 23.0)) * 50)
                ac = cfg['glow_color']
                draw.point((cx + dx, cy + dy), fill=(ac[0], ac[1], ac[2], alpha))

    # Special rays for Solar
    if cfg.get('has_sun_rays'):
        for angle_deg in range(0, 360, 45):
            rad = math.radians(angle_deg)
            for dist in range(18, 25):
                px = int(round(cx + dist * math.cos(rad)))
                py = int(round(cy + dist * math.sin(rad)))
                c = cfg['bezel_hl'] if dist <= 21 else cfg['bezel_mid']
                draw.point((px, py), fill=c)

    # 2. Top suspension ring
    ring_cx, ring_cy = 32, 5
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            d = math.hypot(dx, dy)
            if 1.8 <= d <= 4.2:
                c = cfg['bezel_hl'] if (dx <= 0 and dy <= 0) else cfg['bezel_sh']
                draw.point((ring_cx + dx, ring_cy + dy), fill=c)
            elif 4.2 < d <= 5.0:
                draw.point((ring_cx + dx, ring_cy + dy), fill=cfg['bezel_dark'])

    # 3. Compass Bezel Shadow & Base Circle
    for y in range(cy - r_outer, cy + r_outer + 1):
        for x in range(cx - r_outer, cx + r_outer + 1):
            dist = math.hypot(x - cx, y - cy)
            if dist <= r_outer + 0.5:
                draw.point((x, y), fill=cfg['bezel_dark'])

    # 4. Metallic Bezel Ring with Lighting (Top-left highlight, bottom-right shadow)
    for y in range(cy - r_bezel, cy + r_bezel + 1):
        for x in range(cx - r_bezel, cx + r_bezel + 1):
            dist = math.hypot(x - cx, y - cy)
            if r_inner < dist <= r_bezel:
                angle = math.atan2(y - cy, x - cx)
                light = - (math.cos(angle) + math.sin(angle)) / 1.414
                if light > 0.35:
                    col = cfg['bezel_hl']
                elif light > -0.2:
                    col = cfg['bezel_mid']
                else:
                    col = cfg['bezel_sh']
                draw.point((x, y), fill=col)

    # 5. Four Cardinal Rivets/Markers
    rivets = [
        (cx, cy - r_bezel + 1),  # N
        (cx, cy + r_bezel - 1),  # S
        (cx - r_bezel + 1, cy),  # W
        (cx + r_bezel - 1, cy),  # E
        (cx - 12, cy - 12),      # NW
        (cx + 12, cy - 12),      # NE
        (cx - 12, cy + 12),      # SW
        (cx + 12, cy + 12)       # SE
    ]
    for rx, ry in rivets:
        draw.point((rx, ry), fill=cfg['rivet_hl'])
        draw.point((rx + 1, ry), fill=cfg['rivet_sh'])
        draw.point((rx, ry + 1), fill=cfg['rivet_sh'])

    # 6. Dial Background
    for y in range(cy - r_inner, cy + r_inner + 1):
        for x in range(cx - r_inner, cx + r_inner + 1):
            dist = math.hypot(x - cx, y - cy)
            if dist <= r_inner:
                grad = dist / r_inner
                base_c = cfg['dial_bg']
                col = (
                    int(base_c[0] * (1.1 - grad * 0.3)),
                    int(base_c[1] * (1.1 - grad * 0.3)),
                    int(base_c[2] * (1.1 - grad * 0.3)),
                    255
                )
                draw.point((x, y), fill=col)

    # 7. Dial Ring & Cardinal Ticks
    for y in range(cy - 12, cy + 13):
        for x in range(cx - 12, cx + 13):
            dist = math.hypot(x - cx, y - cy)
            if 11.2 <= dist <= 12.5:
                draw.point((x, y), fill=cfg['dial_ring'])

    # Ticks
    for d in range(9, 13):
        draw.point((cx, cy - d), fill=cfg['dial_tick']) # N
        draw.point((cx, cy + d), fill=cfg['dial_tick']) # S
        draw.point((cx - d, cy), fill=cfg['dial_tick']) # W
        draw.point((cx + d, cy), fill=cfg['dial_tick']) # E

    # 8. Compass Needle (Pivot at cx, cy)
    # North Needle (Sharp diamond tip pointing UP)
    needle_len_n = 12
    needle_width = 3
    for y_offset in range(1, needle_len_n + 1):
        cur_y = cy - y_offset
        w = max(0, int(needle_width * (1.0 - (y_offset / needle_len_n))))
        for dx in range(-w, 0):
            draw.point((cx + dx, cur_y), fill=cfg['needle_n_hl'])
        draw.point((cx, cur_y), fill=cfg['needle_n_hl'])
        for dx in range(1, w + 1):
            draw.point((cx + dx, cur_y), fill=cfg['needle_n_sh'])
    draw.point((cx, cy - needle_len_n), fill=(255, 255, 255, 255))

    # South Needle
    needle_len_s = 7
    for y_offset in range(1, needle_len_s + 1):
        cur_y = cy + y_offset
        w = max(0, int(needle_width * (1.0 - (y_offset / needle_len_s))))
        for dx in range(-w, 0):
            draw.point((cx + dx, cur_y), fill=cfg['needle_s_hl'])
        draw.point((cx, cur_y), fill=cfg['needle_s_hl'])
        for dx in range(1, w + 1):
            draw.point((cx + dx, cur_y), fill=cfg['needle_s_sh'])

    # Center Pivot Pin
    draw.point((cx - 1, cy - 1), fill=cfg['pin_color'])
    draw.point((cx,     cy - 1), fill=cfg['pin_color'])
    draw.point((cx + 1, cy - 1), fill=cfg['bezel_sh'])
    draw.point((cx - 1, cy),     fill=cfg['pin_color'])
    draw.point((cx,     cy),     fill=(255, 255, 255))
    draw.point((cx + 1, cy),     fill=cfg['bezel_sh'])
    draw.point((cx - 1, cy + 1), fill=cfg['bezel_sh'])
    draw.point((cx,     cy + 1), fill=cfg['bezel_sh'])
    draw.point((cx + 1, cy + 1), fill=cfg['bezel_dark'])

    # Ambient Sparkles/Embers
    for sx, sy in cfg.get('sparkles', []):
        draw.point((sx, sy), fill=cfg['sparkle_color'])
        draw.point((sx + 1, sy), fill=(cfg['sparkle_color'][0], cfg['sparkle_color'][1], cfg['sparkle_color'][2], 120))
        draw.point((sx, sy + 1), fill=(cfg['sparkle_color'][0], cfg['sparkle_color'][1], cfg['sparkle_color'][2], 120))

    # 9. FOREGROUND TAG BANNER PLATE
    tag_text = cfg['tag']
    tw = get_text_width(tag_text)
    pad_x = 4
    plate_w = tw + pad_x * 2
    plate_x0 = max(2, (64 - plate_w) // 2)
    plate_x1 = plate_x0 + plate_w
    plate_y0 = 46
    plate_y1 = 57

    # Drop shadow of the plate
    for py in range(plate_y0 + 1, plate_y1 + 2):
        for px in range(plate_x0 + 1, plate_x1 + 2):
            draw.point((px, py), fill=(0, 0, 0, 180))

    # Outer border of plate
    for py in range(plate_y0, plate_y1 + 1):
        for px in range(plate_x0, plate_x1 + 1):
            if px in (plate_x0, plate_x1) or py in (plate_y0, plate_y1):
                if (px in (plate_x0, plate_x1)) and (py in (plate_y0, plate_y1)):
                    continue
                draw.point((px, py), fill=cfg['plate_border'])
            else:
                if py == plate_y0 + 1:
                    draw.point((px, py), fill=cfg['plate_top_hl'])
                else:
                    draw.point((px, py), fill=cfg['plate_bg'])

    # Corner gems on plate
    draw.point((plate_x0 + 2, plate_y0 + 3), fill=cfg['tag_bracket_col'])
    draw.point((plate_x0 + 2, plate_y0 + 4), fill=cfg['tag_bracket_col'])
    draw.point((plate_x1 - 2, plate_y0 + 3), fill=cfg['tag_bracket_col'])
    draw.point((plate_x1 - 2, plate_y0 + 4), fill=cfg['tag_bracket_col'])

    # Render pixel text
    text_x = plate_x0 + pad_x
    text_y = plate_y0 + 3
    draw_pixel_text(
        draw,
        text_x,
        text_y,
        tag_text,
        color=cfg['tag_text_col'],
        shadow_color=cfg['tag_shadow_col'],
        bracket_color=cfg['tag_bracket_col']
    )

    hd = img.resize((512, 512), Image.NEAREST)
    return hd

VIP_CONFIGS = {
    'vip-vendaval': {
        'tag': '[VENDAVAL]',
        'glow_color': (224, 242, 254),
        'bezel_dark': (15, 23, 42),
        'bezel_hl': (241, 245, 249),
        'bezel_mid': (148, 163, 184),
        'bezel_sh': (71, 85, 105),
        'rivet_hl': (255, 255, 255),
        'rivet_sh': (51, 65, 85),
        'dial_bg': (15, 23, 42),
        'dial_ring': (56, 189, 248, 140),
        'dial_tick': (224, 242, 254),
        'needle_n_hl': (255, 255, 255),
        'needle_n_sh': (186, 230, 253),
        'needle_s_hl': (100, 116, 139),
        'needle_s_sh': (51, 65, 85),
        'pin_color': (224, 242, 254),
        'sparkle_color': (224, 242, 254),
        'sparkles': [(12, 14), (52, 12), (10, 36), (54, 38)],
        'plate_bg': (10, 16, 26),
        'plate_top_hl': (56, 189, 248),
        'plate_border': (148, 163, 184),
        'tag_text_col': (255, 255, 255),
        'tag_shadow_col': (15, 23, 42),
        'tag_bracket_col': (56, 189, 248)
    },
    'vip-flamejante': {
        'tag': '[FLAMEJANTE]',
        'glow_color': (255, 87, 34),
        'bezel_dark': (35, 12, 8),
        'bezel_hl': (255, 171, 145),
        'bezel_mid': (216, 67, 21),
        'bezel_sh': (92, 36, 24),
        'rivet_hl': (255, 214, 0),
        'rivet_sh': (140, 40, 10),
        'dial_bg': (24, 8, 6),
        'dial_ring': (255, 87, 34, 150),
        'dial_tick': (255, 171, 145),
        'needle_n_hl': (255, 235, 59),
        'needle_n_sh': (255, 61, 0),
        'needle_s_hl': (142, 36, 17),
        'needle_s_sh': (78, 20, 10),
        'pin_color': (255, 214, 0),
        'sparkle_color': (255, 171, 0),
        'sparkles': [(11, 16), (51, 14), (9, 34), (53, 36)],
        'plate_bg': (20, 8, 6),
        'plate_top_hl': (255, 110, 64),
        'plate_border': (216, 67, 21),
        'tag_text_col': (255, 87, 34),
        'tag_shadow_col': (40, 10, 5),
        'tag_bracket_col': (255, 214, 0)
    },
    'vip-carvalho': {
        'tag': '[CARVALHO]',
        'glow_color': (230, 126, 34),
        'bezel_dark': (35, 20, 10),
        'bezel_hl': (245, 176, 65),
        'bezel_mid': (184, 115, 51),
        'bezel_sh': (90, 50, 20),
        'rivet_hl': (248, 196, 113),
        'rivet_sh': (120, 66, 18),
        'dial_bg': (28, 17, 10),
        'dial_ring': (230, 126, 34, 140),
        'dial_tick': (245, 176, 65),
        'needle_n_hl': (248, 196, 113),
        'needle_n_sh': (211, 84, 0),
        'needle_s_hl': (120, 66, 18),
        'needle_s_sh': (60, 32, 10),
        'pin_color': (245, 176, 65),
        'sparkle_color': (243, 156, 18),
        'sparkles': [(12, 13), (50, 15), (11, 35), (51, 37)],
        'plate_bg': (22, 13, 8),
        'plate_top_hl': (243, 156, 18),
        'plate_border': (184, 115, 51),
        'tag_text_col': (243, 156, 18),
        'tag_shadow_col': (35, 18, 6),
        'tag_bracket_col': (248, 196, 113)
    },
    'vip-aurora': {
        'tag': '[AURORA]',
        'glow_color': (255, 193, 7),
        'bezel_dark': (45, 30, 5),
        'bezel_hl': (255, 241, 118),
        'bezel_mid': (255, 193, 7),
        'bezel_sh': (153, 101, 21),
        'rivet_hl': (255, 255, 255),
        'rivet_sh': (153, 101, 21),
        'dial_bg': (28, 20, 4),
        'dial_ring': (255, 193, 7, 160),
        'dial_tick': (255, 241, 118),
        'needle_n_hl': (255, 255, 255),
        'needle_n_sh': (255, 193, 7),
        'needle_s_hl': (183, 129, 3),
        'needle_s_sh': (104, 73, 0),
        'pin_color': (255, 255, 255),
        'sparkle_color': (255, 213, 79),
        'sparkles': [(10, 14), (52, 13), (12, 34), (52, 36)],
        'plate_bg': (22, 16, 4),
        'plate_top_hl': (255, 213, 79),
        'plate_border': (255, 193, 7),
        'tag_text_col': (255, 193, 7),
        'tag_shadow_col': (40, 25, 3),
        'tag_bracket_col': (255, 241, 118)
    },
    'vip-solar': {
        'tag': '[SOLAR]',
        'has_sun_rays': True,
        'glow_color': (255, 213, 79),
        'bezel_dark': (45, 20, 2),
        'bezel_hl': (255, 245, 157),
        'bezel_mid': (255, 213, 79),
        'bezel_sh': (230, 81, 0),
        'rivet_hl': (255, 255, 255),
        'rivet_sh': (230, 81, 0),
        'dial_bg': (32, 16, 2),
        'dial_ring': (255, 213, 79, 180),
        'dial_tick': (255, 245, 157),
        'needle_n_hl': (255, 255, 255),
        'needle_n_sh': (255, 213, 79),
        'needle_s_hl': (230, 81, 0),
        'needle_s_sh': (140, 45, 0),
        'pin_color': (255, 255, 255),
        'sparkle_color': (255, 245, 157),
        'sparkles': [(11, 11), (53, 11), (11, 37), (53, 37)],
        'plate_bg': (24, 12, 2),
        'plate_top_hl': (255, 213, 79),
        'plate_border': (255, 160, 0),
        'tag_text_col': (255, 213, 79),
        'tag_shadow_col': (45, 15, 0),
        'tag_bracket_col': (255, 245, 157)
    },
    'vip-deusa': {
        'tag': '[DEUSA]',
        'glow_color': (224, 86, 253),
        'bezel_dark': (25, 4, 38),
        'bezel_hl': (245, 180, 255),
        'bezel_mid': (224, 86, 253),
        'bezel_sh': (74, 21, 75),
        'rivet_hl': (255, 255, 255),
        'rivet_sh': (123, 31, 162),
        'dial_bg': (14, 3, 24),
        'dial_ring': (224, 86, 253, 160),
        'dial_tick': (245, 180, 255),
        'needle_n_hl': (255, 255, 255),
        'needle_n_sh': (224, 86, 253),
        'needle_s_hl': (123, 31, 162),
        'needle_s_sh': (74, 21, 75),
        'pin_color': (255, 255, 255),
        'sparkle_color': (245, 180, 255),
        'sparkles': [(10, 13), (52, 14), (10, 35), (54, 37)],
        'plate_bg': (18, 5, 28),
        'plate_top_hl': (224, 86, 253),
        'plate_border': (190, 46, 221),
        'tag_text_col': (224, 86, 253),
        'tag_shadow_col': (30, 4, 45),
        'tag_bracket_col': (245, 180, 255)
    }
}

target_dirs = [
    r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\images\products',
    r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\public\images\products',
    r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\products\VIPS',
    r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\public\products\VIPS'
]
for d in target_dirs:
    os.makedirs(d, exist_ok=True)

legacy_map = {
    'vip-vendaval': 'membro.png',
    'vip-flamejante': 'vip_aura.png',
    'vip-carvalho': 'aventureiro.png',
    'vip-aurora': 'vip_astro.png',
    'vip-solar': 'vip_celestial.png',
    'vip-deusa': 'vip_eclipse.png'
}

for vip_id, cfg in VIP_CONFIGS.items():
    hd = create_vip_compass(cfg)
    clean_id = vip_id.replace('-', '_')
    filename = f'{clean_id}_hd.png'
    p1 = os.path.join(r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\images\products', filename)
    p2 = os.path.join(r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\public\images\products', filename)
    hd.save(p1)
    hd.save(p2)
    print(f'Saved {filename} ({hd.size})')

    leg_name = legacy_map[vip_id]
    p3 = os.path.join(r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\products\VIPS', leg_name)
    p4 = os.path.join(r'c:\RAVOK\RAVOK OUTONAL\SITE\offline_ravok_web\public\products\VIPS', leg_name)
    hd.save(p3)
    hd.save(p4)
    print(f'Mirrored to {leg_name}')

print('ALL 6 VIP COMPASS IMAGES GENERATED SUCCESSFULLY!')
