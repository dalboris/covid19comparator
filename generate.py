#!/usr/bin/python3
#

from pathlib import Path
import re
import shutil

data_dir = Path("data")
src_dir = Path("src")
out_dir = Path("out")

covid19_file = data_dir / "data.json"

# Create or clear out dir
if out_dir.exists():
    shutil.rmtree(str(out_dir))
out_dir.mkdir()

# Copy files which don't have to be modified
shutil.copy(str(src_dir / ".htaccess"), str(out_dir))
shutil.copy(str(src_dir / "style.css"), str(out_dir))
shutil.copy(str(src_dir / "index.htm"), str(out_dir))
shutil.copy(str(src_dir / "ogimage.jpg"), str(out_dir))

# Copy covid19.js while replacing test data with real data
data = (data_dir / "data.json").read_text()
covid19 = (src_dir / "covid19.js").read_text()
covid19 = re.sub('////START_DATA////.*////END_DATA////', "covid19Data_ = " + data, covid19, flags=re.DOTALL)
(out_dir / "covid19.js").write_text(covid19)
