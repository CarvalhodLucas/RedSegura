import os
from PIL import Image

def make_favicon():
    img_path = 'assets/logo-redsegura-valencia.png'
    if not os.path.exists(img_path):
        img_path = 'redsegura_valencia_logo.png'
    
    print(f"Loading image from: {img_path}")
    im = Image.open(img_path)
    
    # 1. Get bounding box of content
    bbox = im.getbbox()
    print("Content bounding box:", bbox)
    
    # 2. Crop to content bounding box
    cropped = im.crop(bbox)
    w, h = cropped.size
    print(f"Cropped size: {w}x{h}")
    
    # 3. Locate the symbol (the first element before the first vertical gap)
    # Let's inspect column transparency to find the gap
    import numpy as np
    alpha = np.array(cropped.split()[-1])
    col_sums = alpha.sum(axis=0)
    
    # Find the first column where sum is 0 (or very close to 0, e.g. < 0.01 * 255 * h)
    threshold = 0.01 * 255 * h
    gap_cols = np.where(col_sums < threshold)[0]
    
    symbol_end = w
    if len(gap_cols) > 0:
        # Find the first gap of significant width or just the first gap
        # We know there's a gap around 678. Let's find the first gap column after some minimum width (e.g. 100px)
        for col in gap_cols:
            if col > 100:
                symbol_end = col
                break
                
    print(f"Detected symbol end column: {symbol_end}")
    
    # Crop to the symbol
    symbol = cropped.crop((0, 0, symbol_end, h))
    sw, sh = symbol.size
    print(f"Symbol size: {sw}x{sh}")
    
    # If the detected symbol is too narrow (e.g. less than 30% of height), 
    # it might be a mistake, in which case we fall back to the entire cropped logo.
    if sw < 0.3 * sh or sw > 0.95 * w:
        print("Symbol detection seems off. Falling back to entire cropped logo.")
        symbol = cropped
        sw, sh = symbol.size
        
    # 4. Pad to square
    max_dim = max(sw, sh)
    square_im = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
    
    # Center the image
    x_offset = (max_dim - sw) // 2
    y_offset = (max_dim - sh) // 2
    square_im.paste(symbol, (x_offset, y_offset))
    print(f"Padded to square of size: {max_dim}x{max_dim}")
    
    # 5. Save as ICO with sizes 16x16, 32x32, 48x48
    favicon_path = 'favicon.ico'
    sizes = [(16, 16), (32, 32), (48, 48)]
    square_im.save(favicon_path, format='ICO', sizes=sizes)
    print(f"Successfully saved favicon to {favicon_path} with sizes {sizes}")

if __name__ == '__main__':
    make_favicon()
