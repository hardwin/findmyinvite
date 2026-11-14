"""Local segmentation only: no image generation and no cloud provider calls."""
import sys
import os
import hashlib
from pathlib import Path
from PIL import Image
from rembg import new_session, remove
source, target = map(Path, sys.argv[1:3])
# Fail before rembg can attempt its automatic model download.
model = Path(os.environ.get('U2NET_HOME', str(Path.home() / '.u2net'))) / 'u2net.onnx'
if not model.is_file():
    raise RuntimeError('The pinned segmentation model is missing')
if hashlib.md5(model.read_bytes()).hexdigest() != '60024c5c889badc19c04ad937298a77b':
    raise RuntimeError('Segmentation model checksum mismatch')
Image.MAX_IMAGE_PIXELS = 30_000_000
im = Image.open(source)
im.load()
from PIL import ImageOps
im = ImageOps.exif_transpose(im)
im.thumbnail((1200, 1600))
session = new_session('u2net')
out = remove(im.convert('RGBA'), session=session, alpha_matting=True)
alpha = out.getchannel('A')
histogram = alpha.histogram()
pixels = out.width * out.height
subject_ratio = sum(histogram[128:]) / pixels
clear_ratio = sum(histogram[:20]) / pixels
if not alpha.getbbox() or not .02 < subject_ratio < .95 or clear_ratio < .05:
    raise ValueError('No useful transparent cutout')
out.save(target, optimize=True)
