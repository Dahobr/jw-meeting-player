using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using System.Collections.Generic;
using System.IO;
using System.Web.Script.Serialization;

namespace ZoomControlManager
{
    class Program
    {
        [DllImport("user32.dll")]
        static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
        private const int MOUSEEVENTF_LEFTDOWN = 0x02;
        private const int MOUSEEVENTF_LEFTUP = 0x04;

        [DllImport("user32.dll")]
        static extern bool GetCursorPos(out Point lpPoint);

        [DllImport("user32.dll")]
        static extern IntPtr SetWindowsHookEx(int idHook, MouseHookDelegate lpfn, IntPtr hMod, uint dwThreadId);
        
        [DllImport("user32.dll")]
        static extern bool UnhookWindowsHookEx(IntPtr hhk);
        
        [DllImport("user32.dll")]
        static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        private delegate IntPtr MouseHookDelegate(int nCode, IntPtr wParam, IntPtr lParam);
        private const int WH_MOUSE_LL = 14;
        private const int WM_LBUTTONDBLCLK = 0x0203;

        private static IntPtr hookId = IntPtr.Zero;

        static string GetConfigPath()
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string dir = Path.Combine(appData, "JwMeetingPlayer");
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            return Path.Combine(dir, "zoom_coords.json");
        }

        static void Main(string[] args)
        {
            string mode = "sendkey";
            foreach (var arg in args)
            {
                if (arg.StartsWith("--mode=")) mode = arg.Substring(7);
            }

            string cachePath = GetConfigPath();
            
            if (mode == "monitor-share" && !File.Exists(cachePath))
            {
                CaptureLoop(cachePath);
                MonitorShareFlow(cachePath);
            }
            else if (mode == "sendkey")
            {
                SendAltS();
            }
            else if (mode == "capture")
            {
                CaptureLoop(cachePath);
            }
            else if (mode == "monitor-share")
            {
                MonitorShareFlow(cachePath);
            }
        }

        static void CaptureLoop(string path)
        {
            hookId = SetWindowsHookEx(WH_MOUSE_LL, (nCode, wParam, lParam) => {
                if (nCode >= 0 && wParam == (IntPtr)WM_LBUTTONDBLCLK)
                {
                    Point p;
                    GetCursorPos(out p);
                    
                    // 1. Capture color at the moment of double-click (Zoom window color)
                    Color windowColor = GetPixelColor(p.X, p.Y);
                    
                    var data = new Dictionary<string, int> { { "x", p.X }, { "y", p.Y } };
                    File.WriteAllText(path, new JavaScriptSerializer().Serialize(data));
                    Console.WriteLine("[C#] Coords saved. Waiting for Zoom window to disappear...");

                    // 2. Wait for color to CHANGE (Zoom window closed)
                    // We check if it's NO LONGER the window color
                    for (int i = 0; i < 200; i++) // Max 20 seconds
                    {
                        Thread.Sleep(100);
                        if (!ColorsAreClose(GetPixelColor(p.X, p.Y), windowColor, 20))
                        {
                            Console.WriteLine("[C#] Zoom window closed detected.");
                            break;
                        }
                    }
                    
                    Thread.Sleep(500); // Wait for transition animation
                    Application.Exit();
                }
                return CallNextHookEx(hookId, nCode, wParam, lParam);
            }, IntPtr.Zero, 0);

            Application.Run();
            UnhookWindowsHookEx(hookId);
        }

        static void MonitorShareFlow(string cachePath)
        {
            if (!File.Exists(cachePath)) return;
            var serializer = new JavaScriptSerializer();
            var cache = serializer.Deserialize<Dictionary<string, int>>(File.ReadAllText(cachePath));
            if (!cache.ContainsKey("x") || !cache.ContainsKey("y")) return;

            int x = cache["x"];
            int y = cache["y"];

            // 1. Capture initial color BEFORE sending Alt+S (Desktop/Background color)
            Color initialColor = GetPixelColor(x, y);
            Console.WriteLine("[C#] Background color captured.");

            // 2. Send Alt+S
            SendAltS();

            // 3. Wait for pixel to CHANGE (Zoom window appeared)
            bool opened = false;
            for (int i = 0; i < 50; i++)
            {
                Thread.Sleep(200);
                if (!ColorsAreClose(GetPixelColor(x, y), initialColor, 20))
                {
                    opened = true;
                    Console.WriteLine("[C#] Zoom window detected.");
                    break;
                }
            }

            if (opened)
            {
                Thread.Sleep(300); // Wait for stability

                // 4. Double click
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
                Thread.Sleep(100);
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
                Console.WriteLine("[C#] Double-click sent.");

                // 5. Wait for pixel to MATCH initial (Zoom window closed)
                for (int i = 0; i < 200; i++) 
                {
                    Thread.Sleep(500);
                    if (ColorsAreClose(GetPixelColor(x, y), initialColor, 20))
                    {
                        Console.WriteLine("[C#] Zoom window closed detected.");
                        break;
                    }
                }
                Thread.Sleep(500);
            }
        }

        static void SendAltS()
        {
            SendKeys.SendWait("%s");
        }

        static Color GetPixelColor(int x, int y)
        {
            using (var bitmap = new Bitmap(1, 1))
            using (var g = Graphics.FromImage(bitmap))
            {
                g.CopyFromScreen(x, y, 0, 0, new Size(1, 1));
                return bitmap.GetPixel(0, 0);
            }
        }

        static bool ColorsAreClose(Color c1, Color c2, int tolerance)
        {
            return Math.Abs(c1.R - c2.R) <= tolerance &&
                   Math.Abs(c1.G - c2.G) <= tolerance &&
                   Math.Abs(c1.B - c2.B) <= tolerance;
        }
    }
}
