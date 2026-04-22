<script lang="ts">
	import type { Snippet } from 'svelte';
	import { locale } from '$lib/i18n';
	import '../app.css';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		if (typeof document === 'undefined') {
			return;
		}

		document.documentElement.lang = $locale;
	});
</script>

{@render children()}
