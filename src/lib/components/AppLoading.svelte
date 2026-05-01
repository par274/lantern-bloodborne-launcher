<script lang="ts">
	import type { Snippet } from 'svelte';

	import { t, type TranslationKey } from '$lib/i18n';

	type SplashTranslationKey = Extract<TranslationKey, `splash.${string}`>;

	let {
		titleKey = 'splash.title',
		statusKey,
		progress = null,
		showSpinner = true,
		compact = false,
		children
	}: {
		titleKey?: SplashTranslationKey;
		statusKey: SplashTranslationKey;
		progress?: number | null;
		showSpinner?: boolean;
		compact?: boolean;
		children?: Snippet;
	} = $props();

	const normalizedProgress = $derived(
		typeof progress === 'number' && Number.isFinite(progress) ? Math.min(100, Math.max(0, Math.round(progress))) : null
	);
</script>

<div class={`flex flex-col ${compact ? 'items-center gap-4 text-center' : 'gap-6'}`}>
	<div class="flex flex-col items-center gap-3 text-center">
		<p class="m-0 text-[0.7rem] tracking-[0.32em] text-[rgba(242,228,182,0.54)]">
			{$t('splash.eyebrow')}
		</p>
		{#if showSpinner}
			<div
				class={`${compact ? 'h-[40px] w-[40px]' : 'mt-1 h-[38px] w-[38px]'} animate-spin rounded-full border-2 border-[rgba(242,228,182,0.12)] border-t-[rgba(242,228,182,0.88)] shadow-[0_0_18px_rgba(242,228,182,0.12)]`}
				aria-hidden="true"
			></div>
		{/if}
		<h1 class="m-0 text-base font-semibold tracking-[0.12em]">
			{$t(titleKey)}
		</h1>
		<p class={`m-0 text-[0.78rem] tracking-[0.12em] text-[#f2e4b6]/70 ${compact ? 'max-w-[16rem]' : 'max-w-[26rem]'}`}>
			{$t(statusKey)}
		</p>
		{#if normalizedProgress !== null}
			<div class={`flex w-full flex-col items-center gap-2 ${compact ? 'max-w-[12rem]' : 'max-w-[18rem]'}`}>
				<div class="h-[5px] w-full overflow-hidden rounded-full bg-[#f2e4b6]/10">
					<div
						class="h-full rounded-full bg-[#f2e4b6]/80 transition-[width] duration-150 ease-out"
						style={`width: ${normalizedProgress}%`}
					></div>
				</div>
				<p class="m-0 text-[0.68rem] tracking-[0.22em] text-[#f2e4b6]/56">
					{normalizedProgress}%
				</p>
			</div>
		{/if}
	</div>

	{#if children}
		{@render children()}
	{/if}
</div>
