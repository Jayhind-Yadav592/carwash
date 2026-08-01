import os

req_path = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\requirements.txt"
if os.path.exists(req_path):
    with open(req_path, 'rb') as f:
        content = f.read()
    print("Raw byte length:", len(content))
    try:
        text = content.decode('utf-8')
        print("Decoded as UTF-8:")
        print(text)
    except Exception as e:
        print("UTF-8 decode failed:", e)
        text_16 = content.decode('utf-16')
        print("Decoded as UTF-16:")
        print(text_16)
