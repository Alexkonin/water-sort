from pathlib import Path
root=Path(__file__).resolve().parents[2]
keys=['vihrek','pushinka','tumannik','dreven','kroten','solomennik','gulen','skakunok','semyannitsa','zheludnik','tennik']
files=[root/f'bestiary/{key}/{part}' for key in keys for part in ['art/before-storybook-v134.js',f'animations/{key}.js']]
files += [root/f'bestiary/{part}' for part in ['kamnespin/animations/kamnespin.js','kamnespin/animations/storybook-v03/kamnespin.js','rosnik/animations/rosnik.js','dozhdevik/animations/dozhdevik.js']]
(root/'output/bestiary-storybook-v01/models.js').write_text('\n'.join(p.read_text() for p in files))
