"""Read reference assets to locate their numbered green circles. Never modifies images."""
from PIL import Image
from collections import deque
import json
from pathlib import Path

root = Path(__file__).parent
maps = {}
for mode, filename in [('pregnancy', 'mapa-ciazy.png'), ('child', 'mapa-dziecka.png')]:
    im = Image.open(root / 'dist/assets' / filename).convert('RGB')
    w, h = im.size
    pix = im.load()
    points = set()
    for y in range(h):
        for x in range(w):
            r,g,b = pix[x,y]
            if g > 150 and g > r * 1.35 and r > 35 and b < 115:
                points.add((x,y))
    components = []
    while points:
        seed = points.pop()
        q = [seed]
        xmin = xmax = seed[0]
        ymin = ymax = seed[1]
        count = 0
        while q:
            x,y = q.pop()
            count += 1
            xmin, xmax = min(xmin,x), max(xmax,x)
            ymin, ymax = min(ymin,y), max(ymax,y)
            for p in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                if p in points:
                    points.remove(p)
                    q.append(p)
        if count > 4500 and xmax-xmin > 90:
            components.append({'x': round((xmin+xmax)/2,1), 'y': round((ymin+ymax)/2,1), 'w':xmax-xmin+1,'h':ymax-ymin+1,'pixels':count})
    components.sort(key=lambda p:p['y'])
    maps[mode] = {'width':w,'height':h,'points':components}
    print(mode, len(components), components[:3])
(root / 'dist/assets/map-points.json').write_text(json.dumps(maps), encoding='utf-8')
