<script lang="ts">
	import { onMount } from 'svelte';

	import { asset } from '$app/paths';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import GameOverlay from '$lib/components/GameOverlay.svelte';
	import GameOverlayExitDialog, { type GameOverlayExitDialogController } from '$lib/components/GameOverlayExitDialog.svelte';
	import {
		createControllerChangeHandler,
		createControllerTick,
		createGamepadState,
		forceControllerInputMode,
		setForcedControllerInputMode,
		setKeyboardInputMode,
		type InputMode
	} from '$lib/components/gamepad';
	import { PLATFORM_COMMANDS } from '$lib/contracts/commands';
	import { t } from '$lib/i18n';
	import { platformApi } from '$platform/renderer/api';

	const SELECT_SOUND_COOLDOWN_MS = 90;
	const GAMEPAD_RESUME_FOCUS_DELAY_MS = 260;
	const RESUME_ACTION_INDEX = 1;
	const EXIT_ACTION_INDEX = 6;

	let selected = $state(RESUME_ACTION_INDEX);
	let isStopping = $state(false);
	let isOverlayOpen = $state(false);
	let isExitDialogOpen = $state(false);
	let isHintVisible = $state(false);
	let animationKey = $state(0);
	let gamepad = $state(createGamepadState());
	let exitDialog = $state<GameOverlayExitDialogController | undefined>(undefined);
	let nativePromptInputMode = $state<InputMode | null>(null);

	let displayedInputMode = $derived(nativePromptInputMode ?? gamepad.inputMode);
	let isDisplayedXboxControllerConnected = $derived(nativePromptInputMode === 'xbox' || gamepad.isXboxControllerConnected);
	let isDisplayedDualSenseControllerConnected = $derived(
		nativePromptInputMode === 'dualsense' || gamepad.isDualSenseControllerConnected
	);

	let selectAudio: HTMLAudioElement | undefined;
	let enterAudio: HTMLAudioElement | undefined;
	let lastSelectSoundAt = 0;
	let hintTimer: number | undefined;
	let cursorHideTimer: number | undefined;

	function playAudio(audio: HTMLAudioElement | undefined) {
		if (!audio) {
			return;
		}

		audio.currentTime = 0;
		void audio.play().catch(() => {});
	}

	function playSelectSound() {
		const now = performance.now();

		if (now - lastSelectSoundAt < SELECT_SOUND_COOLDOWN_MS) {
			return;
		}

		lastSelectSoundAt = now;
		playAudio(selectAudio);
	}

	function playEnterSound() {
		playAudio(enterAudio);
	}

	function selectOverlayAction(index: number) {
		if (selected === index) {
			return;
		}

		selected = index;
		playSelectSound();
	}

	function selectPreviousOverlayAction() {
		selectOverlayAction(selected === EXIT_ACTION_INDEX ? RESUME_ACTION_INDEX : EXIT_ACTION_INDEX);
	}

	function selectNextOverlayAction() {
		selectOverlayAction(selected === RESUME_ACTION_INDEX ? EXIT_ACTION_INDEX : RESUME_ACTION_INDEX);
	}

	async function resumeGame({ focusDelayMs = 0, playSound = true } = {}) {
		if (!isOverlayOpen) {
			return;
		}

		isExitDialogOpen = false;
		if (playSound) {
			playEnterSound();
		}

		await platformApi.invoke(PLATFORM_COMMANDS.SET_GAME_OVERLAY_OPEN, { focusDelayMs, open: false });
	}

	function openExitDialog() {
		if (isStopping) {
			return;
		}

		isExitDialogOpen = true;
		playEnterSound();
	}

	async function stopGame({ playSound = true, exitToDesktop = false } = {}) {
		if (isStopping) {
			return;
		}

		isStopping = true;
		isExitDialogOpen = false;

		if (playSound) {
			playEnterSound();
		}

		try {
			await platformApi.invoke(exitToDesktop ? PLATFORM_COMMANDS.APP_EXIT : PLATFORM_COMMANDS.STOP_GAME, undefined);
		} catch (error) {
			console.warn('Game stop failed.', error);
			isStopping = false;
		}
	}

	function activateSelectedAction({ focusDelayMs = 0 } = {}) {
		if (!isOverlayOpen) {
			return;
		}

		if (selected === RESUME_ACTION_INDEX) {
			void resumeGame({ focusDelayMs });
			return;
		}

		if (selected === EXIT_ACTION_INDEX) {
			openExitDialog();
		}
	}

	function setNativeControllerMode(inputMode: Exclude<InputMode, 'keyboard'> = 'xbox') {
		nativePromptInputMode = inputMode;
		setForcedControllerInputMode(gamepad, inputMode);
	}

	function onKeydown(event: KeyboardEvent) {
		if (!isOverlayOpen) {
			return;
		}

		nativePromptInputMode = null;
		setKeyboardInputMode(gamepad);

		if (isStopping) {
			event.preventDefault();
			return;
		}

		if (isExitDialogOpen) {
			if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
				event.preventDefault();
				exitDialog?.moveUp();
				return;
			}

			if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
				event.preventDefault();
				exitDialog?.moveDown();
				return;
			}

			if (event.key === 'Enter') {
				event.preventDefault();
				exitDialog?.enterSelected();
				return;
			}

			if (event.key === 'Escape' || event.key === 'Backspace') {
				event.preventDefault();
				exitDialog?.goBack();
			}

			return;
		}

		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			selectPreviousOverlayAction();
			return;
		}

		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			event.preventDefault();
			selectNextOverlayAction();
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
				activateSelectedAction();
				return;
			}

		if (event.key === 'Escape' || event.key === 'Backspace') {
			event.preventDefault();
			void resumeGame();
		}
	}

	function onMouseMove() {
		if (!isOverlayOpen) {
			return;
		}

		nativePromptInputMode = null;
		setKeyboardInputMode(gamepad);
		scheduleCursorHide();
	}

	function onMouseBack(event: MouseEvent | PointerEvent) {
		if (!isOverlayOpen) {
			return;
		}

		if (event.button !== 2) {
			return;
		}

		event.preventDefault();
		if (isExitDialogOpen) {
			exitDialog?.goBack();
			return;
		}

		void resumeGame();
	}

	function clearHintTimer() {
		if (!hintTimer) {
			return;
		}

		window.clearTimeout(hintTimer);
		hintTimer = undefined;
	}

	function clearCursorHideTimer() {
		if (!cursorHideTimer) {
			return;
		}

		window.clearTimeout(cursorHideTimer);
		cursorHideTimer = undefined;
	}

	function scheduleCursorHide() {
		clearCursorHideTimer();
		cursorHideTimer = window.setTimeout(() => {
			if (!isOverlayOpen) {
				return;
			}

			forceControllerInputMode(gamepad);
			cursorHideTimer = undefined;
		}, 1200);
	}

	function showOverlayHint() {
		if (isOverlayOpen) {
			return;
		}

		clearHintTimer();
		isHintVisible = true;
		hintTimer = window.setTimeout(() => {
			isHintVisible = false;
			hintTimer = undefined;
		}, 4800);
	}

	onMount(() => {
		const controllerTick = createControllerTick(gamepad, {
			moveLeft: () => {
				if (isExitDialogOpen) {
					exitDialog?.moveLeft();
					return;
				}

				if (isOverlayOpen) selectPreviousOverlayAction();
			},
			moveRight: () => {
				if (isExitDialogOpen) {
					exitDialog?.moveRight();
					return;
				}

				if (isOverlayOpen) selectNextOverlayAction();
			},
			moveUp: () => {
				if (isExitDialogOpen) {
					exitDialog?.moveUp();
					return;
				}

				if (isOverlayOpen) selectPreviousOverlayAction();
			},
			moveDown: () => {
				if (isExitDialogOpen) {
					exitDialog?.moveDown();
					return;
				}

				if (isOverlayOpen) selectNextOverlayAction();
			},
			enterSelected: () => {
				if (isExitDialogOpen) {
					exitDialog?.enterSelected();
					return;
				}

				activateSelectedAction({ focusDelayMs: GAMEPAD_RESUME_FOCUS_DELAY_MS });
			},
			goBack: () => {
				if (isExitDialogOpen) {
					exitDialog?.goBack();
					return;
				}

				void resumeGame();
			},
			deleteText: () => {},
			confirmText: () => {
				if (isExitDialogOpen) {
					exitDialog?.enterSelected();
					return;
				}

				activateSelectedAction({ focusDelayMs: GAMEPAD_RESUME_FOCUS_DELAY_MS });
			},
			insertSpace: () => {},
			clearText: () => {},
			toggleOverlay: () => {
				if (isOverlayOpen) {
					void resumeGame({ focusDelayMs: GAMEPAD_RESUME_FOCUS_DELAY_MS });
				}
			}
		});
		const handleControllerChange = createControllerChangeHandler(gamepad);
		const unsubscribeGameEvents = window.electronAPI?.onGameEvent((event) => {
			if (event.type === 'overlay-hint') {
				showOverlayHint();
				return;
			}

			if (event.type === 'overlay-opened') {
				clearHintTimer();
				isHintVisible = false;
				isOverlayOpen = true;
				isExitDialogOpen = false;
				nativePromptInputMode = event.inputMode ?? null;
				if (event.inputMode) {
					setNativeControllerMode(event.inputMode);
				} else {
					forceControllerInputMode(gamepad);
				}
				scheduleCursorHide();
				selected = RESUME_ACTION_INDEX;
				isStopping = false;
				animationKey += 1;
				return;
			}

			if (event.type === 'overlay-closed' || event.type === 'session-ended') {
				isOverlayOpen = false;
				isExitDialogOpen = false;
				nativePromptInputMode = null;
				isStopping = false;
				clearCursorHideTimer();
			}

		});

		gamepad.controllerLoop = requestAnimationFrame(controllerTick);
		window.addEventListener('gamepadconnected', handleControllerChange);
		window.addEventListener('gamepaddisconnected', handleControllerChange);

		return () => {
			cancelAnimationFrame(gamepad.controllerLoop);
			window.removeEventListener('gamepadconnected', handleControllerChange);
			window.removeEventListener('gamepaddisconnected', handleControllerChange);
			unsubscribeGameEvents?.();
			clearHintTimer();
			clearCursorHideTimer();
		};
	});
