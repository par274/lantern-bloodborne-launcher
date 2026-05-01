<script lang="ts">
	type AppIconName =
		| 'chevron-down'
		| 'controller-l3'
		| 'controller-r3'
		| 'dualsense-circle'
		| 'dualsense-cross'
		| 'dualsense-square'
		| 'dualsense-triangle'
		| 'game-exit'
		| 'game-focus'
		| 'game-home'
		| 'game-music'
		| 'game-resume'
		| 'game-settings'
		| 'game-volume'
		| 'globe'
		| 'keyboard-backspace'
		| 'keyboard-enter'
		| 'keyboard-i'
		| 'mouse-left'
		| 'mouse-right'
		| 'search'
		| 'xbox-a'
		| 'xbox-b'
		| 'xbox-x'
		| 'xbox-y';

	type Props = {
		name: AppIconName;
		class?: string;
		size?: number;
		style?: string;
	};

	const DEFAULT_ICON_STYLE: Partial<Record<AppIconName, string>> = {
		'controller-l3': 'color: rgba(255,255,255,0.16); filter: drop-shadow(0 0 7px rgba(255,255,255,0.18));',
		'controller-r3': 'color: rgba(255,255,255,0.16); filter: drop-shadow(0 0 7px rgba(255,255,255,0.18));',
		'dualsense-circle': 'color: #ff6b76; filter: drop-shadow(0 0 6px rgba(255,107,118,0.55));',
		'dualsense-cross': 'color: #59b2ff; filter: drop-shadow(0 0 6px rgba(89,178,255,0.55));',
		'dualsense-square': 'color: #ff7ac8; filter: drop-shadow(0 0 6px rgba(255,122,200,0.55));',
		'dualsense-triangle': 'color: #67e8f9; filter: drop-shadow(0 0 6px rgba(103,232,249,0.55));',
		'game-exit': 'color: currentColor;',
		'game-focus': 'color: currentColor;',
		'game-home': 'color: currentColor;',
		'game-music': 'color: currentColor;',
		'game-resume': 'color: currentColor;',
		'game-settings': 'color: currentColor;',
		'game-volume': 'color: currentColor;',
		'keyboard-backspace': 'color: rgb(239 68 68); filter: drop-shadow(0 0 6px rgba(239,68,68,0.6));',
		'keyboard-enter': 'color: rgb(34 197 94); filter: drop-shadow(0 0 6px rgba(34,197,94,0.6));',
		'keyboard-i': 'color: #fff;',
		'mouse-left': 'color: rgb(34 197 94); filter: drop-shadow(0 0 6px rgba(34,197,94,0.6));',
		'mouse-right': 'color: rgb(239 68 68); filter: drop-shadow(0 0 6px rgba(239,68,68,0.6));',
		'xbox-a': 'color: rgb(34 197 94); filter: drop-shadow(0 0 6px rgba(34,197,94,0.6));',
		'xbox-b': 'color: rgb(239 68 68); filter: drop-shadow(0 0 6px rgba(239,68,68,0.6));',
		'xbox-x': 'color: rgb(96 165 250); filter: drop-shadow(0 0 6px rgba(96,165,250,0.6));',
		'xbox-y': 'color: rgb(254 240 138); filter: drop-shadow(0 0 6px rgba(250,204,21,0.55));'
	};

	const DEFAULT_ICON_SIZE: Partial<Record<AppIconName, number>> = {
		'controller-l3': 24,
		'controller-r3': 24,
		'dualsense-square': 22,
		'dualsense-triangle': 22,
		'game-exit': 24,
		'game-focus': 24,
		'game-home': 24,
		'game-music': 24,
		'game-resume': 24,
		'game-settings': 24,
		'game-volume': 24,
		'keyboard-backspace': 24,
		'keyboard-enter': 24,
		'keyboard-i': 22,
		'xbox-a': 22,
		'xbox-b': 22,
		'xbox-x': 22,
		'xbox-y': 22
	};

	let { name, class: className = '', size = undefined, style = '' }: Props = $props();

	function resolveStyle(iconName: AppIconName, iconSize: number | undefined, extraStyle: string): string {
		const defaultStyle = DEFAULT_ICON_STYLE[iconName] ?? '';
		const resolvedSize = typeof iconSize === 'number' ? iconSize : DEFAULT_ICON_SIZE[iconName];
		const sizeStyle = typeof resolvedSize === 'number' ? `width: ${resolvedSize}px; height: ${resolvedSize}px;` : '';

		return [defaultStyle, sizeStyle, extraStyle].filter(Boolean).join(' ');
	}

	const resolvedStyle = $derived(resolveStyle(name, size, style));
</script>

