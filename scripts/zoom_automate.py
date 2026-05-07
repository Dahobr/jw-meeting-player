import pyautogui
import os
import sys
import time

# アセットフォルダのパス
assets_dir = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Daichi\AppData\Roaming\Electron\JwMeetingPlayer\zoom-assets"

# 初回フラグ（最適化クリック済み管理）
flag_file = os.path.join(assets_dir, "zoom_already_optimized.flag")

def click_image(image_name, double_click=False):
    image_path = os.path.join(assets_dir, image_name)
    if not os.path.exists(image_path):
        print(f"Error: Asset not found at {image_path}")
        return False
    
    # 画像を探す
    location = pyautogui.locateOnScreen(image_path, confidence=0.8)
    if location:
        center = pyautogui.center(location)
        if double_click:
            pyautogui.doubleClick(center)
        else:
            pyautogui.click(center)
        print(f"Clicked {image_name}")
        return True
    else:
        print(f"Could not find {image_name}")
        return False

# メイン処理
time.sleep(1) # Zoomダイアログが開くのを待つ

# 初回かどうかをファイルでチェック
if not os.path.exists(flag_file):
    if click_image("otimize.png"):
        time.sleep(0.5)
        # クリック成功したらフラグを作成
        with open(flag_file, "w") as f:
            f.write("done")
else:
    print("Optimization already clicked previously. Skipping.")

# 画面共有の選択（これは毎回実行）
click_image("tela2.png", double_click=True)
