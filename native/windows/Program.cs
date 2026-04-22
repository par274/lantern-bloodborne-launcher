using System.Diagnostics;
using System.Windows.Forms;

internal static class Program
{
    private static readonly HashSet<string> IgnoredExecutableNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "app.exe",
        "chrome_proxy.exe",
        "crashpad_handler.exe",
        "elevate.exe",
        "notification_helper.exe",
        "Update.exe"
    };

    [STAThread]
    private static int Main(string[] args)
    {
        var launcherDirectory = AppContext.BaseDirectory;
        var appDirectory = Path.Combine(launcherDirectory, "app");
        var innerExecutablePath = ResolveInnerExecutablePath(appDirectory);

        if (innerExecutablePath is null)
        {
            ShowError("The embedded launcher files could not be found in the app folder.");
            return 1;
        }

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = innerExecutablePath,
                WorkingDirectory = Path.GetDirectoryName(innerExecutablePath) ?? appDirectory,
                UseShellExecute = false
            };

            foreach (var arg in args)
            {
                startInfo.ArgumentList.Add(arg);
            }

            using var process = Process.Start(startInfo);

            if (process is null)
            {
                ShowError("The embedded launcher process could not be started.");
                return 1;
            }

            process.WaitForExit();
            return process.ExitCode;
        }
        catch (Exception exception)
        {
            ShowError($"The embedded launcher process failed to start.\n\n{exception.Message}");
            return 1;
        }
    }

    private static string? ResolveInnerExecutablePath(string appDirectory)
    {
        if (!Directory.Exists(appDirectory))
        {
            return null;
        }

        var productExecutableName = $"{Application.ProductName}.exe";

        if (!string.IsNullOrWhiteSpace(productExecutableName))
        {
            var preferredProductPath = Path.Combine(appDirectory, productExecutableName);

            if (File.Exists(preferredProductPath))
            {
                return preferredProductPath;
            }
        }

        var currentExecutableName = Path.GetFileName(Environment.ProcessPath);

        if (!string.IsNullOrWhiteSpace(currentExecutableName))
        {
            var preferredPath = Path.Combine(appDirectory, currentExecutableName);

            if (File.Exists(preferredPath))
            {
                return preferredPath;
            }
        }

        return Directory.EnumerateFiles(appDirectory, "*.exe", SearchOption.TopDirectoryOnly)
            .Where(path => !IgnoredExecutableNames.Contains(Path.GetFileName(path)))
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private static void ShowError(string message)
    {
        MessageBox.Show(
            message,
            Application.ProductName,
            MessageBoxButtons.OK,
            MessageBoxIcon.Error,
            MessageBoxDefaultButton.Button1
        );
    }
}
