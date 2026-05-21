import os, sys, shutil

home = os.environ.get('LOCALAPPDATA', '')
cand = os.path.join(home, 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64', 'pdflatex.exe')
print(f'cand: {cand}')
print(f'exists: {os.path.isfile(cand)}')
print(f'which: {shutil.which("pdflatex")}')
