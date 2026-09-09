"""Rebuild display data and provenance from the committed Glovo snapshot.

Run from the repository root. Existing owner edits in menu.json are overwritten;
review the diff before accepting a refreshed source snapshot.
"""
import collections
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
source = json.loads((ROOT / 'data/glovo-snapshot.json').read_text(encoding='utf-8'))
labels = {
    'ШАУРМА': 'Шаурма', 'САМЕ ПОПУЛЯРНЕ': 'Популярне', 'ГАРНІРИ': 'Гарніри',
    'КОМБО МЕНЮ': 'Комбо', 'СЕНДВІЧІ': 'Сендвічі', 'БУРГЕРИ': 'Бургери',
    'ХОТ-ДОГ В ЛАВАШІ/В БУЛЦІ': 'Хот-доги', 'Картошка фри': 'Картопля фрі',
    'ВЕГАН': 'Без м’яса', 'ОСНОВНІ СТРАВИ': 'Основні страви',
    'Новинка': 'Новинки', 'Шашлик в Тандирі': 'Тандир', 'НАПОЇ': 'Напої',
}
items = {}
provenance = {}
for row in source['rows']:
    values = [float(re.sub(r'\s', '', value).replace(',', '.'))
              for value in re.findall(r'([\d\s\u00a0]+,\d{2})\s*₴', row['priceText'])]
    if len(values) != 2:
        raise ValueError(f"Unexpected source price: {row['name']}")
    key = (row['name'].strip(), *values)
    ident = hashlib.sha256('|'.join(map(str, key)).encode()).hexdigest()[:12]
    category = labels[row['category'].strip()]
    if ident in items:
        if category not in items[ident]['categories']:
            items[ident]['categories'].append(category)
        if row['description'] not in provenance[ident]['sourceDescriptions']:
            provenance[ident]['sourceDescriptions'].append(row['description'])
        continue
    image = f'/menu/{ident}.webp'
    items[ident] = dict(id=ident, name=key[0], description=row['description'],
                       price=values[0], regularPrice=values[1], categories=[category],
                       image=image if (ROOT / ('public' + image)).exists() else '',
                       available=None, popular=category == 'Популярне', notice=None)
    provenance[ident] = dict(sourceImage=row['image'], sourceSection=row['section'],
                            sourceDescriptions=[row['description']])

counts = collections.Counter(item['name'] for item in items.values())
for item in items.values():
    if counts[item['name']] > 1:
        item['notice'] = 'У Glovo є позиції з такою назвою та різними цінами. Уточніть потрібний варіант у закладі.'
    if item['name'] == 'АРАБСЬКА асорті з яловичиною':
        item['notice'] = 'У Glovo назва вказує яловичину, а опис — курку. Вид м’яса потребує уточнення.'
    if item['name'].startswith(('Сулугуні у лаваші', 'Овочева шаурма')):
        item['notice'] = 'Містить сир. Категорію Glovo «ВЕГАН» не слід вважати підтвердженням веганського складу.'
result = sorted(items.values(), key=lambda item: 'Шаурма' not in item['categories'])
for filename, data in [('menu.json', result), ('menu-provenance.json', provenance)]:
    (ROOT / 'data' / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f"{len(source['rows'])} source rows -> {len(result)} menu entries")
