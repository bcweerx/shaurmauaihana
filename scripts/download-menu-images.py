import json, urllib.request, pathlib, concurrent.futures, io
from PIL import Image
rows=json.loads(pathlib.Path('data/menu.json').read_text(encoding='utf-8'))
provenance=json.loads(pathlib.Path('data/menu-provenance.json').read_text(encoding='utf-8'))
def fetch(p):
    dest=pathlib.Path('public/menu') / (p['id'] + '.webp')
    dest.parent.mkdir(parents=True,exist_ok=True)
    if dest.exists(): return True
    try:
        req=urllib.request.Request(provenance[p['id']]['sourceImage'],headers={'User-Agent':'Mozilla/5.0'})
        blob=urllib.request.urlopen(req,timeout=25).read()
        im=Image.open(io.BytesIO(blob)).convert('RGB');im.thumbnail((480,480));im.save(dest,'WEBP',quality=85)
        return True
    except Exception as e: return p['id']+': '+str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: result=list(pool.map(fetch,rows))
errors=[x for x in result if x is not True]
print(json.dumps({'downloaded':len(result)-len(errors),'errors':errors[:8]}))