</script>

<svelte:head>
	<title>LanternLauncher Overlay</title>
</svelte:head>

<svelte:window
	oncontextmenu={(event) => {
		event.preventDefault();
		void resumeGame();
	}}
	onkeydown={onKeydown}
	onmousemove={onMouseMove}
	onmousedown={onMouseBack}
	onpointerdown={onMouseBack}
	onmouseup={onMouseBack}
/>

<div
	class:cursor-none={displayedInputMode !== 'keyboard'}
	class="fixed inset-0 overflow-hidden bg-transparent"
>
	<audio bind:this={selectAudio} preload="auto" src={asset('/sounds/select.mp3')}></audio>
	<audio bind:this={enterAudio} preload="auto" src={asset('/sounds/enter.mp3')}></audio>

	{#if isOverlayOpen}
		{#key animationKey}
			<GameOverlay
				{selected}
				{isStopping}
				inputMode={displayedInputMode}
				isXboxControllerConnected={isDisplayedXboxControllerConnected}
				isDualSenseControllerConnected={isDisplayedDualSenseControllerConnected}
				onSelect={selectOverlayAction}
				onResume={() => void resumeGame()}
				onExit={openExitDialog}
			/>
			{#if isExitDialogOpen}
				<GameOverlayExitDialog
					bind:this={exitDialog}
					inputMode={displayedInputMode}
					isXboxControllerConnected={isDisplayedXboxControllerConnected}
					isDualSenseControllerConnected={isDisplayedDualSenseControllerConnected}
					onResume={() => void resumeGame({ playSound: false })}
					onReturnToLauncher={() => void stopGame({ playSound: false })}
					onExitToDesktop={() => void stopGame({ playSound: false, exitToDesktop: true })}
					{playSelectSound}
					{playEnterSound}
				/>
			{/if}
		{/key}
	{:else if isHintVisible}
		<div class="pointer-events-none absolute inset-x-0 bottom-12 z-40 flex justify-center px-6">
			<div
				class="game-overlay-hint rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,18,0.72),rgba(0,0,0,0.58))] px-5 py-4 text-white shadow-[0_18px_56px_rgba(0,0,0,0.48)] backdrop-blur-[10px]"
			>
				<div class="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/78">
					<span>{$t('gameOverlay.openHintPrefix')}</span>
					<AppIcon name="controller-l3" size={24} />
					<span class="text-white/45">+</span>
					<AppIcon name="controller-r3" size={24} />
					<span class="text-white/35">/</span>
					<span class="rounded border border-white/20 bg-white/8 px-1.5 py-0.5 text-[0.6rem] text-white">F1</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(html),
	:global(body) {
		background: transparent !important;
	}

	.game-overlay-hint {
		animation: gameOverlayHintIn 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes gameOverlayHintIn {
		from {
			opacity: 0;
			transform: translate3d(0, 16px, 0);
		}

		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}
</style>
