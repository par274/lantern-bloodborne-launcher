<script lang="ts">
	import { t } from '$lib/i18n';

	import type { InputMode } from './gamepad';

	type Props = {
		inputMode: InputMode;
		isXboxControllerConnected: boolean;
		isDualSenseControllerConnected: boolean;
		compact?: boolean;
		class?: string;
	};

	let { inputMode, isXboxControllerConnected, isDualSenseControllerConnected, compact = false, class: className = '' }: Props = $props();

	let promptClass = $derived(
		`flex items-center ${compact ? 'gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em]' : 'gap-6 text-md'} text-white/80 ${className}`
	);
	let iconSizeClass = $derived(compact ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]');
	let playstationIconSizeClass = $derived(compact ? 'h-[11px] w-[11px]' : 'h-[14px] w-[14px]');
	let mouseIconSize = $derived(compact ? 20 : 24);
</script>

<div class={promptClass}>
	{#if inputMode === 'xbox' && isXboxControllerConnected}
		<div class="flex items-center gap-2">
			<svg
				class={`${iconSizeClass} text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]`}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9" />
				<path d="M15 16l-3 -8l-3 8" />
				<path d="M14 14h-4" />
			</svg>
			<span>{$t('prompt.select')}</span>
		</div>

		<div class="flex items-center gap-2">
			<svg
				class={`${iconSizeClass} text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]`}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9" />
				<path d="M13 12a2 2 0 1 1 0 4h-3v-4" />
				<path d="M13 12h-3" />
				<path d="M13 12a2 2 0 1 0 0 -4h-3v4" />
			</svg>
			<span>{$t('prompt.back')}</span>
		</div>
	{:else if inputMode === 'dualsense' && isDualSenseControllerConnected}
		<div class="flex items-center gap-2">
			<div class={`flex ${iconSizeClass} items-center justify-center rounded-full border border-[#59b2ff]/40 bg-[#07111a]/80`}>
				<svg
					class={`${playstationIconSizeClass} text-[#59b2ff] drop-shadow-[0_0_6px_rgba(89,178,255,0.55)]`}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
				>
					<path d="M7 7l10 10" />
					<path d="M17 7l-10 10" />
				</svg>
			</div>
			<span>{$t('prompt.select')}</span>
		</div>

		<div class="flex items-center gap-2">
			<div class={`flex ${iconSizeClass} items-center justify-center rounded-full border border-[#ff6b76]/40 bg-[#17080b]/80`}>
				<svg
					class={`${playstationIconSizeClass} text-[#ff6b76] drop-shadow-[0_0_6px_rgba(255,107,118,0.55)]`}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
				>
					<circle cx="12" cy="12" r="7" />
				</svg>
			</div>
			<span>{$t('prompt.back')}</span>
		</div>
	{:else}
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 rounded border border-white/20 bg-black/25 p-[.2rem]">
				<svg
					class={`${iconSizeClass} text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]`}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 6v6a3 3 0 0 1 -3 3h-10l4 -4" />
					<path d="M9 19l-4 -4" />
				</svg>
				<span>/</span>
				<svg
					class="text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]"
					viewBox="0 0 256 256"
					width={mouseIconSize}
					height={mouseIconSize}
					stroke="currentColor"
					fill="currentColor"
					><path
						d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m48 64v24h-64V32h16a48.05 48.05 0 0 1 48 48m-48 144h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48"
					/></svg
				>
			</div>
			<span>{$t('prompt.select')}</span>
		</div>

		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 rounded border border-white/20 bg-black/25 p-[.2rem]">
				<svg
					class={`${iconSizeClass} text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]`}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M20 6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-11l-5 -5a1.5 1.5 0 0 1 0 -2l5 -5l11 0" />
					<path d="M12 10l4 4m0 -4l-4 4" />
				</svg>
				<span>/</span>
				<svg
					class="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]"
					viewBox="0 0 256 256"
					width={mouseIconSize}
					height={mouseIconSize}
					stroke="currentColor"
					fill="currentColor"
					><path
						d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m-32 16h16v72H64V80a48.05 48.05 0 0 1 48-48m32 192h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48"
					/></svg
				>
			</div>
			<span>{$t('prompt.back')}</span>
		</div>
	{/if}
</div>
