<script module lang="ts">
	import type { Shadps4UpdateConfirmModalController } from '$lib/components/emulator/Shadps4UpdateConfirmModal.svelte';

	export type Shadps4ModalController = {
		enterSelected: () => void;
		goBack: () => void;
		confirmText: () => void;
		moveUp: () => void;
		moveDown: () => void;
		moveLeft: () => void;
		moveRight: () => void;
		deleteText: () => void;
	};
</script>

<script lang="ts">
	import { PLATFORM_COMMANDS, type Shadps4UpdateChangelog } from '$lib/contracts/commands';
	import type { Shadps4InstallStatus } from '$lib/contracts/launcherConfig';
	import { t } from '$lib/i18n';
	import type { TranslationKey } from '$lib/translations/translations';
	import { platformApi } from '$platform/renderer/api';

	import AppIcon from '$lib/components/AppIcon.svelte';
	import Shadps4UpdateConfirmModal from '$lib/components/emulator/Shadps4UpdateConfirmModal.svelte';
	import InputPrompts from '$lib/components/InputPrompts.svelte';
	import type { InputMode } from '$lib/components/gamepad';

	type UpdateStatus = 'idle' | 'checking' | 'complete' | 'failed';

	type Props = {
		inputMode: InputMode;
		isXboxControllerConnected: boolean;
		isDualSenseControllerConnected: boolean;
		shadps4: Shadps4InstallStatus | null;
		onClose: () => void;
		onUpdate: () => Promise<void> | void;
		playEnterSound: () => void;
	};

	const SHADPS4_GITHUB_URL = 'https://github.com/shadps4-emu/shadPS4';
	const SHADPS4_GITHUB_MAIN_URL = `${SHADPS4_GITHUB_URL}/tree/main`;

	let { inputMode, isXboxControllerConnected, isDualSenseControllerConnected, shadps4, onClose, onUpdate, playEnterSound }: Props =
		$props();

	let updateStatus = $state<UpdateStatus>('idle');
	let isUpdating = $state(false);
	let updateProgress = $state<number | null>(null);
	let isUpdatePreviewOpen = $state(false);
	let isLoadingChangelog = $state(false);
	let changelogErrorMessage = $state<string | null>(null);
	let updateChangelog = $state<Shadps4UpdateChangelog | null>(null);
	let updateConfirmModal = $state<Shadps4UpdateConfirmModalController | undefined>(undefined);

	let isControllerInputActive = $derived(inputMode !== 'keyboard' && (isXboxControllerConnected || isDualSenseControllerConnected));
	let commit = $derived(resolveCommit(shadps4?.version ?? null));
	let statusKey = $derived(resolveAvailabilityStatusKey(shadps4));
	let updateStatusKey = $derived(resolveUpdateStatusKey());

	function resolveCommit(version: string | null): string | null {
		const matches = version?.match(/[a-f0-9]{7,40}/gi);
		return matches?.at(-1)?.slice(0, 12) ?? null;
	}

	function resolveAvailabilityStatusKey(status: Shadps4InstallStatus | null): TranslationKey {
		if (!status) {
			return 'emulator.status.unavailable';
		}

		if (status.isAvailable) {
			return 'emulator.status.available';
		}

		return 'emulator.status.missing';
	}

	function resolveUpdateStatusKey(): TranslationKey | null {
		switch (updateStatus) {
			case 'checking':
				return 'emulator.update.checking';
			case 'complete':
				return 'emulator.update.complete';
			case 'failed':
				return 'emulator.update.failed';
			default:
				return null;
		}
	}

	async function performShadps4Update() {
		if (isUpdating) {
			return;
		}

		isUpdating = true;
		updateStatus = 'checking';
		updateProgress = 0;

		const progressInterval = window.setInterval(() => {
			void refreshProgress();
		}, 120);

		try {
			await onUpdate();
			await refreshProgress();
			updateProgress = 100;
			updateStatus = 'complete';
		} catch (error) {
			console.warn('shadPS4 update failed.', error);
			updateStatus = 'failed';
		} finally {
			window.clearInterval(progressInterval);
			isUpdating = false;
		}
	}

	async function openUpdatePreview() {
		if (isUpdating || isLoadingChangelog) {
			return;
		}

		playEnterSound();
		isUpdatePreviewOpen = true;
		isLoadingChangelog = true;
		changelogErrorMessage = null;

		try {
			updateChangelog = await platformApi.invoke(PLATFORM_COMMANDS.GET_SHADPS4_UPDATE_CHANGELOG, undefined);
		} catch (error) {
			console.warn('shadPS4 changelog could not be loaded.', error);
			updateChangelog = null;
			changelogErrorMessage = error instanceof Error ? error.message : $t('emulator.update.failedToLoad');
		} finally {
			isLoadingChangelog = false;
		}
	}

	function closeUpdatePreview() {
		isUpdatePreviewOpen = false;
		isLoadingChangelog = false;
		changelogErrorMessage = null;
	}

	async function confirmUpdate() {
		closeUpdatePreview();
		playEnterSound();
		await performShadps4Update();
	}

	async function refreshProgress() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			const status = await platformApi.invoke(PLATFORM_COMMANDS.GET_SPLASH_STATUS, undefined);
			updateProgress = status.progress;
		} catch (error) {
			console.warn('shadPS4 update progress could not be loaded.', error);
		}
	}

	function close() {
		playEnterSound();
		onClose();
	}

	export function enterSelected() {
		if (isUpdatePreviewOpen) {
			updateConfirmModal?.enterSelected();
			return;
		}

		void openUpdatePreview();
	}

	export function confirmText() {
		if (isUpdatePreviewOpen) {
			updateConfirmModal?.confirmText();
			return;
		}

		void openUpdatePreview();
	}

	export function goBack() {
		if (isUpdatePreviewOpen) {
			updateConfirmModal?.goBack();
			return;
		}

		close();
	}

	export function moveUp() {
		if (isUpdatePreviewOpen) {
			updateConfirmModal?.moveUp();
		}
	}

	export function moveDown() {
		if (isUpdatePreviewOpen) {
			updateConfirmModal?.moveDown();
		}
	}

	export function moveLeft() {
		if (isUpdatePreviewOpen) {
			updateConfirmModal?.moveLeft();
		}
	}

	export function moveRight() {
		if (isUpdatePreviewOpen) {
			updateConfirmModal?.moveRight();
		}
	}
	export function deleteText() {}
