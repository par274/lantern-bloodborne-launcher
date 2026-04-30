using System.Runtime.InteropServices;
using System.Runtime.Versioning;

[SupportedOSPlatform("windows")]
internal sealed class WindowsGamePauseController : IGamePauseController
{
    private const ushort VkF9 = 0x78;
    private const uint WmKeyDown = 0x0100;
    private const uint WmKeyUp = 0x0101;
    private const uint KeyEventKeyUp = 0x0002;
    private const uint MapVkToVsc = 0;

    public void TogglePause(IntPtr targetWindowHandle)
    {
        if (targetWindowHandle != IntPtr.Zero && IsWindow(targetWindowHandle))
        {
            SendF9ToWindow(targetWindowHandle);
            return;
        }

        SendF9();
    }

    private static void SendF9ToWindow(IntPtr targetWindowHandle)
    {
        var scanCode = MapVirtualKey(VkF9, MapVkToVsc);
        var keyDownLParam = new IntPtr(1 | ((int)scanCode << 16));
        var keyUpLParam = new IntPtr(1 | ((int)scanCode << 16) | (1 << 30) | unchecked((int)0x80000000));

        _ = PostMessage(targetWindowHandle, WmKeyDown, new IntPtr(VkF9), keyDownLParam);
        _ = PostMessage(targetWindowHandle, WmKeyUp, new IntPtr(VkF9), keyUpLParam);
    }

    private static void SendF9()
    {
        var inputs = new[]
        {
            CreateKeyboardInput(VkF9, 0),
            CreateKeyboardInput(VkF9, KeyEventKeyUp)
        };

        _ = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf<NativeInput>());
    }

    private static NativeInput CreateKeyboardInput(ushort keyCode, uint flags)
    {
        return new NativeInput
        {
            Type = 1,
            Data = new NativeInputData
            {
                Keyboard = new KeyboardInput
                {
                    VirtualKeyCode = keyCode,
                    Flags = flags
                }
            }
        };
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct NativeInput
    {
        public uint Type;
        public NativeInputData Data;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct NativeInputData
    {
        [FieldOffset(0)]
        public KeyboardInput Keyboard;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KeyboardInput
    {
        public ushort VirtualKeyCode;
        public ushort ScanCode;
        public uint Flags;
        public uint Time;
        public IntPtr ExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint inputCount, NativeInput[] inputs, int inputSize);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool IsWindow(IntPtr windowHandle);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool PostMessage(IntPtr windowHandle, uint message, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern uint MapVirtualKey(uint code, uint mapType);
}
