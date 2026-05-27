using System;
using System.Diagnostics;
using System.Windows.Automation;

class Program
{
    static void Main()
    {
        // 1. Get all Zoom processes
        Process[] processes = Process.GetProcessesByName("Zoom");
        
        foreach (var proc in processes)
        {
            if (proc.MainWindowHandle == IntPtr.Zero) continue;

            try
            {
                // 2. Try to find the "Configurações" button in this window
                AutomationElement window = AutomationElement.FromHandle(proc.MainWindowHandle);
                if (window == null) continue;

                Condition btnCondition = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button);
                var buttons = window.FindAll(TreeScope.Descendants, btnCondition);

                foreach (AutomationElement btn in buttons)
                {
                    // Check for the specific button name
                    if (btn.Current.Name != null && btn.Current.Name.Contains("Configura"))
                    {
                        InvokePattern invokePattern = btn.GetCurrentPattern(InvokePattern.Pattern) as InvokePattern;
                        if (invokePattern != null)
                        {
                            invokePattern.Invoke();
                            Console.WriteLine("Settings button clicked successfully.");
                            return;
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Ignore windows where access is denied or UI Automation fails
                continue;
            }
        }
        Console.WriteLine("Could not find a Zoom window with the settings button.");
    }
}
