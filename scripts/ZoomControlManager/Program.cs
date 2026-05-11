using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using System.Collections.Generic;

namespace ZoomControlManager
{
    class Program
    {
        [DllImport("user32.dll")]
        static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
        private const int MOUSEEVENTF_LEFTDOWN = 0x02;
        private const int MOUSEEVENTF_LEFTUP = 0x04;

        [DllImport("user32.dll")]
        static extern bool SetCursorPos(int x, int y);

        [DllImport("user32.dll")]
        static extern bool GetCursorPos(out Point lpPoint);

        [DllImport("user32.dll")]
        static extern IntPtr SetWindowsHookEx(int idHook, MouseHookDelegate lpfn, IntPtr hMod, uint dwThreadId);
        
        [DllImport("user32.dll")]
        static extern bool UnhookWindowsHookEx(IntPtr hhk);
        
        [DllImport("user32.dll")]
        static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        static extern uint GetDoubleClickTime();

        [DllImport("user32.dll")]
        static extern IntPtr GetDC(IntPtr hwnd);

        [DllImport("user32.dll")]
        static extern int ReleaseDC(IntPtr hwnd, IntPtr hdc);

        [DllImport("gdi32.dll")]
        static extern uint GetPixel(IntPtr hdc, int nXPos, int nYPos);

        private delegate IntPtr MouseHookDelegate(int nCode, IntPtr wParam, IntPtr lParam);
        private const int WH_MOUSE_LL = 14;
        private const int WM_LBUTTONDOWN = 0x0201;

        private static IntPtr hookId = IntPtr.Zero;
        private static DateTime lastClickTime = DateTime.MinValue;

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
            Console.WriteLine("[C#] Triggering Alt+S and waiting for double-click capture...");
            Console.Out.Flush();
            SendAltS();
            
            int capturedX = -1, capturedY = -1;
            Color capturedColor = Color.Empty;
            uint dbClickTime = GetDoubleClickTime();

            hookId = SetWindowsHookEx(WH_MOUSE_LL, (nCode, wParam, lParam) => {
                if (nCode >= 0 && wParam == (IntPtr)WM_LBUTTONDOWN)
                {
                    DateTime now = DateTime.Now;
                    if ((now - lastClickTime).TotalMilliseconds <= dbClickTime)
                    {
                        // Double-click detected!
                        Point p;
                        GetCursorPos(out p);
                        capturedX = p.X;
                        capturedY = p.Y;
                        capturedColor = GetColorAt(p.X, p.Y);
                        
                        Console.WriteLine(string.Format("[C#] COORDS:{0},{1}", p.X, p.Y));
                        // Crucial: Also send STARTED here so JS resumes playback immediately
                        Console.WriteLine("[C#] STARTED");
                        Console.Out.Flush();
                        Application.Exit();
                    }
                    lastClickTime = now;
                }
                return CallNextHookEx(hookId, nCode, wParam, lParam);
            }, IntPtr.Zero, 0);

            Application.Run();
            UnhookWindowsHookEx(hookId);

            if (capturedX != -1)
            {
                Console.WriteLine("[C#] Monitoring for completion (window close)...");
                Console.Out.Flush();
                
                // Monitor for window closure
                for (int i = 0; i < 200; i++)
                {
                    Thread.Sleep(500);
                    if (!ColorsAreClose(GetColorAt(capturedX, capturedY), capturedColor, 20))
                    {
                        Console.WriteLine("[C#] COMPLETED");
                        Console.Out.Flush();
                        break;
                    }
                }
            }
        }

        static void MonitorShareFlow(int x, int y)
        {
            Color initialColor = GetColorAt(x, y);
            SendAltS();

            bool opened = false;
            for (int i = 0; i < 50; i++)
            {
                Thread.Sleep(200);
                if (!ColorsAreClose(GetColorAt(x, y), initialColor, 20))
                {
                    opened = true;
                    break;
                }
            }

            if (opened)
            {
                Thread.Sleep(500);
                
                // MOVE MOUSE TO TARGET COORDS
                SetCursorPos(x, y);
                Thread.Sleep(100);

                // Double click automatically
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
                Thread.Sleep(100);
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
                
                Console.WriteLine("[C#] STARTED");
                Console.Out.Flush();

                // Monitor for window closure
                for (int i = 0; i < 200; i++) 
                {
                    Thread.Sleep(500);
                    if (ColorsAreClose(GetColorAt(x, y), initialColor, 20))
                    {
                        Console.WriteLine("[C#] COMPLETED");
                        Console.Out.Flush();
                        break;
                    }
                }
            }
        }

        public static Color GetColorAt(int x, int y)
        {
            IntPtr hdc = GetDC(IntPtr.Zero);
            uint pixel = GetPixel(hdc, x, y);
            ReleaseDC(IntPtr.Zero, hdc);

            byte r = (byte)(pixel & 0x000000FF);
            byte g = (byte)((pixel & 0x0000FF00) >> 8);
            byte b = (byte)((pixel & 0x00FF0000) >> 16);
            return Color.FromArgb(r, g, b);
        }

        static void SendAltS()
        {
            SendKeys.SendWait("%s");
        }

        static bool ColorsAreClose(Color c1, Color c2, int tolerance)
        {
            return Math.Abs(c1.R - c2.R) <= tolerance &&
                   Math.Abs(c1.G - c2.G) <= tolerance &&
                   Math.Abs(c1.B - c2.B) <= tolerance;
        }
    }
}
