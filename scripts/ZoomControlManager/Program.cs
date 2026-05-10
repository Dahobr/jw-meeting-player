using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using System.Collections.Generic;
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

        static void Main(string[] args)
        {
            string mode = "semi";
            int x = -1, y = -1;

            foreach (var arg in args)
            {
                if (arg.StartsWith("--mode=")) mode = arg.Substring(7);
                else if (arg.StartsWith("--x=")) x = int.Parse(arg.Substring(4));
                else if (arg.StartsWith("--y=")) y = int.Parse(arg.Substring(4));
            }

            if (mode == "auto")
            {
                if (x != -1 && y != -1)
                {
                    MonitorShareFlow(x, y);
                }
                else
                {
                    CaptureAndMonitor();
                }
            }
            else if (mode == "semi")
            {
                SendAltS();
            }
        }

        static void CaptureAndMonitor()
        {
            Console.WriteLine("[C#] Triggering Alt+S and waiting for capture...");
            SendAltS();
            
            int capturedX = -1, capturedY = -1;
            Color capturedColor = Color.Empty;

            hookId = SetWindowsHookEx(WH_MOUSE_LL, (nCode, wParam, lParam) => {
                if (nCode >= 0 && wParam == (IntPtr)WM_LBUTTONDBLCLK)
                {
                    Point p;
                    GetCursorPos(out p);
                    capturedX = p.X;
                    capturedY = p.Y;
                    capturedColor = GetAverageColor(p.X, p.Y, 4);
                    
                    Console.WriteLine(string.Format("[C#] COORDS:{0},{1}", p.X, p.Y));
                    Application.Exit();
                }
                return CallNextHookEx(hookId, nCode, wParam, lParam);
            }, IntPtr.Zero, 0);

            Application.Run();
            UnhookWindowsHookEx(hookId);

            if (capturedX != -1)
            {
                Console.WriteLine("[C#] Monitoring for completion...");
                
                // 1. Wait for color to stabilize (in case sharing transition is still moving)
                for (int i = 0; i < 10; i++)
                {
                    Thread.Sleep(100);
                    if (ColorsAreClose(GetAverageColor(capturedX, capturedY, 4), capturedColor, 10))
                        break;
                }

                // 2. Monitor for change
                for (int i = 0; i < 200; i++)
                {
                    Thread.Sleep(500);
                    if (!ColorsAreClose(GetAverageColor(capturedX, capturedY, 4), capturedColor, 20))
                    {
                        Console.WriteLine("[C#] COMPLETED");
                        break;
                    }
                }
            }
        }

        static void MonitorShareFlow(int x, int y)
        {
            Color initialColor = GetAverageColor(x, y, 4);
            SendAltS();

            bool opened = false;
            for (int i = 0; i < 50; i++)
            {
                Thread.Sleep(200);
                if (!ColorsAreClose(GetAverageColor(x, y, 4), initialColor, 20))
                {
                    opened = true;
                    break;
                }
            }

            if (opened)
            {
                Thread.Sleep(300);
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
                Thread.Sleep(100);
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
                
                Console.WriteLine("[C#] STARTED");

                // Monitor for window closure (color returns to initial)
                for (int i = 0; i < 200; i++) 
                {
                    Thread.Sleep(500);
                    if (ColorsAreClose(GetAverageColor(x, y, 4), initialColor, 20))
                    {
                        Console.WriteLine("[C#] COMPLETED");
                        break;
                    }
                }
            }
        }

        static Color GetAverageColor(int x, int y, int radius)
        {
            int totalR = 0, totalG = 0, totalB = 0;
            int count = 0;

            for (int dx = -radius; dx <= radius; dx++)
            {
                for (int dy = -radius; dy <= radius; dy++)
                {
                    Color c = GetPixelColor(x + dx, y + dy);
                    totalR += c.R;
                    totalG += c.G;
                    totalB += c.B;
                    count++;
                }
            }
            return Color.FromArgb(totalR / count, totalG / count, totalB / count);
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
