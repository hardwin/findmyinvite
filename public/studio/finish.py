"""Export workspace files without asking the model to reproduce the entire HTML."""
import json
import sys
from pathlib import Path
from html.parser import HTMLParser

root = Path('/workspace')
revision = int(sys.argv[1])
html = (root / 'template.html').read_text()
HTMLParser().feed(html)
data = json.loads((root / 'content.json').read_text())
assert isinstance(data, dict)
output = root / 'outputs'
output.mkdir(exist_ok=True)
(output / f'result-{revision}.json').write_text(json.dumps({
    'html': html, 'data': data, 'revision': revision,
    'message': sys.argv[2] if len(sys.argv) > 2 else 'Your invitation is updated.'
}))
print('Validated and exported revision', revision)
