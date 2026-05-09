using System;
using System.Windows.Forms;

namespace ZoomKeySender
{
    class Program
    {
        static void Main(string[] args)
        {
            // Send Alt+S
            SendKeys.SendWait("%s");
        }
    }
}
