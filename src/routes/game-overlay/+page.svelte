<script lang="ts">
	import { onMount } from 'svelte';

	import { asset } from '$app/paths';
	import GameOverlay from '$lib/components/GameOverlay.svelte';
	import { createControllerChangeHandler, createControllerTick, createGamepadState, setKeyboardInputMode } from '$lib/components/gamepad';
	import { PLATFORM_COMMANDS } from '$lib/contracts/commands';
	import { t } from '$lib/i18n';
	import { platformApi } from '$platform/renderer/api';

	const SELECT_SOUND_COOLDOWN_MS = 90;

	let selected = $state(0);
	let isStopping = $state(false);
	let isOverlayOpen = $state(false);
	let isHintVisible = $state(false);
	let animationKey = $state(0);
	let gamepad = $state(createGamepadState());

	let selectAudio: HTMLAudioElement | undefined;
	let enterAudio: HTMLAudioElement | undefined;
	let lastSelectSoundAt = 0;
	let hintTimer: number | undefined;

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

	async function resumeGame() {
		if (!isOverlayOpen) {
			return;
		}

		playEnterSound();
		await platformApi.invoke(PLATFORM_COMMANDS.SET_GAME_OVERLAY_OPEN, { open: false });
	}

	async function toggleOverlay() {
		if (isOverlayOpen) {
			await resumeGame();
			return;
		}

		playEnterSound();
		await platformApi.invoke(PLATFORM_COMMANDS.SET_GAME_OVERLAY_OPEN, { open: true });
	}

	async function stopGame() {
		if (isStopping) {
			return;
		}

		isStopping = true;
		playEnterSound();

		try {
			await platformApi.invoke(PLATFORM_COMMANDS.STOP_GAME, undefined);
		} catch (error) {
			console.warn('Game stop failed.', error);
			isStopping = false;
		}
	}

	function activateSelectedAction() {
		if (!isOverlayOpen) {
			return;
		}

		if (selected === 0) {
			void resumeGame();
			return;
		}

		void stopGame();
	}

	function onKeydown(event: KeyboardEvent) {
		if (!isOverlayOpen) {
			return;
		}

		setKeyboardInputMode(gamepad);

		if (isStopping) {
			event.preventDefault();
			return;
		}

		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			selectOverlayAction(0);
			return;
		}

		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			event.preventDefault();
			selectOverlayAction(1);
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

		setKeyboardInputMode(gamepad);
	}

	function onMouseBack(event: MouseEvent | PointerEvent) {
		if (!isOverlayOpen) {
			return;
		}

		if (event.button !== 2) {
			return;
		}

		event.preventDefault();
		void resumeGame();
	}

	function clearHintTimer() {
		if (!hintTimer) {
			return;
		}

		window.clearTimeout(hintTimer);
		hintTimer = undefined;
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
				if (isOverlayOpen) selectOverlayAction(0);
			},
			moveRight: () => {
				if (isOverlayOpen) selectOverlayAction(1);
			},
			moveUp: () => {
				if (isOverlayOpen) selectOverlayAction(0);
			},
			moveDown: () => {
				if (isOverlayOpen) selectOverlayAction(1);
			},
			enterSelected: activateSelectedAction,
			goBack: () => void resumeGame(),
			deleteText: () => {},
			confirmText: activateSelectedAction,
			insertSpace: () => {},
			clearText: () => {},
			toggleOverlay: () => void toggleOverlay()
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
				selected = 0;
				isStopping = false;
				animationKey += 1;
				return;
			}

			if (event.type === 'overlay-closed' || event.type === 'session-ended') {
				isOverlayOpen = false;
				isStopping = false;
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

<div class="fixed inset-0 overflow-hidden bg-transparent">
	<audio bind:this={selectAudio} preload="auto" src={asset('/sounds/select.mp3')}></audio>
	<audio bind:this={enterAudio} preload="auto" src={asset('/sounds/enter.mp3')}></audio>

	{#if isOverlayOpen}
		{#key animationKey}
			<GameOverlay
				{selected}
				{isStopping}
				inputMode={gamepad.inputMode}
				isXboxControllerConnected={gamepad.isXboxControllerConnected}
				isDualSenseControllerConnected={gamepad.isDualSenseControllerConnected}
				onSelect={selectOverlayAction}
				onResume={() => void resumeGame()}
				onExit={() => void stopGame()}
			/>
		{/key}
	{:else if isHintVisible}
		<div class="pointer-events-none absolute inset-x-0 bottom-12 z-40 flex justify-center px-6">
			<div
				class="game-overlay-hint rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,18,0.72),rgba(0,0,0,0.58))] px-5 py-4 text-white shadow-[0_18px_56px_rgba(0,0,0,0.48)] backdrop-blur-[10px]"
			>
				<div class="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/78">
					<span>{$t('gameOverlay.openHintPrefix')}</span>
					<span class="rounded border border-white/20 bg-white/8 px-1.5 py-0.5 text-[0.6rem] text-white">L3</span>
					<span class="text-white/45">+</span>
					<span class="rounded border border-white/20 bg-white/8 px-1.5 py-0.5 text-[0.6rem] text-white">R3</span>
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
