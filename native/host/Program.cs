using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

internal static class Program
{
    private const string NestedAppDirectoryName = "app0";
    private const string LauncherDirectoryName = "LanternLauncher";
    private const string LauncherEmuDirectoryName = "emu";
    private const string LauncherConfigFileName = "config.json";
    private const string HostPortEnvironmentName = "LANTERN_HOST_PORT";
    private const string HostTokenEnvironmentName = "LANTERN_HOST_TOKEN";
    private const string NativeDevEnvironmentName = "LANTERN_NATIVE_DEV";
    private const string DevElectronPathEnvironmentName = "LANTERN_DEV_ELECTRON_PATH";
    private const string DevAppPathEnvironmentName = "LANTERN_DEV_APP_PATH";
    private const string SingleInstanceMutexName = "LanternLauncher.Host.SingleInstance";
    private const int RelatedProcessDiscoveryTimeoutMs = 4000;
    private const int RelatedProcessDiscoveryIntervalMs = 250;
    private const int EmbeddedWindowDiscoveryTimeoutMs = 15000;
    private const int EmbeddedWindowResizeIntervalMs = 100;
    private const int GamepadOverlayTogglePollIntervalMs = 80;
    private const int SwRestore = 9;
    private const int GwlStyle = -16;
    private const long WsChild = 0x40000000L;
    private const long WsPopup = 0x80000000L;
    private const long WsCaption = 0x00C00000L;
    private const long WsThickFrame = 0x00040000L;
    private const long WsMinimizeBox = 0x00020000L;
    private const long WsMaximizeBox = 0x00010000L;
    private const long WsSysMenu = 0x00080000L;
    private static readonly IntPtr HwndTop = IntPtr.Zero;
    private const uint SwpFrameChanged = 0x0020;
    private const uint SwpShowWindow = 0x0040;
    private const uint ErrorSuccess = 0;
    private const ushort XInputGamepadLeftThumb = 0x0040;
    private const ushort XInputGamepadRightThumb = 0x0080;