</script>

<div class="fixed inset-0 z-[24] flex items-center justify-center bg-black/35 px-5 py-8 backdrop-blur-[2px]">
	<section
		class="relative w-[min(84vw,680px)] overflow-hidden rounded-[30px] border border-[#d0b875]/16 bg-[radial-gradient(circle_at_18%_0%,rgba(202,181,120,0.13),transparent_42%),linear-gradient(180deg,rgba(18,13,10,0.9),rgba(6,5,4,0.84))] px-7 py-6 shadow-[0_28px_80px_rgba(0,0,0,0.58)]"
		aria-modal="true"
		role="dialog"
	>
		<div class="pointer-events-none absolute inset-0 border border-white/5"></div>

		<button
			type="button"
			class="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/46 transition hover:border-[#c8b27a]/30 hover:text-[#f1ddb0]"
			onclick={close}
		>
			{$t('prompt.back')}
		</button>

		<div class="relative pr-24">
			<div class="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#ccb57a]/72">
				{$t('emulator.eyebrow')}
			</div>
			<h2 class="mt-2 text-[1.72rem] font-semibold tracking-[0.01em] text-[#f4ead0]">
				{$t('emulator.title')}
			</h2>
			<p class="mt-3 max-w-[520px] text-[0.84rem] leading-[1.7] text-white/56">
				{$t('emulator.description')}
			</p>
		</div>

		<div class="relative mt-5 flex flex-wrap items-center gap-3">
			<div
				class="group relative inline-flex max-w-full items-center overflow-visible rounded-full border border-[#c8b27a]/16 bg-black/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
			>
				<div
					class="border-r border-[#c8b27a]/12 px-3.5 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#ccb57a]/66"
				>
					{$t('emulator.repository')}
				</div>
				<a
					class="border-r border-[#c8b27a]/12 px-3.5 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#f0ddb0]/76 transition hover:text-[#fff2cb] hover:underline"
					href={SHADPS4_GITHUB_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					GitHub
				</a>
				<a
					class="px-3.5 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#ccb57a]/66 transition hover:text-[#fff2cb] hover:underline"
					href={SHADPS4_GITHUB_MAIN_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					main
				</a>
				<a
					class="pointer-events-none absolute left-0 top-[calc(100%+0.45rem)] z-40 max-w-[360px] rounded-[12px] border border-[#c8b27a]/14 bg-black/82 px-3 py-2 text-[0.58rem] font-semibold tracking-[0.08em] text-white/52 opacity-0 shadow-[0_14px_34px_rgba(0,0,0,0.42)] backdrop-blur-[6px] transition duration-150 hover:text-[#f1ddb0] hover:underline group-hover:pointer-events-auto group-hover:opacity-100"
					href={SHADPS4_GITHUB_MAIN_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					{SHADPS4_GITHUB_MAIN_URL}
				</a>
			</div>

			<button
				class="inline-flex items-center rounded-full border border-[#c8b27a]/16 bg-black/24 px-3.5 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#f0ddb0]/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition hover:text-[#fff2cb] disabled:cursor-wait disabled:opacity-50"
				disabled={isUpdating}
				onclick={openUpdatePreview}
			>
				{#if isControllerInputActive && (inputMode === 'xbox' || inputMode === 'dualsense')}
					<span
						class="mr-2 inline-flex items-center gap-1.5 rounded-full border border-[#c8b27a]/16 bg-black/26 px-2 py-1 text-[0.52rem] tracking-[0.14em] text-[#f0ddb0]/82"
					>
						{#if inputMode === 'xbox'}
							<AppIcon name="xbox-y" />
						{:else}
							<AppIcon name="dualsense-triangle" />
						{/if}
					</span>
				{/if}
				<span>{$t('emulator.update.button')}</span>
			</button>
		</div>

		{#if updateStatusKey}
			<div class="relative mt-3">
				<div
					class={`flex items-center justify-between gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em] ${updateStatus === 'failed' ? 'text-red-300/70' : 'text-white/42'}`}
				>
					<span>{$t(updateStatusKey)}</span>
					{#if updateProgress !== null}
						<span>{updateProgress}%</span>
					{/if}
				</div>
				<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/34">
					<div
						class="h-full rounded-full bg-[#c8b27a]/74 transition-[width] duration-150"
						style={`width: ${updateProgress ?? (isUpdating ? 34 : 100)}%`}
					></div>
				</div>
			</div>
		{/if}

		<div class="relative mt-6 grid gap-3 sm:grid-cols-2">
			<div class="rounded-[20px] border border-[#c8b27a]/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
				<div class="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#ccb57a]/58">
					{$t('emulator.labels.status')}
				</div>
				<div class="mt-2 text-[0.92rem] font-semibold text-[#f4ead0]/88">
					{$t(statusKey)}
				</div>
			</div>

			<div class="rounded-[20px] border border-[#c8b27a]/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
				<div class="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#ccb57a]/58">
					{$t('emulator.labels.channel')}
				</div>
				<div class="mt-2 text-[0.92rem] font-semibold text-[#f4ead0]/88">
					{shadps4?.channel ?? $t('emulator.valueUnavailable')}
				</div>
			</div>

			<div class="rounded-[20px] border border-[#c8b27a]/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
				<div class="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#ccb57a]/58">
					{$t('emulator.labels.version')}
				</div>
				<div class="mt-2 break-all text-[0.82rem] font-semibold leading-[1.5] text-[#f4ead0]/82">
					{shadps4?.version ?? $t('emulator.valueUnavailable')}
				</div>
			</div>

			<div class="rounded-[20px] border border-[#c8b27a]/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
				<div class="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#ccb57a]/58">
					{$t('emulator.labels.commit')}
				</div>
				<div class="mt-2 break-all text-[0.92rem] font-semibold text-[#f4ead0]/88">
					{commit ?? $t('emulator.valueUnavailable')}
				</div>
			</div>
		</div>

		<div class="relative mt-3 rounded-[20px] border border-[#c8b27a]/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
			<div class="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#ccb57a]/58">
				{$t('emulator.labels.executable')}
			</div>
			<div class="mt-2 break-all text-[0.74rem] font-semibold leading-[1.55] text-white/58">
				{shadps4?.executablePath ?? $t('emulator.valueUnavailable')}
			</div>
		</div>

		<InputPrompts
			compact
			class="relative mt-5 text-white/42"
			{inputMode}
			{isXboxControllerConnected}
			{isDualSenseControllerConnected}
		/>
	</section>

	{#if isUpdatePreviewOpen}
		<Shadps4UpdateConfirmModal
			bind:this={updateConfirmModal}
			{inputMode}
			{isXboxControllerConnected}
			{isDualSenseControllerConnected}
			changelog={updateChangelog}
			isLoading={isLoadingChangelog}
			errorMessage={changelogErrorMessage}
			onCancel={closeUpdatePreview}
			onConfirm={confirmUpdate}
			{playEnterSound}
		/>
	{/if}
</div>
