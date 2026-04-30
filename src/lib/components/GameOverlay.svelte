<script lang="ts">
	import AppIcon from '$lib/components/AppIcon.svelte';
	import AppLoading from '$lib/components/AppLoading.svelte';
	import InputPrompts from '$lib/components/InputPrompts.svelte';
	import type { InputMode } from '$lib/components/gamepad';
	import { t } from '$lib/i18n';

	type Props = {
		selected: number;
		isStopping?: boolean;
		inputMode?: InputMode;
		isXboxControllerConnected?: boolean;
		isDualSenseControllerConnected?: boolean;
		onSelect: (index: number) => void;
		onResume: () => void;
		onExit: () => void;
	};

	let {
		selected,
		isStopping = false,
		inputMode = 'keyboard',
		isXboxControllerConnected = false,
		isDualSenseControllerConnected = false,
		onSelect,
		onResume,
		onExit
	}: Props = $props();

	const actions = [
		{
			icon: 'game-resume' as const,
			labelKey: 'gameOverlay.resume' as const,
			action: () => onResume()
		},
		{
			icon: 'game-exit' as const,
			labelKey: 'gameOverlay.exit' as const,
			action: () => onExit()
		}
	];
</script>

<div class="absolute inset-0 z-40 text-white">
	<div
		class="game-overlay-backdrop pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.34)_58%,rgba(0,0,0,0.7)_100%)]"
	></div>

	<div
		class="game-overlay-panel absolute inset-x-0 bottom-0 flex h-[280px] flex-col justify-end bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.18)_22%,rgba(0,0,0,0.66)_70%,rgba(0,0,0,0.9)_100%)] px-16 pb-9"
	>
		<div class="mb-8 flex items-end justify-center gap-16">
			{#each actions as action, index}
				<button
					class={`group flex w-[88px] flex-col items-center justify-end gap-3 transition duration-150 ${
						selected === index ? '-translate-y-1 opacity-100' : 'opacity-55 hover:opacity-80'
					}`}
					disabled={isStopping}
					onmouseenter={() => onSelect(index)}
					onclick={() => action.action()}
					type="button"
				>
					<span
						class={`flex h-[44px] w-[44px] items-center justify-center rounded-full transition duration-150 ${
							selected === index
								? 'bg-white/14 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.86),0_0_18px_rgba(255,255,255,0.12)]'
								: 'text-white/62'
						}`}
					>
						<AppIcon name={action.icon} class={`h-6 w-6 transition-transform duration-150 ${selected === index ? 'scale-110' : ''}`} />
					</span>
					<span
						class={`text-[0.62rem] font-bold uppercase tracking-[0.16em] ${selected === index ? 'text-white' : 'text-white/58'}`}
					>
						{$t(action.labelKey)}
					</span>
				</button>
			{/each}
		</div>

		<div class="flex items-center justify-end gap-5">
			{#if inputMode === 'xbox' && isXboxControllerConnected}
				<div class="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/80">
					<span class="rounded border border-white/24 bg-black/24 px-1.5 py-0.5 text-[0.58rem] text-white">L3</span>
					<span class="text-white/50">+</span>
					<span class="rounded border border-white/24 bg-black/24 px-1.5 py-0.5 text-[0.58rem] text-white">R3</span>
					<span>{$t('gameOverlay.menuPrompt')}</span>
				</div>
			{:else if inputMode === 'dualsense' && isDualSenseControllerConnected}
				<div class="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/80">
					<span class="rounded border border-white/24 bg-black/24 px-1.5 py-0.5 text-[0.58rem] text-white">L3</span>
					<span class="text-white/50">+</span>
					<span class="rounded border border-white/24 bg-black/24 px-1.5 py-0.5 text-[0.58rem] text-white">R3</span>
					<span>{$t('gameOverlay.menuPrompt')}</span>
				</div>
			{/if}
			<InputPrompts
				inputMode={inputMode}
				isXboxControllerConnected={isXboxControllerConnected}
				isDualSenseControllerConnected={isDualSenseControllerConnected}
				compact
			/>
			<div class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/62">
				<span class="text-white">F1</span> {$t('gameOverlay.menuPrompt')}
			</div>
		</div>
	</div>

	{#if isStopping}
		<div class="absolute inset-0 z-10 flex items-center justify-center bg-black/52 backdrop-blur-[2px]">
			<div
				class="rounded-[28px] border border-[#f2e4b6]/18 bg-[radial-gradient(circle_at_50%_0%,rgba(242,228,182,0.13),transparent_48%),rgba(6,6,5,0.84)] px-10 py-9 shadow-[0_26px_80px_rgba(0,0,0,0.54)]"
			>
				<AppLoading statusKey="splash.stoppingGame" compact />
			</div>
		</div>
	{/if}
</div>

<style>
	.game-overlay-backdrop {
		animation: gameOverlayBackdropFade 220ms ease-out both;
	}

	.game-overlay-panel {
		animation: gameOverlayPanelSlide 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
		will-change: transform, opacity;
	}

	@keyframes gameOverlayBackdropFade {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes gameOverlayPanelSlide {
		from {
			opacity: 0;
			transform: translate3d(0, 100%, 0);
		}

		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}
</style>
