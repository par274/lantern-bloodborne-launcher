<script module lang="ts">
	export type ConfirmDialogController = {
		moveLeft: () => void;
		moveRight: () => void;
		moveUp: () => void;
		moveDown: () => void;
		enterSelected: () => void;
		goBack: () => void;
	};
</script>

<script lang="ts">
	import { t } from '$lib/i18n';
	import type { TranslationKey } from '$lib/translations/translations';

	import InputPrompts from '$lib/components/InputPrompts.svelte';
	import type { InputMode } from '$lib/components/gamepad';

	type DialogAction = 'cancel' | 'confirm';

	type Props = {
		titleKey: TranslationKey;
		messageKey: TranslationKey;
		confirmKey?: TranslationKey;
		cancelKey?: TranslationKey;
		inputMode: InputMode;
		isXboxControllerConnected: boolean;
		isDualSenseControllerConnected: boolean;
		onConfirm: () => void | Promise<void>;
		onCancel: () => void | Promise<void>;
		playSelectSound?: () => void;
		playEnterSound?: () => void;
	};

	let {
		titleKey,
		messageKey,
		confirmKey = 'menu.state.confirmDelete',
		cancelKey = 'menu.state.cancel',
		inputMode,
		isXboxControllerConnected,
		isDualSenseControllerConnected,
		onConfirm,
		onCancel,
		playSelectSound = () => {},
		playEnterSound = () => {}
	}: Props = $props();

	let selectedAction = $state<DialogAction>('cancel');

	function setSelectedAction(action: DialogAction) {
		if (selectedAction === action) {
			return;
		}

		selectedAction = action;
		playSelectSound();
	}

	function runDialogAction(action: DialogAction) {
		playEnterSound();

		if (action === 'confirm') {
			void onConfirm();
			return;
		}

		void onCancel();
	}

	export function moveLeft() {
		setSelectedAction('cancel');
	}

	export function moveRight() {
		setSelectedAction('confirm');
	}

	export function moveUp() {}

	export function moveDown() {}

	export function enterSelected() {
		runDialogAction(selectedAction);
	}

	export function goBack() {
		runDialogAction('cancel');
	}
</script>

<div class="fixed inset-0 z-[26] flex items-center justify-center bg-black/42 px-5 py-8 backdrop-blur-[2px]">
	<section
		class="relative w-[min(88vw,460px)] overflow-hidden rounded-[26px] border border-[#d0b875]/18 bg-[radial-gradient(circle_at_18%_0%,rgba(202,181,120,0.14),transparent_42%),linear-gradient(180deg,rgba(18,13,10,0.94),rgba(6,5,4,0.9))] px-6 py-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.58)]"
		aria-modal="true"
		role="dialog"
	>
		<div class="pointer-events-none absolute inset-0 border border-white/5"></div>

		<div class="relative">
			<div class="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#ccb57a]/68">
				{$t('menu.system.general.deleteShaderCache')}
			</div>

			<h2 class="mt-2 text-[1.35rem] font-semibold tracking-[0.02em] text-[#f4ead0]">
				{$t(titleKey)}
			</h2>

			<p class="mx-auto mt-3 max-w-[22rem] text-[0.82rem] leading-[1.72] text-white/62">
				{$t(messageKey)}
			</p>

			<div class="mt-6 flex justify-center gap-3">
				<button
					type="button"
					class:selected={selectedAction === 'cancel'}
					class="confirm-dialog-action rounded-full border border-white/10 bg-black/26 px-5 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/48 outline-none transition hover:border-[#c8b27a]/24 hover:text-[#f4ead0] [&.selected]:border-[#c8b27a]/34 [&.selected]:bg-[#c8b27a]/10 [&.selected]:text-[#fff0bd]"
					onmouseenter={() => setSelectedAction('cancel')}
					onclick={() => runDialogAction('cancel')}
				>
					{$t(cancelKey)}
				</button>

				<button
					type="button"
					class:selected={selectedAction === 'confirm'}
					class="confirm-dialog-action rounded-full border border-red-300/18 bg-red-950/18 px-5 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-red-100/62 outline-none transition hover:border-red-200/34 hover:text-red-50 [&.selected]:border-red-200/42 [&.selected]:bg-red-500/13 [&.selected]:text-red-50"
					onmouseenter={() => setSelectedAction('confirm')}
					onclick={() => runDialogAction('confirm')}
				>
					{$t(confirmKey)}
				</button>
			</div>

			<InputPrompts
				compact
				class="mt-5 justify-center text-white/36"
				{inputMode}
				{isXboxControllerConnected}
				{isDualSenseControllerConnected}
			/>
		</div>
	</section>
</div>
