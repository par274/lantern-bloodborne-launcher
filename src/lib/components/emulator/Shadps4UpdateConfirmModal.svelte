<script module lang="ts">
	export type Shadps4UpdateConfirmModalController = {
		enterSelected: () => void;
		confirmText: () => void;
		goBack: () => void;
		moveUp: () => void;
		moveDown: () => void;
		moveLeft: () => void;
		moveRight: () => void;
	};
</script>

<script lang="ts">
	import type { Shadps4UpdateChangelog } from '$lib/contracts/commands';
	import { t } from '$lib/i18n';

	import AppIcon from '$lib/components/AppIcon.svelte';
	import InputPrompts from '$lib/components/InputPrompts.svelte';

	type Props = {
		inputMode: 'keyboard' | 'xbox' | 'dualsense';
		isXboxControllerConnected: boolean;
		isDualSenseControllerConnected: boolean;
		changelog: Shadps4UpdateChangelog | null;
		isLoading: boolean;
		errorMessage: string | null;
		onCancel: () => void;
		onConfirm: () => void;
		playEnterSound: () => void;
	};

	let {
		inputMode,
		isXboxControllerConnected,
		isDualSenseControllerConnected,
		changelog,
		isLoading,
		errorMessage,
		onCancel,
		onConfirm,
		playEnterSound
	}: Props = $props();

	let selectedAction = $state<0 | 1>(1);
	let commitListElement = $state<HTMLDivElement | undefined>(undefined);
	let isControllerInputActive = $derived(inputMode !== 'keyboard' && (isXboxControllerConnected || isDualSenseControllerConnected));
	let canConfirm = $derived(!isLoading && !changelog?.isUpToDate);

	function confirmSelection() {
		if (!canConfirm) {
			return;
		}

		playEnterSound();
		onConfirm();
	}

	function cancelSelection() {
		playEnterSound();
		onCancel();
	}

	function scrollCommitList(direction: -1 | 1) {
		if (!commitListElement) {
			return;
		}

		commitListElement.scrollBy({
			top: direction * 112,
			behavior: 'smooth'
		});
	}

	export function enterSelected() {
		if (selectedAction === 1) {
			confirmSelection();
			return;
		}

		cancelSelection();
	}

	export function confirmText() {
		confirmSelection();
	}

	export function goBack() {
		cancelSelection();
	}

	export function moveUp() {
		scrollCommitList(-1);
	}

	export function moveDown() {
		scrollCommitList(1);
	}

	export function moveLeft() {
		selectedAction = 0;
	}

	export function moveRight() {
		if (canConfirm) {
			selectedAction = 1;
		}
	}
</script>

