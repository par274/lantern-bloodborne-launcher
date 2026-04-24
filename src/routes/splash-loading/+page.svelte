<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import { PLATFORM_COMMANDS } from '$lib/contracts/commands';
	import { setLocale, t, type TranslationKey } from '$lib/i18n';
	import { platformApi } from '$platform/renderer/api';

	import AppLoading from '$lib/components/AppLoading.svelte';

	type SplashTranslationKey = Extract<TranslationKey, `splash.${string}`>;

	let remoteStatusKey = $state<SplashTranslationKey>('splash.checkingSettings');
	let remoteProgress = $state<number | null>(null);
	let isLoading = $state(true);
	let hasUnexpectedError = $state(false);

	function getStatusKey(): SplashTranslationKey {
		if (!browser) {
			return 'splash.checkingSettings';
		}

		if (!platformApi.isAvailable) {
			return 'splash.platformUnavailable';
		}

		if (hasUnexpectedError) {
			return 'splash.unexpectedError';
		}

		return remoteStatusKey;
	}

	async function syncSplashLocale() {
		if (!platformApi.isAvailable) {
			isLoading = false;
			return;
		}

		try {
			const bootstrapState = await platformApi.invoke(PLATFORM_COMMANDS.GET_LAUNCHER_BOOTSTRAP_STATE, undefined);
			setLocale(bootstrapState.config.locale);
		} catch (error) {
			console.warn('Splash loading locale could not be synchronized.', error);
			hasUnexpectedError = true;
		} finally {
			isLoading = false;
		}
	}

	async function refreshSplashStatus() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			const splashStatus = await platformApi.invoke(PLATFORM_COMMANDS.GET_SPLASH_STATUS, undefined);
			remoteStatusKey = splashStatus.key as SplashTranslationKey;
			remoteProgress = splashStatus.progress;
		} catch {
			remoteStatusKey = 'splash.checkingSettings';
			remoteProgress = null;
		}
	}

	onMount(() => {
		const statusPoll = window.setInterval(() => {
			void refreshSplashStatus();
		}, 240);

		void refreshSplashStatus();
		void syncSplashLocale();

		return () => {
			window.clearInterval(statusPoll);
		};
	});
</script>

<svelte:head>
	<title>{$t('splash.title')}</title>
</svelte:head>

<main
	class="grid h-screen w-screen place-items-center overflow-hidden select-none bg-[radial-gradient(circle_at_top,rgba(132,102,48,0.16),transparent_38%),radial-gradient(circle_at_50%_22%,rgba(78,92,108,0.12),transparent_44%),linear-gradient(180deg,#121110_0%,#080808_38%,#030303_100%)] px-6 py-6 text-[#f2e4b6]"
	aria-live="polite"
>
	<div class="w-full max-w-[20rem] px-6 py-7">
		<AppLoading statusKey={getStatusKey()} progress={hasUnexpectedError ? null : remoteProgress} compact />
	</div>
</main>