    private static readonly HashSet<string> CommonIgnoredExecutableNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "app"
    };

    private static readonly HashSet<string> WindowsIgnoredExecutableNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "app.exe",
        "chrome_proxy.exe",
        "crashpad_handler.exe",
        "elevate",
        "elevate.exe",
        "notification_helper.exe",
        "Update.exe"
    };

    private static readonly HashSet<string> UnixIgnoredExecutableNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "chrome-sandbox",
        "chrome_crashpad_handler"
    };

    private static string ProductName =>
        Assembly.GetEntryAssembly()?.GetCustomAttribute<AssemblyProductAttribute>()?.Product?.Trim()
        ?? LauncherDirectoryName;

    private static async Task<int> Main(string[] args)
    {
        var options = HostOptions.Parse(args);
        var output = new NativeHostOutput();
        using var singleInstanceLock = TryAcquireSingleInstanceLock(output);
        if (singleInstanceLock is null)
        {
            return 0;
        }

        output.WriteHostLine("Started LanternLauncher host.");

        try
        {
            if (options.SkipGui)
            {
                return await LaunchGameFromConfig(output);
            }

            return await LaunchElectronAppShell(args, output);
        }
        catch (Exception exception)
        {
            output.WriteHostLine($"Fatal error: {exception.Message}");

            if (!options.SkipGui)
            {
                ShowError($"LanternLauncher failed to start.\n\n{exception.Message}");
            }

            return 1;
        }
    }

    private static Mutex? TryAcquireSingleInstanceLock(NativeHostOutput output)
    {
        try
        {
            var mutex = new Mutex(initiallyOwned: true, SingleInstanceMutexName, out var isFirstInstance);
            if (isFirstInstance)
            {
                return mutex;
            }

            mutex.Dispose();
            output.WriteHostLine("Another LanternLauncher host instance is already running.");
            return null;
        }
        catch (Exception exception)
        {
            output.WriteHostLine($"Single-instance lock could not be created: {exception.Message}");
            return null;
        }
    }

    private static async Task<int> LaunchElectronAppShell(string[] args, NativeHostOutput output)
    {
        var isNativeDevMode = IsNativeDevMode();
        var launcherDirectory = AppContext.BaseDirectory;
        var appDirectory = isNativeDevMode
            ? ResolveDevAppDirectory()
            : Path.Combine(launcherDirectory, ResolveNestedAppDirectoryName());
        var innerExecutablePath = isNativeDevMode
            ? ResolveDevElectronExecutablePath()
            : ResolveInnerExecutablePath(appDirectory);

        if (innerExecutablePath is null)
        {
            throw new FileNotFoundException("The launcher executable could not be resolved.");
        }

        using var commandServer = new HostCommandServer(output);
        commandServer.Start();

        using var serverCancellation = new CancellationTokenSource();
        var serverTask = commandServer.RunAsync(serverCancellation.Token);

        try
        {
            while (true)
            {
                var startInfo = CreateElectronStartInfo(innerExecutablePath, appDirectory, args, commandServer, isNativeDevMode);
                using var process = Process.Start(startInfo);

                if (process is null)
                {
                    throw new InvalidOperationException("The embedded launcher process could not be started.");
                }

                output.WriteHostLine("Started LanternLauncher UI.");
                await process.WaitForExitAsync();
                output.WriteHostLine("LanternLauncher UI closed.");

                var gameTask = commandServer.TakeGameTaskForUiRelaunch();
                if (gameTask is null)
                {
                    return process.ExitCode;
                }

                output.WriteHostLine("LanternLauncher UI suspended while shadPS4 is running.");

                try
                {
                    await gameTask;
                }
                catch (Exception exception)
                {
                    output.WriteHostLine($"shadPS4 launch flow failed: {exception.Message}");
                }
                finally
                {
                    commandServer.ClearGameTaskIfCurrent(gameTask);
                }

                output.WriteHostLine("Restarting LanternLauncher UI.");
            }
        }
        finally
        {
            serverCancellation.Cancel();
            commandServer.Stop();

            try
            {
                await serverTask;
            }
            catch (OperationCanceledException)
            {
                // Expected while the host is shutting down.
            }
        }
    }

    private static ProcessStartInfo CreateElectronStartInfo(
        string innerExecutablePath,
        string appDirectory,
        string[] args,
        HostCommandServer commandServer,
        bool isNativeDevMode
    )
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = innerExecutablePath,
            WorkingDirectory = Path.GetDirectoryName(innerExecutablePath) ?? appDirectory,
            UseShellExecute = false
        };

        startInfo.Environment[HostPortEnvironmentName] = commandServer.Port.ToString();
        startInfo.Environment[HostTokenEnvironmentName] = commandServer.Token;

        if (isNativeDevMode)
        {
            startInfo.ArgumentList.Add(appDirectory);
        }

        foreach (var arg in args)
        {
            startInfo.ArgumentList.Add(arg);
        }

        return startInfo;
    }

    private static bool IsNativeDevMode()
    {
        var value = Environment.GetEnvironmentVariable(NativeDevEnvironmentName);

        return string.Equals(value, "1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveDevAppDirectory()
    {
        var appPath = Environment.GetEnvironmentVariable(DevAppPathEnvironmentName);

        return Path.GetFullPath(string.IsNullOrWhiteSpace(appPath) ? Directory.GetCurrentDirectory() : appPath);
    }

    private static string ResolveDevElectronExecutablePath()
    {
        var electronPath = Environment.GetEnvironmentVariable(DevElectronPathEnvironmentName);

        if (string.IsNullOrWhiteSpace(electronPath))
        {
            throw new InvalidOperationException($"{DevElectronPathEnvironmentName} is required in native dev mode.");
        }

        electronPath = Path.GetFullPath(electronPath);

        if (!File.Exists(electronPath))
        {
            throw new FileNotFoundException("Electron executable was not found for native dev mode.", electronPath);
        }

        return electronPath;
    }

    private static string ResolveNestedAppDirectoryName()
    {
        return NestedAppDirectoryName;
    }

    private static async Task<int> LaunchGameFromConfig(
        NativeHostOutput output,
        Func<GameLaunchContext, Task>? onStarted = null
    )
    {
        await Task.Yield();

        var launchConfig = ReadDirectLaunchConfig();
        var startInfo = new ProcessStartInfo
        {
            FileName = launchConfig.Shadps4ExecutablePath,
            WorkingDirectory = Path.GetDirectoryName(launchConfig.Shadps4ExecutablePath) ?? AppContext.BaseDirectory,
            UseShellExecute = false,
            CreateNoWindow = false
        };

        startInfo.ArgumentList.Add(launchConfig.BloodborneTitleId);

        using var process = new Process
        {
            StartInfo = startInfo,
            EnableRaisingEvents = true
        };

        output.WriteHostLine("Starting shadPS4.");
        var startedAt = DateTimeOffset.Now;

        if (!process.Start())
        {
            throw new InvalidOperationException("shadPS4 could not be started.");
        }

        output.WriteHostLine("shadPS4 started.");

        if (onStarted is not null)
        {
            try
            {
                await onStarted(new GameLaunchContext(process, launchConfig, startedAt));
            }
            catch (Exception exception)
            {
                output.WriteHostLine($"Launch client disconnected after shadPS4 started: {exception.Message}");
            }
        }

        await process.WaitForExitAsync();
        process.WaitForExit();
        await WaitForRelatedShadps4ProcessExit(launchConfig, process.Id, startedAt, output);
        output.WriteHostLine("shadPS4 closed.");

        return process.ExitCode;
    }

    private static void StopGame(
        DirectLaunchConfig launchConfig,
        Process primaryProcess,
        DateTimeOffset startedAt,
        NativeHostOutput output
    )
    {
        output.WriteHostLine("Stop game requested.");
        TryStopProcess(primaryProcess, output);

        using var relatedProcess = FindRelatedShadps4Process(launchConfig, primaryProcess.Id, startedAt);
        if (relatedProcess is not null)
        {
            TryStopProcess(relatedProcess, output);
        }
    }

    private static void TryStopProcess(Process process, NativeHostOutput output)
    {
        try
        {
            if (process.HasExited)
            {
                return;
            }

            try
            {
                if (process.CloseMainWindow() && process.WaitForExit(2500))
                {
                    return;
                }
            }
            catch
            {
                // Some shadPS4 helper processes do not expose a main window.
            }

            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }
        }
        catch (Exception exception)
        {
            output.WriteHostLine($"Could not stop shadPS4 process {process.Id}: {exception.Message}");
        }
    }

    private static async Task WaitForRelatedShadps4ProcessExit(
        DirectLaunchConfig launchConfig,
        int primaryProcessId,
        DateTimeOffset startedAt,
        NativeHostOutput output
    )
    {
        var relatedProcess = await WaitForRelatedShadps4Process(launchConfig, primaryProcessId, startedAt);

        if (relatedProcess is null)
        {
            return;
        }

        using (relatedProcess)
        {
            output.WriteHostLine("Waiting for shadPS4 to close.");

            try
            {
                await relatedProcess.WaitForExitAsync();
            }
            catch (InvalidOperationException)
            {
                // The related process can exit between discovery and wait registration.
            }
        }
    }

    private static async Task<Process?> WaitForRelatedShadps4Process(
        DirectLaunchConfig launchConfig,
        int primaryProcessId,
        DateTimeOffset startedAt
    )
    {
        var deadline = DateTimeOffset.Now.AddMilliseconds(RelatedProcessDiscoveryTimeoutMs);

        while (DateTimeOffset.Now < deadline)
        {
            var relatedProcess = FindRelatedShadps4Process(launchConfig, primaryProcessId, startedAt);

            if (relatedProcess is not null)
            {
                return relatedProcess;
            }

            await Task.Delay(RelatedProcessDiscoveryIntervalMs);
        }

        return null;
    }

    private static async Task<IntPtr> EmbedShadps4WindowInParent(
        GameLaunchContext context,
        IntPtr parentWindowHandle,
        NativeHostOutput output
    )
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            throw new PlatformNotSupportedException("Embedded shadPS4 windows are only supported on Windows.");
        }

        if (parentWindowHandle == IntPtr.Zero || !IsWindow(parentWindowHandle))
        {
            throw new InvalidOperationException("Electron game host window is not available.");
        }

        var childWindowHandle = await WaitForShadps4WindowHandle(context);

        if (childWindowHandle == IntPtr.Zero)
        {
            throw new InvalidOperationException("shadPS4 did not expose a window for embedding.");
        }

        output.WriteHostLine("Embedding shadPS4 window into LanternLauncher UI.");
        ConfigureEmbeddedWindow(childWindowHandle, parentWindowHandle);

        _ = Task.Run(() => TrackEmbeddedWindowBounds(childWindowHandle, parentWindowHandle));
        return childWindowHandle;
    }

    private static async Task<IntPtr> WaitForShadps4WindowHandle(GameLaunchContext context)
    {
        var deadline = DateTimeOffset.Now.AddMilliseconds(EmbeddedWindowDiscoveryTimeoutMs);

        while (DateTimeOffset.Now < deadline)
        {
            context.Process.Refresh();

            if (context.Process.MainWindowHandle != IntPtr.Zero)
            {
                return context.Process.MainWindowHandle;
            }

            using var relatedProcess = FindRelatedShadps4Process(
                context.LaunchConfig,
                context.Process.Id,
                context.StartedAt
            );

            if (relatedProcess?.MainWindowHandle is { } handle && handle != IntPtr.Zero)
            {
                return handle;
            }

            await Task.Delay(RelatedProcessDiscoveryIntervalMs);
        }

        return IntPtr.Zero;
    }

    private static void ConfigureEmbeddedWindow(IntPtr childWindowHandle, IntPtr parentWindowHandle)
    {
        _ = SetParent(childWindowHandle, parentWindowHandle);

        var style = GetWindowLongPtr(childWindowHandle, GwlStyle).ToInt64();
        style &= ~(WsPopup | WsCaption | WsThickFrame | WsMinimizeBox | WsMaximizeBox | WsSysMenu);
        style |= WsChild;
        _ = SetWindowLongPtr(childWindowHandle, GwlStyle, new IntPtr(style));

        ResizeEmbeddedWindow(childWindowHandle, parentWindowHandle);
        SetEmbeddedWindowOverlayVisibility(childWindowHandle, parentWindowHandle, overlayVisible: false);
    }

    private static void TrackEmbeddedWindowBounds(IntPtr childWindowHandle, IntPtr parentWindowHandle)
    {
        while (IsWindow(childWindowHandle) && IsWindow(parentWindowHandle))
        {
            ResizeEmbeddedWindow(childWindowHandle, parentWindowHandle);
            Thread.Sleep(EmbeddedWindowResizeIntervalMs);
        }
    }

    private static void ResizeEmbeddedWindow(IntPtr childWindowHandle, IntPtr parentWindowHandle)
    {
        if (!GetClientRect(parentWindowHandle, out var rect))
        {
            return;
        }

        var width = Math.Max(1, rect.Right - rect.Left);
        var height = Math.Max(1, rect.Bottom - rect.Top);

        _ = MoveWindow(childWindowHandle, 0, 0, width, height, true);
    }

    private static void SetEmbeddedWindowOverlayVisibility(
        IntPtr childWindowHandle,
        IntPtr parentWindowHandle,
        bool overlayVisible
    )
    {
        if (!GetClientRect(parentWindowHandle, out var rect))
        {
            return;
        }

        var width = Math.Max(1, rect.Right - rect.Left);
        var height = Math.Max(1, rect.Bottom - rect.Top);
        if (overlayVisible)
        {
            _ = MoveWindow(childWindowHandle, 0, 0, width, height, true);
            return;
        }

        _ = SetWindowPos(childWindowHandle, HwndTop, 0, 0, width, height, SwpFrameChanged | SwpShowWindow);
        _ = SetFocus(childWindowHandle);
    }

    private static Process? FindRelatedShadps4Process(
        DirectLaunchConfig launchConfig,
        int primaryProcessId,
        DateTimeOffset startedAt
    )
    {
        var processName = Path.GetFileNameWithoutExtension(launchConfig.Shadps4ExecutablePath);

        if (string.IsNullOrWhiteSpace(processName))
        {
            return null;
        }

        foreach (var process in Process.GetProcessesByName(processName))
        {
            if (process.Id == primaryProcessId)
            {
                process.Dispose();
                continue;
            }

            if (IsRelatedShadps4Process(process, launchConfig.Shadps4ExecutablePath, startedAt))
            {
                return process;
            }

            process.Dispose();
        }

        return null;
    }

    private static bool IsRelatedShadps4Process(Process process, string executablePath, DateTimeOffset startedAt)
    {
        try
        {
            if (process.HasExited || process.StartTime < startedAt.AddSeconds(-2).DateTime)
            {
                return false;
            }

            var processPath = process.MainModule?.FileName;

            return string.IsNullOrWhiteSpace(processPath)
                || string.Equals(Path.GetFullPath(processPath), Path.GetFullPath(executablePath), StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return true;
        }
    }

    private static DirectLaunchConfig ReadDirectLaunchConfig()
    {
        var configPath = ResolveLauncherConfigPath();

        if (!File.Exists(configPath))
        {
            throw new InvalidOperationException($"Launcher config was not found at {configPath}.");
        }

        using var configStream = File.OpenRead(configPath);
        using var document = JsonDocument.Parse(configStream);
        var root = document.RootElement;
        var bloodborneInstallPath = ReadRequiredString(root, "games", "bloodborne", "installPath");
        var bloodborneTitleId = ReadRequiredString(root, "games", "bloodborne", "titleId");
        var shadps4ExecutablePath = ReadRequiredString(root, "emulator", "shadps4", "executablePath");
        var locale = ReadOptionalString(root, "locale") ?? "en";

        bloodborneInstallPath = Path.GetFullPath(bloodborneInstallPath);
        shadps4ExecutablePath = Path.GetFullPath(shadps4ExecutablePath);

        if (!Directory.Exists(bloodborneInstallPath))
        {
            throw new DirectoryNotFoundException($"Bloodborne folder does not exist: {bloodborneInstallPath}");
        }

        if (!File.Exists(Path.Combine(bloodborneInstallPath, "eboot.bin")))
        {
            throw new FileNotFoundException("Bloodborne eboot.bin was not found.", Path.Combine(bloodborneInstallPath, "eboot.bin"));
        }

        if (!File.Exists(shadps4ExecutablePath))
        {
            throw new FileNotFoundException("shadPS4 executable was not found.", shadps4ExecutablePath);
        }

        return new DirectLaunchConfig(bloodborneInstallPath, bloodborneTitleId, shadps4ExecutablePath, locale);
    }

    private static string ReadRequiredString(JsonElement root, params string[] pathParts)
    {
        var current = root;

        foreach (var pathPart in pathParts)
        {
            if (!current.TryGetProperty(pathPart, out current))
            {
                throw new InvalidOperationException($"Launcher config is missing {string.Join('.', pathParts)}.");
            }
        }

        if (current.ValueKind != JsonValueKind.String)
        {
            throw new InvalidOperationException($"Launcher config value {string.Join('.', pathParts)} must be a string.");
        }

        var value = current.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"Launcher config value {string.Join('.', pathParts)} is empty.");
        }

        return value;
    }

    private static string? ReadOptionalString(JsonElement root, params string[] pathParts)
    {
        var current = root;

        foreach (var pathPart in pathParts)
        {
            if (!current.TryGetProperty(pathPart, out current))
            {
                return null;
            }
        }

        return current.ValueKind == JsonValueKind.String
            ? current.GetString()?.Trim()
            : null;
    }

    private static string ResolveLauncherConfigPath()
    {
        return Path.Combine(
            ResolveLauncherRootPath(),
            LauncherEmuDirectoryName,
            LauncherConfigFileName
        );
    }

    private static string ResolveLauncherRootPath()
    {
        return Path.Combine(ResolveAppDataPath(), LauncherDirectoryName);
    }

    private static string ResolveAppDataPath()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return Environment.GetEnvironmentVariable("APPDATA")
                ?? Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        }

        var homeDirectory = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            return Path.Combine(homeDirectory, "Library", "Application Support");
        }

        var xdgConfigHome = Environment.GetEnvironmentVariable("XDG_CONFIG_HOME");
        return !string.IsNullOrWhiteSpace(xdgConfigHome)
            ? xdgConfigHome
            : Path.Combine(homeDirectory, ".config");
    }

    private static string? ResolveInnerExecutablePath(string appDirectory)
    {
        if (!Directory.Exists(appDirectory))
        {
            return null;
        }

        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            return ResolveMacAppExecutablePath(appDirectory);
        }

        var preferredExecutableName = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? $"{ProductName}.exe"
            : ProductName;
        var preferredPath = Path.Combine(appDirectory, preferredExecutableName);

        if (File.Exists(preferredPath))
        {
            return preferredPath;
        }

        var currentExecutableName = Path.GetFileName(Environment.ProcessPath);

        if (!string.IsNullOrWhiteSpace(currentExecutableName))
        {
            var preferredCurrentPath = Path.Combine(appDirectory, currentExecutableName);

            if (File.Exists(preferredCurrentPath))
            {
                return preferredCurrentPath;
            }
        }

        return Directory.EnumerateFiles(appDirectory, "*", SearchOption.TopDirectoryOnly)
            .Where(IsExecutableCandidate)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private static string? ResolveMacAppExecutablePath(string appDirectory)
    {
        var preferredBundlePath = Path.Combine(appDirectory, $"{ProductName}.app");

        if (Directory.Exists(preferredBundlePath))
        {
            var preferredExecutablePath = ResolveMacBundleExecutablePath(preferredBundlePath);

            if (preferredExecutablePath is not null)
            {
                return preferredExecutablePath;
            }
        }

        foreach (var bundlePath in Directory.EnumerateDirectories(appDirectory, "*.app", SearchOption.TopDirectoryOnly))
        {
            var executablePath = ResolveMacBundleExecutablePath(bundlePath);

            if (executablePath is not null)
            {
                return executablePath;
            }
        }

        return null;
    }

    private static string? ResolveMacBundleExecutablePath(string bundlePath)
    {
        var macOsDirectory = Path.Combine(bundlePath, "Contents", "MacOS");

        if (!Directory.Exists(macOsDirectory))
        {
            return null;
        }

        var preferredExecutablePath = Path.Combine(macOsDirectory, ProductName);

        if (File.Exists(preferredExecutablePath))
        {
            return preferredExecutablePath;
        }

        return Directory.EnumerateFiles(macOsDirectory, "*", SearchOption.TopDirectoryOnly)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private static bool IsExecutableCandidate(string path)
    {
        var fileName = Path.GetFileName(path);

        if (string.IsNullOrWhiteSpace(fileName) || IsIgnoredExecutableName(fileName))
        {
            return false;
        }

        return RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? fileName.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
            : !fileName.Contains('.');
    }

    private static bool IsIgnoredExecutableName(string fileName)
    {
        if (CommonIgnoredExecutableNames.Contains(fileName))
        {
            return true;
        }

        return RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? WindowsIgnoredExecutableNames.Contains(fileName)
            : UnixIgnoredExecutableNames.Contains(fileName);
    }

    private static void ShowError(string message)
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            _ = MessageBox(IntPtr.Zero, message, ProductName, 0x00000010);
            return;
        }

        Console.Error.WriteLine($"{ProductName}: {message}");
    }

    private static string SanitizeProtocolMessage(string message)
    {
        return message.Replace('\r', ' ').Replace('\n', ' ').Trim();
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int MessageBox(IntPtr hWnd, string text, string caption, uint type);

    [DllImport("user32.dll")]
    private static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")]
    private static extern IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")]
    private static extern IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

    [DllImport("user32.dll")]
    private static extern bool GetClientRect(IntPtr hWnd, out NativeRect lpRect);

    [DllImport("user32.dll")]
    private static extern bool MoveWindow(IntPtr hWnd, int x, int y, int width, int height, bool repaint);

    [DllImport("user32.dll")]
    private static extern bool SetWindowPos(
        IntPtr hWnd,
        IntPtr hWndInsertAfter,
        int x,
        int y,
        int cx,
        int cy,
        uint flags
    );

    [DllImport("user32.dll")]
    private static extern IntPtr SetFocus(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern bool IsIconic(IntPtr hWnd);

    [DllImport("xinput1_4.dll", EntryPoint = "XInputGetState")]
    private static extern uint XInputGetState(uint dwUserIndex, out XInputState state);

    [StructLayout(LayoutKind.Sequential)]
    private struct NativeRect
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct XInputState
    {
        public uint PacketNumber;
        public XInputGamepad Gamepad;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct XInputGamepad
    {
        public ushort Buttons;
        public byte LeftTrigger;
        public byte RightTrigger;
        public short ThumbLX;
        public short ThumbLY;
        public short ThumbRX;
        public short ThumbRY;
    }

    private static bool IsGamepadOverlayTogglePressed()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return false;
        }

        try
        {
            for (uint userIndex = 0; userIndex < 4; userIndex++)
            {
                if (XInputGetState(userIndex, out var state) != ErrorSuccess)
                {
                    continue;
                }

                var buttons = state.Gamepad.Buttons;
                if ((buttons & XInputGamepadLeftThumb) != 0 && (buttons & XInputGamepadRightThumb) != 0)
                {
                    return true;
                }
            }
        }
        catch
        {
            return false;
        }

        return false;
    }

    private sealed class HostCommandServer : IDisposable
    {
        private readonly object gameSessionLock = new();
        private readonly SemaphoreSlim gameLaunchLock = new(1, 1);
        private readonly NativeHostOutput output;
        private Task<int>? activeGameTask;
        private GameSession? activeGameSession;
        private IntPtr activeEmbeddedParentWindowHandle;
        private IntPtr activeEmbeddedWindowHandle;
        private bool relaunchUiAfterGame;
        private bool exitHostAfterGame;
        private TcpListener? listener;
        private bool disposed;

        public HostCommandServer(NativeHostOutput output)
        {
            this.output = output;
            Token = Guid.NewGuid().ToString("N");
        }

        public int Port { get; private set; }

        public string Token { get; }

        public Task<int>? TakeGameTaskForUiRelaunch()
        {
            lock (gameSessionLock)
            {
                if (exitHostAfterGame)
                {
                    relaunchUiAfterGame = false;
                    return null;
                }

                if (!relaunchUiAfterGame || activeGameTask is null)
                {
                    return null;
                }

                relaunchUiAfterGame = false;
                return activeGameTask;
            }
        }

        public void ClearGameTaskIfCurrent(Task<int> gameTask)
        {
            lock (gameSessionLock)
            {
                if (activeGameTask == gameTask && gameTask.IsCompleted)
                {
                    activeGameTask = null;
                }
            }
        }

        public void Start()
        {
            listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            Port = ((IPEndPoint)listener.LocalEndpoint).Port;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            if (listener is null)
            {
                throw new InvalidOperationException("Host command server was not started.");
            }

            while (!cancellationToken.IsCancellationRequested)
            {
                TcpClient client;

                try
                {
                    client = await listener.AcceptTcpClientAsync(cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (ObjectDisposedException)
                {
                    break;
                }

                _ = HandleClientAsync(client, cancellationToken);
            }
        }

        public void Stop()
        {
            listener?.Stop();
        }

        public void Dispose()
        {
            if (disposed)
            {
                return;
            }

            disposed = true;
            Stop();
            gameLaunchLock.Dispose();
        }

        private async Task HandleClientAsync(TcpClient client, CancellationToken cancellationToken)
        {
            using var clientReference = client;

            try
            {
                using var stream = client.GetStream();
                using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);
                await using var writer = new StreamWriter(stream, Encoding.UTF8, leaveOpen: true)
                {
                    AutoFlush = true
                };

                var token = (await reader.ReadLineAsync(cancellationToken))?.Trim();
                if (!string.Equals(token, Token, StringComparison.Ordinal))
                {
                    await WriteProtocolLine(writer, "error:unauthorized", cancellationToken);
                    return;
                }

                var command = (await reader.ReadLineAsync(cancellationToken))?.Trim();
                if (string.Equals(command, "launch-game", StringComparison.OrdinalIgnoreCase))
                {
                    output.WriteHostLine("Received launch-game command from LanternLauncher UI.");
                    await HandleLaunchGameCommand(writer, cancellationToken);
                    return;
                }

                if (string.Equals(command, "ping", StringComparison.OrdinalIgnoreCase))
                {
                    await WriteProtocolLine(writer, "ok", cancellationToken);
                    return;
                }

                if (string.Equals(command, "launch-game-embedded", StringComparison.OrdinalIgnoreCase))
                {
                    var parentWindowHandleText = (await reader.ReadLineAsync(cancellationToken))?.Trim();
                    if (!long.TryParse(parentWindowHandleText, out var parentWindowHandleValue))
                    {
                        await WriteProtocolLine(writer, "error:invalid embedded parent window handle", cancellationToken);
                        return;
                    }

                    output.WriteHostLine("Received embedded launch-game command from LanternLauncher UI.");
                    await HandleLaunchGameCommand(writer, cancellationToken, new IntPtr(parentWindowHandleValue));
                    return;
                }

                if (string.Equals(command, "stop-game", StringComparison.OrdinalIgnoreCase))
                {
                    await HandleStopGameCommand(writer, cancellationToken);
                    return;
                }

                if (string.Equals(command, "exit-host-after-game", StringComparison.OrdinalIgnoreCase))
                {
                    await HandleExitHostAfterGameCommand(writer, cancellationToken);
                    return;
                }

                if (string.Equals(command, "toggle-game-pause", StringComparison.OrdinalIgnoreCase))
                {
                    GamePauseController.Create().TogglePause(GetActiveGameWindowHandle());
                    await WriteProtocolLine(writer, "ok", cancellationToken);
                    return;
                }

                if (string.Equals(command, "focus-game-window", StringComparison.OrdinalIgnoreCase))
                {
                    FocusActiveGameWindow();
                    await WriteProtocolLine(writer, "ok", cancellationToken);
                    return;
                }

                if (string.Equals(command, "is-game-window-active", StringComparison.OrdinalIgnoreCase))
                {
                    await WriteProtocolLine(writer, IsActiveGameWindowForeground() ? "true" : "false", cancellationToken);
                    return;
                }

                if (string.Equals(command, "set-game-overlay-visible", StringComparison.OrdinalIgnoreCase))
                {
                    var visibleText = (await reader.ReadLineAsync(cancellationToken))?.Trim();
                    if (!bool.TryParse(visibleText, out var visible))
                    {
                        await WriteProtocolLine(writer, "error:invalid overlay visibility", cancellationToken);
                        return;
                    }

                    SetActiveEmbeddedOverlayVisibility(visible);
                    await WriteProtocolLine(writer, "ok", cancellationToken);
                    return;
                }

                await WriteProtocolLine(writer, $"error:unknown command {SanitizeProtocolMessage(command ?? string.Empty)}", cancellationToken);
            }
            catch (OperationCanceledException)
            {
                // Expected while the host is shutting down.
            }
            catch (Exception exception)
            {
                output.WriteHostLine($"Host command client failed: {exception.Message}");
            }
        }

        private async Task HandleLaunchGameCommand(
            StreamWriter writer,
            CancellationToken cancellationToken,
            IntPtr? embeddedParentWindowHandle = null
        )
        {
            if (!await gameLaunchLock.WaitAsync(0, cancellationToken))
            {
                output.WriteHostLine("Launch-game command rejected because Bloodborne is already running.");
                await WriteProtocolLine(writer, "error:Bloodborne is already running.", cancellationToken);
                return;
            }

            using var writerLock = new SemaphoreSlim(1, 1);
            using var overlayToggleCancellation = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            var overlayToggleTask = Task.CompletedTask;

            try
            {
                output.WriteHostLine("Starting Bloodborne launch task.");
                var startSignal = new TaskCompletionSource<int>(TaskCreationOptions.RunContinuationsAsynchronously);
                GameSession? session = null;
                var gameTask = LaunchGameFromConfig(output, async (context) =>
                {
                    session = new GameSession(context.Process, context.LaunchConfig, context.StartedAt);
                    SetActiveGameSession(session);

                    if (embeddedParentWindowHandle is { } parentWindowHandle)
                    {
                        var embeddedWindowHandle = await EmbedShadps4WindowInParent(context, parentWindowHandle, output);
                        SetActiveEmbeddedWindow(parentWindowHandle, embeddedWindowHandle);
                    }

                    startSignal.TrySetResult(context.Process.Id);
                });

                SetActiveGameTask(gameTask);

                if (embeddedParentWindowHandle is null)
                {
                    MarkUiRelaunchAfterGame(gameTask);
                }

                var firstCompletedTask = await Task.WhenAny(startSignal.Task, gameTask);
                if (firstCompletedTask == gameTask)
                {
                    await gameTask;
                    await TryWriteProtocolLineLocked("error:shadPS4 closed before startup completed.", cancellationToken);
                    return;
                }

                await TryWriteProtocolLineLocked($"started:{await startSignal.Task}", cancellationToken);

                overlayToggleTask = WatchGamepadOverlayToggleAsync(
                    TryWriteProtocolLineLocked,
                    IsActiveGameWindowForeground,
                    overlayToggleCancellation.Token
                );

                var exitCode = await gameTask;

                overlayToggleCancellation.Cancel();
                await IgnoreCancellation(overlayToggleTask);
                await TryWriteProtocolLineLocked($"exited:{exitCode}", cancellationToken);
            }
            catch (Exception exception)
            {
                output.WriteHostLine($"Launch-game command failed: {exception}");
                await TryWriteProtocolLineLocked($"error:{SanitizeProtocolMessage(exception.Message)}", cancellationToken);
            }
            finally
            {
                overlayToggleCancellation.Cancel();
                await IgnoreCancellation(overlayToggleTask);
                ClearActiveGameSession();
                gameLaunchLock.Release();
            }

            async Task<bool> TryWriteProtocolLineLocked(string message, CancellationToken token)
            {
                try
                {
                    await writerLock.WaitAsync(token);
                }
                catch
                {
                    return false;
                }

                try
                {
                    return await TryWriteProtocolLine(writer, message, token);
                }
                finally
                {
                    writerLock.Release();
                }
            }
        }

        private async Task HandleStopGameCommand(StreamWriter writer, CancellationToken cancellationToken)
        {
            var session = GetActiveGameSession();

            if (session is null)
            {
                await WriteProtocolLine(writer, "ok", cancellationToken);
                return;
            }

            StopGame(session.LaunchConfig, session.Process, session.StartedAt, output);
            await WriteProtocolLine(writer, "ok", cancellationToken);
        }

        private async Task HandleExitHostAfterGameCommand(StreamWriter writer, CancellationToken cancellationToken)
        {
            lock (gameSessionLock)
            {
                exitHostAfterGame = true;
                relaunchUiAfterGame = false;
            }

            var session = GetActiveGameSession();

            if (session is not null)
            {
                StopGame(session.LaunchConfig, session.Process, session.StartedAt, output);
            }

            await WriteProtocolLine(writer, "ok", cancellationToken);
        }

        private static Task WriteProtocolLine(StreamWriter writer, string message, CancellationToken cancellationToken)
        {
            return writer.WriteLineAsync(message.AsMemory(), cancellationToken);
        }

        private static async Task<bool> TryWriteProtocolLine(StreamWriter writer, string message, CancellationToken cancellationToken)
        {
            try
            {
                await WriteProtocolLine(writer, message, cancellationToken);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static async Task WatchGamepadOverlayToggleAsync(
            Func<string, CancellationToken, Task<bool>> writeProtocolLine,
            Func<bool> canOpenOverlay,
            CancellationToken cancellationToken
        )
        {
            var isToggleHeld = IsGamepadOverlayTogglePressed();

            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    var isTogglePressed = IsGamepadOverlayTogglePressed();

                    if (isTogglePressed && !isToggleHeld && canOpenOverlay())
                    {
                        await writeProtocolLine("overlay-toggle", cancellationToken);
                    }

                    isToggleHeld = isTogglePressed;
                    await Task.Delay(GamepadOverlayTogglePollIntervalMs, cancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                // Expected when the game session ends.
            }
        }

        private static async Task IgnoreCancellation(Task task)
        {
            try
            {
                await task;
            }
            catch (OperationCanceledException)
            {
                // Expected when the game session ends.
            }
        }

        private void SetActiveGameTask(Task<int> gameTask)
        {
            lock (gameSessionLock)
            {
                activeGameTask = gameTask;
                relaunchUiAfterGame = false;
            }
        }

        private void SetActiveGameSession(GameSession session)
        {
            lock (gameSessionLock)
            {
                activeGameSession = session;
            }
        }

        private GameSession? GetActiveGameSession()
        {
            lock (gameSessionLock)
            {
                return activeGameSession;
            }
        }

        private void ClearActiveGameSession()
        {
            lock (gameSessionLock)
            {
                activeGameSession = null;
                activeEmbeddedParentWindowHandle = IntPtr.Zero;
                activeEmbeddedWindowHandle = IntPtr.Zero;
            }
        }

        private void SetActiveEmbeddedWindow(IntPtr parentWindowHandle, IntPtr embeddedWindowHandle)
        {
            lock (gameSessionLock)
            {
                activeEmbeddedParentWindowHandle = parentWindowHandle;
                activeEmbeddedWindowHandle = embeddedWindowHandle;
            }
        }

        private void SetActiveEmbeddedOverlayVisibility(bool visible)
        {
            IntPtr parentWindowHandle;
            IntPtr embeddedWindowHandle;

            lock (gameSessionLock)
            {
                parentWindowHandle = activeEmbeddedParentWindowHandle;
                embeddedWindowHandle = activeEmbeddedWindowHandle;
            }

            if (parentWindowHandle == IntPtr.Zero || embeddedWindowHandle == IntPtr.Zero)
            {
                return;
            }

            SetEmbeddedWindowOverlayVisibility(embeddedWindowHandle, parentWindowHandle, visible);
        }

        private IntPtr GetActiveGameWindowHandle()
        {
            GameSession? session;
            IntPtr embeddedWindowHandle;

            lock (gameSessionLock)
            {
                session = activeGameSession;
                embeddedWindowHandle = activeEmbeddedWindowHandle;
            }

            if (embeddedWindowHandle != IntPtr.Zero)
            {
                return embeddedWindowHandle;
            }

            if (session is null)
            {
                return IntPtr.Zero;
            }

            try
            {
                session.Process.Refresh();

                return session.Process.HasExited
                    ? IntPtr.Zero
                    : session.Process.MainWindowHandle;
            }
            catch
            {
                return IntPtr.Zero;
            }
        }

        private void FocusActiveGameWindow()
        {
            var windowHandle = GetActiveGameWindowHandle();

            if (windowHandle == IntPtr.Zero || !IsWindow(windowHandle))
            {
                return;
            }

            if (IsIconic(windowHandle))
            {
                _ = ShowWindow(windowHandle, SwRestore);
            }

            _ = BringWindowToTop(windowHandle);
            _ = SetForegroundWindow(windowHandle);
            _ = SetFocus(windowHandle);
        }

        private bool IsActiveGameWindowForeground()
        {
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return GetActiveGameSession() is not null;
            }

            var foregroundWindowHandle = GetForegroundWindow();
            if (foregroundWindowHandle == IntPtr.Zero)
            {
                return false;
            }

            var gameWindowHandle = GetActiveGameWindowHandle();
            if (gameWindowHandle != IntPtr.Zero && foregroundWindowHandle == gameWindowHandle)
            {
                return true;
            }

            _ = GetWindowThreadProcessId(foregroundWindowHandle, out var foregroundProcessId);
            var session = GetActiveGameSession();

            return session is not null && foregroundProcessId == session.Process.Id;
        }

        private void MarkUiRelaunchAfterGame(Task<int> gameTask)
        {
            lock (gameSessionLock)
            {
                if (activeGameTask == gameTask)
                {
                    relaunchUiAfterGame = true;
                }
            }
        }

    }

    private sealed class NativeHostOutput
    {
        private readonly object syncRoot = new();
        private readonly string logFilePath = Path.Combine(ResolveLauncherRootPath(), "host.log");

        public void WriteHostLine(string message)
        {
            WriteLine("host", message);
        }

        private void WriteLine(string source, string message)
        {
            var line = $"[{DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss.fff zzz}] [{source}] {message}";

            lock (syncRoot)
            {
                Console.WriteLine(line);

                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(logFilePath)!);
                    File.AppendAllText(logFilePath, $"{line}{Environment.NewLine}", Encoding.UTF8);
                }
                catch
                {
                    // Logging must never affect the launcher lifecycle.
                }
            }
        }
    }

    private sealed record HostOptions(bool SkipGui)
    {
        public static HostOptions Parse(string[] args)
        {
            return new HostOptions(
                args.Any((arg) =>
                    string.Equals(arg, "-n", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--no-headless", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--skip-gui", StringComparison.OrdinalIgnoreCase)
                )
            );
        }
    }

    private sealed record DirectLaunchConfig(
        string BloodborneInstallPath,
        string BloodborneTitleId,
        string Shadps4ExecutablePath,
        string Locale
    );

    private sealed record GameLaunchContext(
        Process Process,
        DirectLaunchConfig LaunchConfig,
        DateTimeOffset StartedAt
    );

    private sealed record GameSession(
        Process Process,
        DirectLaunchConfig LaunchConfig,
        DateTimeOffset StartedAt
    );
}
