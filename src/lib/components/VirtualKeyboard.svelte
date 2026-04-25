<script module lang="ts">
	export type VirtualKeyboardKeyAction = 'character' | 'space' | 'backspace' | 'clear' | 'paste' | 'done';

	export type VirtualKeyboardKey = {
		label: string;
		value?: string;
		action: VirtualKeyboardKeyAction;
		wide?: boolean;
	};

	function characterKey(value: string): VirtualKeyboardKey {
		return {
			label: value.toUpperCase(),
			value,
			action: 'character'
		};
	}

	export const VIRTUAL_KEYBOARD_ROWS = [
		'1234567890'.split('').map(characterKey),
		'qwertyuiop'.split('').map(characterKey),
		'asdfghjkl'.split('').map(characterKey),
		[...'zxcvbnm'.split('').map(characterKey), { label: 'Backspace', action: 'backspace', wide: true }],
		[
			{ label: 'Space', value: ' ', action: 'space', wide: true },
			{ label: 'Clear', action: 'clear', wide: true },
			{ label: 'Paste', action: 'paste', wide: true },
			{ label: 'Done', action: 'done', wide: true }
		]
	] as const satisfies readonly (readonly VirtualKeyboardKey[])[];
</script>

<script lang="ts">
	import { t } from '$lib/i18n';

	import type { InputMode } from './gamepad';

	type Props = {
		inputMode: InputMode;
		selectedRow: number;
		selectedColumn: number;
		onKeyPress: (key: VirtualKeyboardKey) => void;
		onHover: (row: number, column: number) => void;
		class?: string;
	};

	let { inputMode, selectedRow, selectedColumn, onKeyPress, onHover, class: className = '' }: Props = $props();

	function resolveShortcut(action: VirtualKeyboardKeyAction): string | null {
		if (inputMode === 'xbox') {
			if (action === 'space') return 'LB';
			if (action === 'backspace') return 'X';
			if (action === 'paste') return 'Y';
			if (action === 'clear') return 'RB';
			if (action === 'done') return 'A';
			return null;
		}

		if (inputMode === 'dualsense') {
			if (action === 'space') return 'L1';
			if (action === 'backspace') return '□';
			if (action === 'paste') return '△';
			if (action === 'clear') return 'R1';
			if (action === 'done') return 'X';
			return null;
		}

		return null;
	}

	function resolveKeyLabel(key: VirtualKeyboardKey): string {
		switch (key.action) {
			case 'space':
				return $t('virtualKeyboard.space');
			case 'backspace':
				return $t('virtualKeyboard.backspace');
			case 'clear':
				return $t('virtualKeyboard.clear');
			case 'paste':
				return $t('virtualKeyboard.paste');
			case 'done':
				return $t('virtualKeyboard.done');
			default:
				return key.label;
		}
	}
</script>

<div
	class={`bb-panel-surface rounded-[20px] border border-[#c8b27a]/16 bg-[radial-gradient(circle_at_20%_0%,rgba(202,181,120,0.12),transparent_40%),rgba(5,4,3,0.86)] p-3 shadow-[0_16px_42px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-[8px] ${className}`}
>
	<div class="mb-2 flex items-center justify-between gap-3 text-[0.52rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/62">
		<span>{$t('virtualKeyboard.title')}</span>
		{#if inputMode !== 'keyboard'}
			<span class="text-white/30">
				{inputMode === 'dualsense' ? 'X/O/□/△/L1/R1' : 'A/B/X/Y/LB/RB'}
			</span>
		{/if}
	</div>

	<div class="flex flex-col gap-1.5">
		{#each VIRTUAL_KEYBOARD_ROWS as row, rowIndex}
			<div class="flex justify-center gap-1.5">
				{#each row as key, columnIndex}
					{@const shortcut = resolveShortcut(key.action)}
					<button
						class:selected={rowIndex === selectedRow && columnIndex === selectedColumn}
						class:wide={key.wide}
						class="keyboard-key flex h-7 min-w-7 items-center justify-center rounded-[9px] border border-white/8 bg-white/[0.035] px-2 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-white/64 outline-none transition-all duration-150"
						onmousedown={(event) => event.preventDefault()}
						onmouseenter={() => onHover(rowIndex, columnIndex)}
						onclick={() => onKeyPress(key)}
					>
						{#if shortcut}
							<span
								class="mr-1 rounded-[5px] border border-white/10 bg-black/28 px-1 text-[0.48rem] leading-[1.25rem] text-[#ccb57a]/78"
							>
								{shortcut}
							</span>
						{/if}
						<span>{resolveKeyLabel(key)}</span>
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>
