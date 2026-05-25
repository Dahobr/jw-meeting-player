using System;
using System.Diagnostics;
using System.Linq;
using System.Windows.Automation;
using System.Threading;

class Program
{
    static void Main()
    {
        // Find the Zoom Workplace process
        Process[] processes = Process.GetProcessesByName("Zoom");
        if (processes.Length == 0)
        {
            Console.WriteLine("Zoom process not found.");
            return;
        }

        // Get the main window handle
        IntPtr hwnd = processes[0].MainWindowHandle;
        if (hwnd == IntPtr.Zero)
        {
            Console.WriteLine("Zoom main window not found.");
            return;
        }

        // Use UI Automation to find the "Configurações" button
        AutomationElement zoomWindow = AutomationElement.FromHandle(hwnd);
        if (zoomWindow == null) return;

        // Condition to find button with specific Name (localized)
        // Note: Portuguese localization used here based on user confirmation
        Condition condition = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button);
        var buttons = zoomWindow.FindAll(TreeScope.Descendants, condition);

        foreach (AutomationElement btn in buttons)
        {
            if (btn.Current.Name.Contains("Configura"))
            {
                InvokePattern invokePattern = btn.GetCurrentPattern(InvokePattern.Pattern) as InvokePattern;
                invokePattern?.Invoke();
                Console.WriteLine("Settings button clicked.");
                return;
            }
        }
    }
}
