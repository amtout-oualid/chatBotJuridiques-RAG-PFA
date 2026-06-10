import urllib.request
import json

url = "http://127.0.0.1:8000/editor/compile"
data = {"latex_code": "test"}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as f:
        print("Status:", f.status)
        print("Body:", f.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", type(e), e)
