<script module lang="ts">
	export type GameOverlayExitDialogController = {
		moveLeft: () => void;
		moveRight: () => void;
		moveUp: () => void;
		moveDown: () => void;
		enterSelected: () => void;
		goBack: () => void;
	};
</script>

<script lang="ts">
	import InputPrompts from '$lib/components/InputPrompts.svelte';
	import type { InputMode } from '$lib/components/gamepad';
	import { t } from '$lib/i18n';

	type ExitDialogAction = 'resume' | 'launcher' | 'desktop';

	type Props = {
		inputMode: InputMode;
		isXboxControllerConnected: boolean;
		isDualSenseControllerConnected: boolean;
		onResume: () => void | Promise<void>;
		onReturnToLauncher: () => void | Promise<void>;
		onExitToDesktop: () => void | Promise<void>;
		playSelectSound?: () => void;
		playEnterSound?: () => void;
	};

	let {
		inputMode,
		isXboxControllerConnected,
		isDualSenseControllerConnected,
		onResume,
		onReturnToLauncher,
		onExitToDesktop,
		playSelectSound = () => {},
		playEnterSound = () => {}
	}: Props = $props();

	let selectedAction = $state<ExitDialogAction>('resume');

	const actions: {
		id: ExitDialogAction;
		labelKey: 'gameOverlay.exitDialog.resumeGame' | 'gameOverlay.exitDialog.returnToLauncher' | 'gameOverlay.exitDialog.exitToDesktop';
		descriptionKey:
			| 'gameOverlay.exitDialog.resumeGameDescription'
			| 'gameOverlay.exitDialog.returnToLauncherDescription'
			| 'gameOverlay.exitDialog.exitToDesktopDescription';
		variant: 'safe' | 'danger';
		run: () => void | Promise<void>;
	}[] = [
		{
			id: 'resume',
			labelKey: 'gameOverlay.exitDialog.resumeGame',
			descriptionKey: 'gameOverlay.exitDialog.resumeGameDescription',
			variant: 'safe',
			run: () => onResume()
		},
		{
			id: 'launcher',
			labelKey: 'gameOverlay.exitDialog.returnToLauncher',
			descriptionKey: 'gameOverlay.exitDialog.returnToLauncherDescription',
			variant: 'danger',
			run: () => onReturnToLauncher()
		},
		{
			id: 'desktop',
			labelKey: 'gameOverlay.exitDialog.exitToDesktop',
			descriptionKey: 'gameOverlay.exitDialog.exitToDesktopDescription',
			variant: 'danger',
			run: () => onExitToDesktop()
		}
	];

	function selectAction(action: ExitDialogAction) {
		if (selectedAction === action) {
			return;
		}

		selectedAction = action;
		playSelectSound();
	}

	function selectActionByOffset(offset: -1 | 1) {
		const currentIndex = actions.findIndex((action) => action.id === selectedAction);
		const nextIndex = (currentIndex + offset + actions.length) % actions.length;
		selectAction(actions[nextIndex].id);
	}

	function runAction(actionId: ExitDialogAction) {
		const action = actions.find((candidate) => candidate.id === actionId);
		if (!action) {
			return;
		}

		playEnterSound();
		void action.run();
	}

	export function moveLeft() {
		selectActionByOffset(-1);
	}

	export function moveRight() {
		selectActionByOffset(1);
	}

	export function moveUp() {
		selectActionByOffset(-1);
	}

	export function moveDown() {
		selectActionByOffset(1);
	}

	export function enterSelected() {
		runAction(selectedAction);
	}

	export function goBack() {
		runAction('resume');
	}
</script>

<div class="bb-modal-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/54 px-5 py-8 backdrop-blur-[2px]">
	<section
		class="bb-modal-frame relative w-[min(88vw,520px)] overflow-hidden rounded-[28px] border border-[#d0b875]/20 bg-[radial-gradient(circle_at_18%_0%,rgba(202,181,120,0.16),transparent_44%),linear-gradient(180deg,rgba(18,13,10,0.96),rgba(5,5,4,0.94))] px-6 py-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.66)]"
		aria-modal="true"
		role="dialog"
	>
		<div class="bb-modal-border pointer-events-none absolute inset-0"></div>

		<div class="relative">
			<div class="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#ccb57a]/68">
				{$t('gameOverlay.exitDialog.eyebrow')}
			</div>

			<h2 class="mt-2 text-[1.42rem] font-semibold tracking-[0.02em] text-[#f4ead0]">
				{$t('gameOverlay.exitDialog.title')}
			</h2>

			<p class="mx-auto mt-3 max-w-[24rem] text-[0.82rem] leading-[1.72] text-white/62">
				{$t('gameOverlay.exitDialog.description')}
			</p>

			<div class="mt-6 flex flex-col gap-3">
				<button
					type="button"
					class:selected={selectedAction === 'resume'}
					class="game-exit-dialog-action safe rounded-[20px] border border-white/10 bg-white/[0.035] px-5 py-4 text-left outline-none transition hover:border-[#c8b27a]/28 hover:bg-[#c8b27a]/8 [&.selected]:border-[#e8d39c]/40 [&.selected]:bg-[#d6ba72]/12 [&.selected]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_18px_40px_rgba(0,0,0,0.28)]"
					onmouseenter={() => selectAction('resume')}
					onclick={() => runAction('resume')}
				>
					<span class="block text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#f4ead0]">
						{$t('gameOverlay.exitDialog.resumeGame')}
					</span>
					<span class="mt-1 block text-[0.72rem] leading-[1.55] text-white/46">
						{$t('gameOverlay.exitDialog.resumeGameDescription')}
					</span>
				</button>

				<div class="h-px bg-white/8"></div>

				<div class="grid gap-3 sm:grid-cols-2">
					{#each actions.slice(1) as action}
						<button
							type="button"
							class:selected={selectedAction === action.id}
							class="game-exit-dialog-action rounded-[20px] border border-red-200/12 bg-red-950/10 px-5 py-4 text-left outline-none transition hover:border-red-200/28 hover:bg-red-500/10 [&.selected]:border-red-200/38 [&.selected]:bg-red-500/14 [&.selected]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_18px_40px_rgba(0,0,0,0.3)]"
							onmouseenter={() => selectAction(action.id)}
							onclick={() => runAction(action.id)}
						>
							<span class="block text-[0.78rem] font-semibold uppercase tracking-[0.15em] text-red-50/82">
								{$t(action.labelKey)}
							</span>
							<span class="mt-1 block text-[0.7rem] leading-[1.55] text-white/42">
								{$t(action.descriptionKey)}
							</span>
						</button>
					{/each}
				</div>
			</div>

			<InputPrompts
				compact
				class="mt-5 justify-center text-white/38"
				{inputMode}
				{isXboxControllerConnected}
				{isDualSenseControllerConnected}
			/>
		</div>
	</section>
</div>
