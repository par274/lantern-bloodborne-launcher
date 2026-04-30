internal interface IGamePauseController
{
    void TogglePause(IntPtr targetWindowHandle);
}

internal static class GamePauseController
{
    public static IGamePauseController Create()
    {
        return OperatingSystem.IsWindows()
            ? new WindowsGamePauseController()
            : new NoopGamePauseController();
    }

    private sealed class NoopGamePauseController : IGamePauseController
    {
        public void TogglePause(IntPtr targetWindowHandle)
        {
        }
    }
}