<div class="absolute inset-0 z-[26] flex items-center justify-center px-4 py-5">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,0,0,0.18),rgba(0,0,0,0.44)_76%,rgba(0,0,0,0.58)),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.34))] backdrop-blur-[1.5px]"
	></div>

	<section
		class="bb-modal-frame relative z-10 w-[min(74vw,760px)] overflow-hidden rounded-[28px] border border-[#d0b875]/16 bg-[radial-gradient(circle_at_20%_0%,rgba(202,181,120,0.11),transparent_42%),linear-gradient(180deg,rgba(17,13,10,0.95),rgba(6,5,4,0.9))] px-6 py-5 shadow-[0_24px_64px_rgba(0,0,0,0.56)]"
		aria-modal="true"
		role="dialog"
	>
		<div class="bb-modal-border pointer-events-none absolute inset-0"></div>

		<div class="relative flex items-start justify-between gap-6">
			<div>
				<div class="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-[#ccb57a]/72">
					{$t('emulator.update.previewEyebrow')}
				</div>
				<h3 class="mt-2 text-[1.3rem] font-semibold tracking-[0.01em] text-[#f4ead0]">
					{$t('emulator.update.previewTitle')}
				</h3>
				<p class="mt-2 max-w-[520px] text-[0.78rem] leading-[1.7] text-white/56">
					{$t('emulator.update.previewDescription')}
				</p>
			</div>

			<button
				type="button"
				class="rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/44 transition hover:border-[#c8b27a]/30 hover:text-[#f1ddb0]"
				onclick={cancelSelection}
			>
				{$t('prompt.back')}
			</button>
		</div>

		<div class="relative mt-4 grid gap-3 sm:grid-cols-2">
			<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/22 p-3.5">
				<div class="text-[0.54rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
					{$t('emulator.update.currentVersion')}
				</div>
				<div class="mt-2 break-all text-[0.78rem] font-semibold leading-[1.5] text-[#f4ead0]/84">
					{changelog?.currentVersion ?? $t('emulator.valueUnavailable')}
				</div>
			</div>

			<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/22 p-3.5">
				<div class="text-[0.54rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
					{$t('emulator.update.targetVersion')}
				</div>
				<div class="mt-2 break-all text-[0.78rem] font-semibold leading-[1.5] text-[#f4ead0]/84">
					{changelog?.targetVersion ?? $t('emulator.valueUnavailable')}
				</div>
			</div>
		</div>

		<div class="relative mt-4 rounded-[22px] border border-[#c8b27a]/10 bg-black/20 p-4">
			<div class="flex items-center justify-between gap-4">
				<div class="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#ccb57a]/60">
					{$t('emulator.update.commitList')}
				</div>

				{#if changelog?.compareUrl}
					<a
						class="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#f0ddb0]/72 transition hover:text-[#fff2cb] hover:underline"
						href={changelog.compareUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						{$t('emulator.update.compareLink')}
					</a>
				{/if}
			</div>

			{#if isLoading}
				<div class="mt-4 flex items-center gap-3 text-[0.76rem] leading-[1.7] text-white/58">
					<div
						class="h-5 w-5 shrink-0 animate-spin rounded-full border border-[#c8b27a]/16 border-t-[#f0ddb0]/78 shadow-[0_0_14px_rgba(200,178,122,0.12)]"
						aria-hidden="true"
					></div>
					<div>
						{$t('emulator.update.loadingChangelog')}
					</div>
				</div>
			{:else if errorMessage}
				<div class="mt-4 text-[0.76rem] leading-[1.7] text-red-200/72">
					{$t('emulator.update.failedToLoad')}
				</div>
				<div class="mt-2 text-[0.68rem] leading-[1.7] text-white/44">
					{errorMessage}
				</div>
			{:else if changelog?.isUpToDate}
				<div class="mt-4 text-[0.76rem] leading-[1.7] text-white/58">
					{$t('emulator.update.upToDate')}
				</div>
			{:else if !changelog?.currentVersion}
				<div class="mt-4 text-[0.76rem] leading-[1.7] text-white/58">
					{$t('emulator.update.firstInstall')}
				</div>
			{:else if !changelog?.commits.length}
				<div class="mt-4 text-[0.76rem] leading-[1.7] text-white/58">
					{$t('emulator.update.noCommits')}
				</div>
			{:else}
				<div bind:this={commitListElement} class="mt-4 max-h-[300px] overflow-y-auto pr-1 patch-scrollbar">
					<div class="space-y-2.5">
						{#each changelog.commits as commit}
							<article class="rounded-[16px] border border-[#c8b27a]/10 bg-black/18 px-3.5 py-3">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<div class="text-[0.76rem] font-semibold leading-[1.55] text-[#f4ead0]/88">
											{commit.title}
										</div>

										{#if commit.body}
											<div class="mt-1.5 whitespace-pre-wrap text-[0.68rem] leading-[1.65] text-white/46">
												{commit.body}
											</div>
										{/if}
									</div>

									<div class="flex flex-wrap items-center justify-end gap-2">
										{#if commit.commitUrl}
											<a
												class="rounded-full border border-[#c8b27a]/14 bg-black/26 px-2.5 py-1 text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-[#c9b47d]/74 transition hover:text-[#fff2cb] hover:underline"
												href={commit.commitUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												{commit.shortSha}
											</a>
										{:else}
											<span
												class="rounded-full border border-[#c8b27a]/14 bg-black/26 px-2.5 py-1 text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-[#c9b47d]/74"
											>
												{commit.shortSha}
											</span>
										{/if}

										{#if commit.pullRequestUrl && commit.pullRequestNumber}
											<a
												class="rounded-full border border-[#c8b27a]/14 bg-black/26 px-2.5 py-1 text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-[#f0ddb0]/78 transition hover:text-[#fff2cb] hover:underline"
												href={commit.pullRequestUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												PR #{commit.pullRequestNumber}
											</a>
										{/if}
									</div>
								</div>
							</article>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="relative mt-5 flex items-center justify-end gap-2.5">
			<button
				type="button"
				class:selected={selectedAction === 0}
				class="rounded-full border border-white/10 bg-black/24 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56 transition hover:border-[#c8b27a]/24 hover:text-[#f4ead0]"
				onclick={cancelSelection}
			>
				{$t('menu.state.cancel')}
			</button>

			<button
				type="button"
				class:selected={selectedAction === 1}
				class="rounded-full border border-[#c8b27a]/16 bg-[#c8b27a]/10 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#f0ddb0]/78 transition hover:text-[#fff2cb] disabled:cursor-not-allowed disabled:opacity-45"
				disabled={!canConfirm}
				onclick={confirmSelection}
			>
				<span class="inline-flex items-center gap-2">
					{#if isControllerInputActive && (inputMode === 'xbox' || inputMode === 'dualsense')}
						<span
							class="inline-flex items-center gap-1.5 rounded-full border border-[#c8b27a]/16 bg-black/26 px-2 py-1 text-[0.52rem] tracking-[0.14em] text-[#f0ddb0]/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
						>
							{#if inputMode === 'xbox'}
								<AppIcon name="xbox-y" />
							{:else}
								<AppIcon name="dualsense-triangle" />
							{/if}
						</span>
					{/if}
					<span>{$t('emulator.update.confirmButton')}</span>
				</span>
			</button>
		</div>

		<InputPrompts
			compact
			class="relative mt-4 text-white/38"
			{inputMode}
			{isXboxControllerConnected}
			{isDualSenseControllerConnected}
		/>
	</section>
</div>