{#if name === 'controller-l3'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 64 64" fill="none">
		<circle cx="32" cy="32" r="28" fill="currentColor" />
		<circle cx="32" cy="32" r="23" stroke="white" stroke-width="3" />
		<text x="32" y="40" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="400" fill="white">
			L3
		</text>
	</svg>
{:else if name === 'controller-r3'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 64 64" fill="none">
		<circle cx="32" cy="32" r="28" fill="currentColor" />
		<circle cx="32" cy="32" r="23" stroke="white" stroke-width="3" />
		<text x="32" y="40" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="400" fill="white">
			R3
		</text>
	</svg>
{:else if name === 'xbox-a'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9" />
		<path d="M15 16l-3 -8l-3 8" />
		<path d="M14 14h-4" />
	</svg>
{:else if name === 'xbox-b'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9" />
		<path d="M13 12a2 2 0 1 1 0 4h-3v-4" />
		<path d="M13 12h-3" />
		<path d="M13 12a2 2 0 1 0 0 -4h-3v4" />
	</svg>
{:else if name === 'xbox-x'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9" />
		<path d="M9 8l6 8" />
		<path d="M15 8l-6 8" />
	</svg>
{:else if name === 'xbox-y'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9" />
		<path d="M9 8l3 4" />
		<path d="M15 8l-2.988 3.984l-.012 4.016" />
	</svg>
{:else if name === 'dualsense-cross'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.2"
		stroke-linecap="round"
	>
		<path d="M7 7l10 10" />
		<path d="M17 7l-10 10" />
	</svg>
{:else if name === 'dualsense-circle'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9"
		/><path d="M7.5 12a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0" /></svg
	>
{:else if name === 'dualsense-square'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9"
		/><path d="M8 9a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1l0 -6" /></svg
	>
{:else if name === 'dualsense-triangle'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9" />
		<path d="M7.5 15h9l-4.5 -8l-4.5 8" />
	</svg>
{:else if name === 'game-exit'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 24 24" fill="currentColor">
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path
			d="M6.707 5.293l5.293 5.292l5.293 -5.292a1 1 0 0 1 1.414 1.414l-5.292 5.293l5.292 5.293a1 1 0 0 1 -1.414 1.414l-5.293 -5.292l-5.293 5.292a1 1 0 1 1 -1.414 -1.414l5.292 -5.293l-5.292 -5.293a1 1 0 0 1 1.414 -1.414"
		/>
	</svg>
{:else if name === 'game-focus'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M6 4v4" />
		<path d="M4 6h4" />
		<path d="M18 4v4" />
		<path d="M16 6h4" />
		<path d="M6 16v4" />
		<path d="M4 18h4" />
		<path d="M18 16v4" />
		<path d="M16 18h4" />
		<path d="M12 9v6" />
		<path d="M9 12h6" />
	</svg>
{:else if name === 'game-home'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 24 24" fill="currentColor">
		<path d="M4 11.5l8 -7.5l8 7.5v7.5a1 1 0 0 1 -1 1h-5v-5h-4v5h-5a1 1 0 0 1 -1 -1z" />
	</svg>
{:else if name === 'game-music'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M9 18v-12l10 -2v12" />
		<path d="M9 18a3 3 0 1 1 -3 -3a3 3 0 0 1 3 3" />
		<path d="M19 16a3 3 0 1 1 -3 -3a3 3 0 0 1 3 3" />
	</svg>
{:else if name === 'game-resume'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path d="M7 4v16l13 -8l-13 -8" />
	</svg>
{:else if name === 'game-settings'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M4 8h4" />
		<path d="M6 6v4" />
		<path d="M12 6h8" />
		<path d="M4 16h10" />
		<path d="M18 14v4" />
		<path d="M16 16h4" />
	</svg>
{:else if name === 'game-volume'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M4 10v4h4l5 5v-14l-5 5z" />
		<path d="M16 9a4 4 0 0 1 0 6" />
		<path d="M19 6a8 8 0 0 1 0 12" />
	</svg>
{:else if name === 'keyboard-enter'}
	<svg
		class={className}
		style={resolvedStyle}
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
{:else if name === 'keyboard-i'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 22 22">
		<rect x="8" y="8" width="18" height="18" rx="10" fill="none" />
		<text
			x="50%"
			y="50%"
			text-anchor="middle"
			dominant-baseline="central"
			font-family="Arial, Helvetica, sans-serif"
			font-size="18"
			font-weight="700"
			fill="currentColor">i</text
		>
	</svg>
{:else if name === 'keyboard-backspace'}
	<svg
		class={className}
		style={resolvedStyle}
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
{:else if name === 'mouse-left'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 256 256" stroke="currentColor" fill="currentColor">
		<path
			d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m48 64v24h-64V32h16a48.05 48.05 0 0 1 48 48m-48 144h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48"
		/>
	</svg>
{:else if name === 'mouse-right'}
	<svg class={className} style={resolvedStyle} viewBox="0 0 256 256" stroke="currentColor" fill="currentColor">
		<path
			d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m-32 16h16v72H64V80a48.05 48.05 0 0 1 48-48m32 192h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48"
		/>
	</svg>
{:else if name === 'search'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M10 18a8 8 0 1 1 5.3 -14a8 8 0 0 1 -5.3 14z" />
		<path d="M16 16l5 5" />
	</svg>
{:else if name === 'globe'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.7"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="12" cy="12" r="9" />
		<path d="M3 12h18" />
		<path d="M12 3a14.5 14.5 0 0 1 0 18" />
		<path d="M12 3a14.5 14.5 0 0 0 0 18" />
	</svg>
{:else if name === 'chevron-down'}
	<svg
		class={className}
		style={resolvedStyle}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
{/if}
