const DEFAULT_SPLASH_STATUS_KEY = 'splash.checkingSettings';

interface SplashStatusState {
    key: string;
    progress: number | null;
}

let currentSplashStatus: SplashStatusState = {
    key: DEFAULT_SPLASH_STATUS_KEY,
    progress: null
};

function normalizeProgress(nextProgress: number | null): number | null {
    if (typeof nextProgress !== 'number' || Number.isNaN(nextProgress)) {
        return null;
    }

    return Math.min(100, Math.max(0, Math.round(nextProgress)));
}

export function getSplashStatusSnapshot(): SplashStatusState {
    return currentSplashStatus;
}

export function setSplashStatusKey(nextStatusKey: string): void {
    currentSplashStatus = {
        key: nextStatusKey,
        progress: null
    };
}

export function setSplashStatusProgress(nextProgress: number | null): void {
    currentSplashStatus = {
        ...currentSplashStatus,
        progress: normalizeProgress(nextProgress)
    };
}

export function resetSplashStatusKey(): void {
    currentSplashStatus = {
        key: DEFAULT_SPLASH_STATUS_KEY,
        progress: null
    };
}
