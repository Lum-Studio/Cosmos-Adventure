import struct
import zlib

def make_png(width, height, color_bg, color_border):
    pixels = bytearray()
    for y in range(height):
        pixels.append(0) # filter type 0
        for x in range(width):
            if x == 0 or x == width - 1 or y == 0 or y == height - 1:
                pixels.extend(color_border)
            else:
                pixels.extend(color_bg)
    
    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    
    idat_data = zlib.compress(pixels)
    png += struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + struct.pack('>I', zlib.crc32(b'IDAT' + idat_data) & 0xffffffff)
    
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    return png

with open('RP/textures/ui/cosmos/machines/text_box.png', 'wb') as f:
    f.write(make_png(3, 3, [30, 30, 30, 255], [100, 100, 100, 255]))

with open('RP/textures/ui/cosmos/machines/text_box.json', 'w') as f:
    f.write('{"nineslice_size": 1, "base_size": [3, 3]}')
