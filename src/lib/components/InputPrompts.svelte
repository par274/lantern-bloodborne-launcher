<script lang="ts">
	import { t } from '$lib/i18n';

	import AppIcon from './AppIcon.svelte';
	import type { InputMode } from './gamepad';

	type Props = {
		inputMode: InputMode;
		isXboxControllerConnected: boolean;
		isDualSenseControllerConnected: boolean;
		compact?: boolean;
		showInfo?: boolean;
		class?: string;
	};

	let {
		inputMode,
		isXboxControllerConnected,
		isDualSenseControllerConnected,
		compact = false,
		showInfo = false,
		class: className = ''
	}: Props = $props();

	let promptClass = $derived(
		`flex items-center ${compact ? 'gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em]' : 'gap-6 text-md'} text-white/80 ${className}`
	);
	const playstationWrapperClass = 'flex h-[22px] w-[22px] items-center justify-center';
	const playstationIconSizeClass = 'h-[14px] w-[14px]';
	let mouseIconSize = $derived(compact ? 20 : 24);
</script>

<div class={promptClass}>
	{#if inputMode === 'xbox' && isXboxControllerConnected}
		<div class="flex items-center gap-2">
			<AppIcon name="xbox-a" />
			<span>{$t('prompt.select')}</span>
		</div>

		<div class="flex items-center gap-2">
			<AppIcon name="xbox-b" />
			<span>{$t('prompt.back')}</span>
		</div>

		{#if showInfo}
			<div class="flex items-center gap-2">
				<AppIcon name="xbox-y" />
				<span>{$t('prompt.info')}</span>
			</div>
		{/if}
	{:else if inputMode === 'dualsense' && isDualSenseControllerConnected}
		<div class="flex items-center gap-2">
			<div class={`${playstationWrapperClass} rounded-full border border-[#59b2ff]/40 bg-[#07111a]/80`}>
				<AppIcon name="dualsense-cross" class={playstationIconSizeClass} />
			</div>
			<span>{$t('prompt.select')}</span>
		</div>

		<div class="flex items-center gap-2">
			<div class={`${playstationWrapperClass} rounded-full border border-[#ff6b76]/40 bg-[#17080b]/80`}>
				<AppIcon name="dualsense-circle" class={playstationIconSizeClass} />
			</div>
			<span>{$t('prompt.back')}</span>
		</div>

		{#if showInfo}
			<div class="flex items-center gap-2">
				<div class={`${playstationWrapperClass} rounded-full border border-[#67e8f9]/40 bg-[#061316]/80`}>
					<AppIcon name="dualsense-triangle" class={playstationIconSizeClass} />
				</div>
				<span>{$t('prompt.info')}</span>
			</div>
		{/if}
	{:else}
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 rounded border border-white/20 bg-black/25 p-[.2rem]">
				<AppIcon name="keyboard-enter" />
				<span>/</span>
				<AppIcon name="mouse-left" size={mouseIconSize} />
			</div>
			<span>{$t('prompt.select')}</span>
		</div>

		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 rounded border border-white/20 bg-black/25 p-[.2rem]">
				<AppIcon name="keyboard-backspace" />
				<span>/</span>
				<AppIcon name="mouse-right" size={mouseIconSize} />
			</div>
			<span>{$t('prompt.back')}</span>
		</div>

		{#if showInfo}
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-2 rounded border border-white/20 bg-black/25 p-[.2rem]">
					<AppIcon name="keyboard-i" />
				</div>
				<span>{$t('prompt.info')}</span>
			</div>
		{/if}
	{/if}
</div>
