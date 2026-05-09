import pyautogui
import os
import sys
import time
import json
from PIL import ImageGrab

# アセットフォルダのパスをログに出力
assets_dir = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Daichi\AppData\Roaming\Electron\JwMeetingPlayer\zoom-assets"
print(f"DEBUG: Assets directory is: {assets_dir}")
print(f"DEBUG: Assets directory exists: {os.path.exists(assets_dir)}")

# フラグファイルとキャッシュファイル
flag_file = os.path.join(assets_dir, "zoom_already_optimized.flag")
cache_file = os.path.join(assets_dir, "zoom_coords.json")

def load_cache():
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"DEBUG: Failed to load cache: {e}")
            return {}
    return {}

def save_cache(cache):
    try:
        with open(cache_file, "w") as f:
            json.dump(cache, f)
    except Exception as e:
        print(f"DEBUG: Failed to save cache: {e}")

def save_debug_screenshot(filename):
    debug_path = os.path.join(assets_dir, filename)
    try:
        img = ImageGrab.grab()
        img.save(debug_path)
        print(f"DEBUG: Screenshot successfully saved to {debug_path}")
    except Exception as e:
        print(f"DEBUG: Failed to save screenshot to {debug_path}: {e}")

# メイン処理開始
try:
    print("DEBUG: Sequence starting...")
    
    # 起動時にフラグを削除
    if os.path.exists(flag_file):
        print(f"DEBUG: Removing flag file: {flag_file}")
        try:
            os.remove(flag_file)
        except OSError as e:
            print(f"DEBUG: Failed to remove flag file: {e}")

    def click_image(image_name, double_click=False, retries=10, interval=0.2):
        cache = load_cache()
        image_path = os.path.join(assets_dir, image_name)
        print(f"DEBUG: Checking for image: {image_path}, exists: {os.path.exists(image_path)}")
        
        if image_name in cache:
            pos = cache[image_name]
            print(f"DEBUG: Attempting cached click for {image_name} at {pos}")
            try:
                if double_click:
                    pyautogui.doubleClick(pos[0], pos[1])
                else:
                    pyautogui.click(pos[0], pos[1])
                return True
            except Exception as e:
                print(f"DEBUG: Cached click failed: {e}")

        if not os.path.exists(image_path):
            print(f"DEBUG: Asset not found: {image_path}")
            return False
        
    for i in range(retries):
        try:
            # 画像を探す
            location = pyautogui.locateOnScreen(image_path, confidence=0.6, grayscale=True)
            if location:
                center = pyautogui.center(location)
                cache[image_name] = [center.x, center.y]
                save_cache(cache)
                if double_click:
                    pyautogui.doubleClick(center)
                else:
                    pyautogui.click(center)
                print(f"DEBUG: Clicked and cached {image_name}")
                return True
        except Exception as e:
            print(f"DEBUG: Attempt {i+1} exception: {e}")
        time.sleep(interval)
        
    # 全ての試行が終わった後に強制保存
    print(f"DEBUG: Max retries reached for {image_name}. Saving debug screenshot.")
    save_debug_screenshot(f"debug_failed_{image_name}.png")
    print(f"DEBUG: Failed to find {image_name}")
    return False

    click_image("otimize.png", retries=10, interval=0.2)
    time.sleep(0.5)
    click_image("tela2.png", double_click=True, retries=10, interval=0.2)
    print("DEBUG: Sequence finished.")

except Exception as e:
    print(f"DEBUG: Script crashed: {e}")
    save_debug_screenshot("debug_screenshot_crash.png")
    sys.exit(1)
