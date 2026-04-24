<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import { PLATFORM_COMMANDS } from '$lib/contracts/commands';
	import { type BloodborneInstallError, type LauncherBootstrapState } from '$lib/contracts/launcherConfig';
	import { localeOptions, locales, setLocale, t, type AppLocale, type TranslationKey } from '$lib/i18n';

	import AppIcon from '$lib/components/AppIcon.svelte';
	import AppLoading from '$lib/components/AppLoading.svelte';
	import { platformApi } from '$platform/renderer/api';

	type SplashTranslationKey = Extract<TranslationKey, `splash.${string}`>;

	let bootstrapState = $state<LauncherBootstrapState | null>(null);
	let selectedLocale = $state<AppLocale>('en');
	let remoteStatusKey = $state<SplashTranslationKey>('splash.checkingSettings');
	let remoteProgress = $state<number | null>(null);
	let isLoading = $state(true);
	let isSelecting = $state(false);
	let isSavingLocale = $state(false);
	let isStarting = $state(false);
	let selectionError = $state<BloodborneInstallError | null>(null);
	let displayedInstallPath = $state<string | null>(null);
	let hasUnexpectedError = $state(false);
	let currentLocaleTitle = $derived(localeOptions.find(({ value }) => value === selectedLocale)?.title ?? selectedLocale);

	function syncLocale(nextLocale: string) {
		setLocale(nextLocale);
		selectedLocale = locales.includes(nextLocale as AppLocale) ? (nextLocale as AppLocale) : 'tr';
	}

	function getActiveError(): BloodborneInstallError | null {
		if (selectionError) {
			return selectionError;
		}

		if (!bootstrapState || bootstrapState.bloodborne.isValid) {
			return null;
		}

		return bootstrapState.bloodborne.error;
	}

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

		if (isStarting) {
			return remoteStatusKey;
		}

		if (isSelecting) {
			if (remoteStatusKey !== 'splash.checkingSettings') {
				return remoteStatusKey;
			}

			return 'splash.selectingFolder';
		}

		if (isLoading) {
			return remoteStatusKey;
		}

		const activeError = getActiveError();
		if (activeError === 'invalid-title-id') {
			return 'splash.invalidTitleId';
		}

		if (activeError === 'missing-eboot') {
			return 'splash.missingEboot';
		}

		if (activeError === 'not-found') {
			return 'splash.pathNotFound';
		}

		if (activeError === 'not-directory') {
			return 'splash.notDirectory';
		}

		if (bootstrapState?.bloodborne.isValid) {
			return 'splash.validationReady';
		}

		return 'splash.needsBloodbornePath';
	}

	async function startMainMenu() {
		if (isStarting || !bootstrapState?.bloodborne.isValid || !platformApi.isAvailable) {
			return;
		}

		isStarting = true;
		await refreshSplashStatus();

		try {
			await platformApi.invoke(PLATFORM_COMMANDS.COMPLETE_SPLASH_BOOTSTRAP, undefined);
		} catch (error) {
			console.warn('Main menu could not be started from splash.', error);
			hasUnexpectedError = true;
			isStarting = false;
		}
	}

	async function loadBootstrapState() {
		if (!platformApi.isAvailable) {
			isLoading = false;
			return;
		}

		try {
			const nextState = await platformApi.invoke(PLATFORM_COMMANDS.GET_LAUNCHER_BOOTSTRAP_STATE, undefined);
			bootstrapState = nextState;
			displayedInstallPath = nextState.bloodborne.installPath;
			syncLocale(nextState.config.locale);
			selectionError = nextState.bloodborne.isValid ? null : nextState.bloodborne.error;
		} catch (error) {
			console.warn('Launcher bootstrap state could not be loaded.', error);
			hasUnexpectedError = true;
		} finally {
			isLoading = false;
		}
	}

	async function handleLocaleChange() {
		setLocale(selectedLocale);

		if (!platformApi.isAvailable || isSavingLocale) {
			return;
		}

		isSavingLocale = true;

		try {
			const nextState = await platformApi.invoke(PLATFORM_COMMANDS.SAVE_LAUNCHER_LOCALE, {
				locale: selectedLocale
			});

			bootstrapState = nextState;
			displayedInstallPath = nextState.bloodborne.installPath;
			syncLocale(nextState.config.locale);
		} catch (error) {
			console.warn('Launcher locale could not be saved.', error);
			hasUnexpectedError = true;
		} finally {
			isSavingLocale = false;
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

	async function pickBloodborneDirectory() {
		if (!platformApi.isAvailable || isSelecting || isStarting) {
			return;
		}

		isSelecting = true;
		selectionError = null;

		try {
			const result = await platformApi.invoke(PLATFORM_COMMANDS.PICK_BLOODBORNE_DIRECTORY, undefined);

			bootstrapState = result.bootstrapState;
			displayedInstallPath = result.selection?.installPath ?? result.bootstrapState.bloodborne.installPath;
			syncLocale(result.bootstrapState.config.locale);
			selectionError = result.selection?.isValid ? null : (result.selection?.error ?? null);

			if (result.bootstrapState.bloodborne.isValid) {
				await startMainMenu();
			}
		} catch (error) {
			console.warn('Bloodborne directory picker failed.', error);
			hasUnexpectedError = true;
		} finally {
			isSelecting = false;
		}
	}

	onMount(() => {
		const statusPoll = window.setInterval(() => {
			void refreshSplashStatus();
		}, 240);

		void refreshSplashStatus();
		void loadBootstrapState();

		return () => {
			window.clearInterval(statusPoll);
		};
	});
</script>

<svelte:head>
	<title>{$t('splash.title')}</title>
</svelte:head>

<main
	class="grid h-screen w-full content-start justify-items-center overflow-y-auto overflow-x-hidden select-none bg-[radial-gradient(circle_at_top,rgba(132,102,48,0.14),transparent_34%),radial-gradient(circle_at_50%_22%,rgba(78,92,108,0.1),transparent_42%),linear-gradient(180deg,#121110_0%,#080808_38%,#030303_100%)] px-6 py-8 text-[#f2e4b6]"
	aria-live="polite"
>
	<div class="my-auto w-full flex justify-center">
		<div
			class="w-full max-w-[40rem] rounded-[28px] border border-[#f2e4b6]/12 bg-black/35 px-6 py-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-[8px]"
		>
			<AppLoading
				statusKey={getStatusKey()}
				progress={isLoading || isSelecting || isStarting ? remoteProgress : null}
				showSpinner={isLoading || isSelecting || isStarting}
			>
				<div class="grid gap-4">
					<label class="grid gap-2 text-left">
						<div class="flex items-center justify-between gap-3">
							<span class="text-[0.72rem] tracking-[0.22em] text-[#f2e4b6]/55">
								{$t('splash.localeLabel')}
							</span>
							<span
								class="rounded-full border border-[#f2e4b6]/10 bg-[#f2e4b6]/[0.05] px-3 py-1 text-[0.62rem] tracking-[0.16em] text-[#f2e4b6]/58"
							>
								{currentLocaleTitle}
							</span>
						</div>

						<div
							class="relative overflow-hidden rounded-[1.35rem] border border-[#f2e4b6]/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors duration-200 focus-within:border-[#f2e4b6]/32 focus-within:shadow-[0_0_0_1px_rgba(242,228,182,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]"
						>
							<div class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#f2e4b6]/42">
								<AppIcon name="globe" class="h-[18px] w-[18px]" />
							</div>

							<select
								bind:value={selectedLocale}
								class="w-full appearance-none bg-transparent px-12 py-[0.95rem] pr-14 text-sm tracking-[0.08em] text-[#f2e4b6] outline-none [color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-60"
								disabled={isLoading || isStarting}
								onchange={handleLocaleChange}
							>
								{#each localeOptions as localeOption}
									<option
										value={localeOption.value}
										class="bg-[#080808] text-[#f2e4b6]"
										style="background-color: #080808; color: #f2e4b6;"
									>
										{localeOption.title}
									</option>
								{/each}
							</select>

							<div class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#f2e4b6]/46">
								<AppIcon name="chevron-down" class="h-[16px] w-[16px]" />
							</div>
						</div>
					</label>

					<div class="grid gap-2 rounded-2xl border border-[#f2e4b6]/10 bg-black/30 px-4 py-4">
						<span class="text-[0.72rem] tracking-[0.22em] text-[#f2e4b6]/55">
							{$t('splash.selectedFolder')}
						</span>
						<p class="m-0 break-all text-sm leading-6 text-[#f2e4b6]/88">
							{displayedInstallPath ?? $t('splash.noFolderSelected')}
						</p>
					</div>

					<button
						class="cursor-pointer rounded-2xl border border-[#f2e4b6]/20 bg-[#f2e4b6]/8 px-4 py-3 text-sm font-semibold tracking-[0.16em] text-[#f2e4b6] transition-colors hover:bg-[#f2e4b6]/12 disabled:cursor-not-allowed disabled:opacity-60"
						type="button"
						disabled={isLoading || isSelecting || isStarting}
						onclick={pickBloodborneDirectory}
					>
						{$t('splash.pickFolder')}
					</button>
				</div>
			</AppLoading>
		</div>
	</div>
</main>
