import json
import os

for folder,dirs,files in os.walk("bubble_contour"):
    for file in files:
        with open(folder+"/"+file,"r") as r:
            content = r.read()
            content.replace("#ff0000",)
