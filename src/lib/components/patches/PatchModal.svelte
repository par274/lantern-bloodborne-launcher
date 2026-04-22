<script module lang="ts">
	export type PatchModalController = {
		moveUp: () => void;
		moveDown: () => void;
		moveLeft: () => void;
		moveRight: () => void;
		enterSelected: () => void;
		goBack: () => void;
		deleteText: () => void;
		confirmText: () => void;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import {
		PLATFORM_COMMANDS,
		type BloodbornePatchCatalogItem,
		type BloodbornePatchUpdateStatusSnapshot
	} from '$lib/contracts/commands';
	import { t } from '$lib/i18n';
	import { BLOODBORNE_PATCHES, getBloodbornePatchByMetadataName } from '$lib/patches/bloodbornePatches';
	import type { TranslationKey } from '$lib/translations/translations';
	import { platformApi } from '$platform/renderer/api';

	import InputPrompts from '$lib/components/InputPrompts.svelte';
	import VirtualKeyboard, { VIRTUAL_KEYBOARD_ROWS, type VirtualKeyboardKey } from '$lib/components/VirtualKeyboard.svelte';
	import type { InputMode } from '$lib/components/gamepad';

	type StaticBloodbornePatch = (typeof BLOODBORNE_PATCHES)[number];
	type StaticBloodbornePatchNoteKey = Extract<StaticBloodbornePatch, { noteKey: string }>['noteKey'];
	type BloodbornePatch = BloodbornePatchCatalogItem & {
		nameKey?: StaticBloodbornePatch['nameKey'];
		noteKey?: StaticBloodbornePatchNoteKey;
	};

	type Props = {
		inputMode: InputMode;
		isXboxControllerConnected: boolean;
		isDualSenseControllerConnected: boolean;
		onClose: () => void;
		onKeyboardInput: () => void;
		playSelectSound: () => void;
		playEnterSound: () => void;
	};

	const DEFAULT_PATCH_UPDATE_STATUS: BloodbornePatchUpdateStatusSnapshot = {
		key: 'patch.update.idle',
		progress: null,
		isUpdating: false,
		error: null
	};

	let {
		inputMode,
		isXboxControllerConnected,
		isDualSenseControllerConnected,
		onClose,
		onKeyboardInput,
		playSelectSound,
		playEnterSound
	}: Props = $props();

	let patchSearchQuery = $state('');
	let isPatchSearchFocused = $state(false);
	let selectedPatchIndex = $state(0);
	let selectedVirtualKeyboardRow = $state(1);
	let selectedVirtualKeyboardColumn = $state(0);
	let enabledPatchIds = $state<string[]>([]);
	let patchCatalog = $state<BloodbornePatch[]>(createStaticPatchCatalog());
	let patchUpdateStatus = $state<BloodbornePatchUpdateStatusSnapshot>(DEFAULT_PATCH_UPDATE_STATUS);
	let patchListElement = $state<HTMLDivElement | undefined>(undefined);
	let patchSearchInput = $state<HTMLInputElement | undefined>(undefined);

	let isControllerInputActive = $derived(inputMode !== 'keyboard' && (isXboxControllerConnected || isDualSenseControllerConnected));
	let isVirtualKeyboardOpen = $derived(isPatchSearchFocused && isControllerInputActive);
	let filteredPatches = $derived.by(() => {
		const query = patchSearchQuery.trim().toLocaleLowerCase();
		const translate = $t;

		if (!query) {
			return patchCatalog;
		}

		return patchCatalog.filter((patch) => {
			const searchText = [
				patch.id,
				patch.metadataName,
				patch.author ?? '',
				patch.nameKey ? translate(patch.nameKey) : patch.metadataName,
				patch.noteKey ? translate(patch.noteKey) : (patch.note ?? '')
			]
				.join(' ')
				.toLocaleLowerCase();

			return searchText.includes(query);
		});
	});
	let selectedPatch = $derived(filteredPatches[selectedPatchIndex] ?? filteredPatches[0] ?? null);
	let selectedPatchTitle = $derived(
		selectedPatch ? (selectedPatch.nameKey ? $t(selectedPatch.nameKey) : selectedPatch.metadataName) : ''
	);
	let selectedPatchNote = $derived(
		selectedPatch
			? selectedPatch.noteKey
				? $t(selectedPatch.noteKey)
				: (selectedPatch.note ?? $t('patch.descriptionUnavailable'))
			: ''
	);
	let enabledPatchCount = $derived(enabledPatchIds.length);

	$effect(() => {
		if (filteredPatches.length === 0) {
			selectedPatchIndex = 0;
			return;
		}

		if (selectedPatchIndex >= filteredPatches.length) {
			selectedPatchIndex = filteredPatches.length - 1;
		}
	});

	$effect(() => {
		if (!patchUpdateStatus.isUpdating) {
			return;
		}

		const interval = window.setInterval(() => {
			void refreshPatchUpdateStatus();
		}, 120);

		return () => {
			window.clearInterval(interval);
		};
	});

	function createPatchCatalogItem(item: BloodbornePatchCatalogItem): BloodbornePatch {
		const launcherDefinition = getBloodbornePatchByMetadataName(item.metadataName);
		const noteKey = launcherDefinition && 'noteKey' in launcherDefinition ? launcherDefinition.noteKey : undefined;

		return {
			...item,
			nameKey: launcherDefinition?.nameKey,
			noteKey
		};
	}

	function createStaticPatchCatalog(): BloodbornePatch[] {
		return BLOODBORNE_PATCHES.map((patch) =>
			createPatchCatalogItem({
				id: patch.id,
				metadataName: patch.metadataName,
				author: null,
				note: null,
				appVersion: null,
				hasLauncherDefinition: true
			})
		);
	}

	function resolvePatchUpdateStatusKey(key: string): TranslationKey {
		switch (key) {
			case 'patch.update.downloading':
				return 'patch.update.downloading';
			case 'patch.update.writing':
				return 'patch.update.writing';
			case 'patch.update.complete':
				return 'patch.update.complete';
			case 'patch.update.failed':
				return 'patch.update.failed';
			default:
				return 'patch.update.idle';
		}
	}

	function scrollPatchSelectionIntoView(patchIndex = selectedPatchIndex) {
		if (!patchListElement) {
			return;
		}

		const selectedElement = patchListElement.querySelector<HTMLElement>(`[data-patch-index="${patchIndex}"]`);

		if (!selectedElement) {
			return;
		}

		const listRect = patchListElement.getBoundingClientRect();
		const selectedRect = selectedElement.getBoundingClientRect();
		const edgePadding = 10;
		const topOverflow = selectedRect.top - (listRect.top + edgePadding);
		const bottomOverflow = selectedRect.bottom - (listRect.bottom - edgePadding);
		const maxScrollTop = patchListElement.scrollHeight - patchListElement.clientHeight;
		let nextScrollTop: number | null = null;

		if (topOverflow < 0) {
			nextScrollTop = patchListElement.scrollTop + topOverflow;
		}

		if (bottomOverflow > 0) {
			nextScrollTop = patchListElement.scrollTop + bottomOverflow;
		}

		if (nextScrollTop === null) {
			return;
		}

		nextScrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));

		if (Math.abs(patchListElement.scrollTop - nextScrollTop) < 1) {
			return;
		}

		patchListElement.scrollTo({
			top: nextScrollTop,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		});
	}

	async function refreshPatchCatalog() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			const nextCatalog = await platformApi.invoke(PLATFORM_COMMANDS.GET_BLOODBORNE_PATCH_CATALOG, undefined);
			patchCatalog = nextCatalog.map(createPatchCatalogItem);
			selectedPatchIndex = Math.min(selectedPatchIndex, Math.max(0, patchCatalog.length - 1));
		} catch (error) {
			console.warn('Bloodborne patch catalog could not be loaded.', error);
		}
	}

	async function refreshPatchUpdateStatus() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			patchUpdateStatus = await platformApi.invoke(PLATFORM_COMMANDS.GET_BLOODBORNE_PATCH_UPDATE_STATUS, undefined);
		} catch (error) {
			console.warn('Bloodborne patch update status could not be loaded.', error);
		}
	}

	async function updateBloodbornePatches() {
		if (!platformApi.isAvailable || patchUpdateStatus.isUpdating) {
			return;
		}

		playEnterSound();
		enabledPatchIds = [];
		patchUpdateStatus = {
			key: 'patch.update.downloading',
			progress: 0,
			isUpdating: true,
			error: null
		};

		try {
			const nextCatalog = await platformApi.invoke(PLATFORM_COMMANDS.UPDATE_BLOODBORNE_PATCHES, undefined);
			patchCatalog = nextCatalog.map(createPatchCatalogItem);
			selectedPatchIndex = 0;
			setPatchSearchQuery('');
			await refreshPatchUpdateStatus();
		} catch (error) {
			await refreshPatchUpdateStatus();
			console.warn('Bloodborne patches could not be updated.', error);
		}
	}

	function setPatchSearchQuery(nextQuery: string) {
		if (nextQuery === patchSearchQuery) {
			return;
		}

		patchSearchQuery = nextQuery;
		selectedPatchIndex = 0;

		requestAnimationFrame(() => {
			patchListElement?.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	function focusPatchSearch() {
		isPatchSearchFocused = true;
		selectedVirtualKeyboardRow = 1;
		selectedVirtualKeyboardColumn = 0;
		patchSearchInput?.focus({ preventScroll: true });
		playSelectSound();
	}

	function isPatchEnabled(patch: BloodbornePatch): boolean {
		return enabledPatchIds.includes(patch.id);
	}

	function setPatchSelectedIndex(nextIndex: number, shouldScroll = false) {
		if (nextIndex === selectedPatchIndex) {
			return;
		}

		selectedPatchIndex = nextIndex;

		if (shouldScroll) {
			requestAnimationFrame(() => scrollPatchSelectionIntoView(nextIndex));
		}

		playSelectSound();
	}

	function movePatchSelection(direction: -1 | 1) {
		if (filteredPatches.length === 0) {
			if (isControllerInputActive) {
				focusPatchSearch();
			}

			return;
		}

		if (direction === -1 && selectedPatchIndex === 0 && isControllerInputActive) {
			focusPatchSearch();
			return;
		}

		setPatchSelectedIndex((selectedPatchIndex + direction + filteredPatches.length) % filteredPatches.length, true);
	}

	function togglePatch(patch: BloodbornePatch) {
		if (isPatchEnabled(patch)) {
			enabledPatchIds = enabledPatchIds.filter((patchId) => patchId !== patch.id);
			return;
		}

		enabledPatchIds = [...enabledPatchIds, patch.id];
	}

	function toggleSelectedPatch() {
		if (!selectedPatch) {
			return;
		}

		togglePatch(selectedPatch);
	}

	function handlePatchHover(index: number) {
		onKeyboardInput();
		setPatchSelectedIndex(index);
	}

	function handlePatchClick(patch: BloodbornePatch, index: number) {
		onKeyboardInput();
		setPatchSelectedIndex(index);
		playEnterSound();
		togglePatch(patch);
	}

	function getVirtualKeyboardRow(rowIndex = selectedVirtualKeyboardRow) {
		return VIRTUAL_KEYBOARD_ROWS[rowIndex] ?? VIRTUAL_KEYBOARD_ROWS[0];
	}

	function setVirtualKeyboardSelection(rowIndex: number, columnIndex: number, shouldPlaySound = true) {
		const nextRow = (rowIndex + VIRTUAL_KEYBOARD_ROWS.length) % VIRTUAL_KEYBOARD_ROWS.length;
		const row = getVirtualKeyboardRow(nextRow);
		const nextColumn = Math.max(0, Math.min(row.length - 1, columnIndex));

		if (nextRow === selectedVirtualKeyboardRow && nextColumn === selectedVirtualKeyboardColumn) {
			return;
		}

		selectedVirtualKeyboardRow = nextRow;
		selectedVirtualKeyboardColumn = nextColumn;

		if (shouldPlaySound) {
			playSelectSound();
		}
	}

	function moveVirtualKeyboardSelection(rowDelta: -1 | 0 | 1, columnDelta: -1 | 0 | 1) {
		const nextRow = selectedVirtualKeyboardRow + rowDelta;
		const nextColumn = selectedVirtualKeyboardColumn + columnDelta;

		setVirtualKeyboardSelection(nextRow, nextColumn);
	}

	function closeVirtualKeyboard() {
		isPatchSearchFocused = false;
		patchSearchInput?.blur();
	}

	async function pasteClipboardIntoPatchSearch() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			const clipboardText = await platformApi.invoke(PLATFORM_COMMANDS.READ_CLIPBOARD_TEXT, undefined);
			const safeClipboardText = clipboardText.slice(0, 512);
			if (!safeClipboardText) {
				return;
			}

			setPatchSearchQuery(`${patchSearchQuery}${safeClipboardText}`);
		} catch (error) {
			console.warn('Clipboard text could not be pasted.', error);
		}
	}

	function pressVirtualKeyboardKey(key: VirtualKeyboardKey) {
		playEnterSound();

		switch (key.action) {
			case 'character':
				setPatchSearchQuery(`${patchSearchQuery}${key.value ?? ''}`);
				break;
			case 'space':
				setPatchSearchQuery(`${patchSearchQuery} `);
				break;
			case 'backspace':
				setPatchSearchQuery(patchSearchQuery.slice(0, -1));
				break;
			case 'clear':
				setPatchSearchQuery('');
				break;
			case 'paste':
				void pasteClipboardIntoPatchSearch();
				break;
			case 'done':
				closeVirtualKeyboard();
				break;
		}

		requestAnimationFrame(() => {
			patchSearchInput?.focus({ preventScroll: true });
		});
	}

	function pressSelectedVirtualKeyboardKey() {
		const key = getVirtualKeyboardRow()[selectedVirtualKeyboardColumn];

		if (!key) {
			return;
		}

		pressVirtualKeyboardKey(key);
	}

	export function moveUp() {
		if (isVirtualKeyboardOpen) {
			moveVirtualKeyboardSelection(-1, 0);
			return;
		}

		movePatchSelection(-1);
	}

	export function moveDown() {
		if (isVirtualKeyboardOpen) {
			moveVirtualKeyboardSelection(1, 0);
			return;
		}

		movePatchSelection(1);
	}

	export function moveLeft() {
		if (isVirtualKeyboardOpen) {
			moveVirtualKeyboardSelection(0, -1);
		}
	}

	export function moveRight() {
		if (isVirtualKeyboardOpen) {
			moveVirtualKeyboardSelection(0, 1);
		}
	}

	export function enterSelected() {
		if (isVirtualKeyboardOpen) {
			pressSelectedVirtualKeyboardKey();
			return;
		}

		playEnterSound();
		toggleSelectedPatch();
	}

	export function goBack() {
		if (isVirtualKeyboardOpen) {
			playEnterSound();
			closeVirtualKeyboard();
			return;
		}

		playEnterSound();
		onClose();
	}

	export function deleteText() {
		if (!isVirtualKeyboardOpen) {
			return;
		}

		playEnterSound();
		setPatchSearchQuery(patchSearchQuery.slice(0, -1));

		requestAnimationFrame(() => {
			patchSearchInput?.focus({ preventScroll: true });
		});
	}

	export function confirmText() {
		if (isVirtualKeyboardOpen || isPatchSearchFocused) {
			void pasteClipboardIntoPatchSearch();
			return;
		}

		void updateBloodbornePatches();
	}

	onMount(() => {
		void refreshPatchCatalog();

		if (!isControllerInputActive) {
			requestAnimationFrame(() => {
				patchSearchInput?.focus({ preventScroll: true });
			});
		}
	});
</script>

<div class="fixed inset-0 z-[24] flex items-center justify-center bg-black/35 px-5 py-8 backdrop-blur-[2px]">
	<section
		class="relative grid h-[min(74vh,720px)] w-[min(88vw,980px)] grid-cols-[minmax(280px,0.92fr)_minmax(260px,0.78fr)] overflow-hidden rounded-[30px] border border-[#d0b875]/16 bg-[radial-gradient(circle_at_20%_0%,rgba(202,181,120,0.12),transparent_38%),linear-gradient(180deg,rgba(18,13,10,0.88),rgba(6,5,4,0.82))] shadow-[0_28px_80px_rgba(0,0,0,0.58)]"
		aria-modal="true"
		role="dialog"
	>
		<div class="pointer-events-none absolute inset-0 border border-white/5"></div>

		<div class="relative flex min-h-0 flex-col border-r border-[#c8b27a]/10">
			<div class="border-b border-[#c8b27a]/10 px-6 py-5">
				<div class="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#ccb57a]/72">
					{$t('menu.system.title')}
				</div>
				<div class="mt-1 flex items-end justify-between gap-4">
					<h2 class="text-[1.7rem] font-semibold tracking-[0.01em] text-[#f4ead0]">
						{$t('menu.system.patches')}
					</h2>
					<div
						class="rounded-full border border-[#c8b27a]/16 bg-black/28 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#ccb57a]/78"
					>
						{enabledPatchCount}/{patchCatalog.length}
						{$t('menu.state.enabled')}
					</div>
				</div>

				<div class="mt-4">
					<div
						class="patch-source-badge group relative inline-flex max-w-full items-center overflow-visible rounded-full border border-[#c8b27a]/16 bg-black/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
					>
						<div
							class="border-r border-[#c8b27a]/12 px-3.5 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#ccb57a]/66"
						>
							{$t('patch.update.channel', { channel: 'shadPS4' })}
						</div>
						<button
							class="inline-flex items-center px-3.5 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#f0ddb0]/76 transition hover:text-[#fff2cb] disabled:cursor-wait disabled:opacity-50"
							disabled={patchUpdateStatus.isUpdating}
							onclick={updateBloodbornePatches}
						>
							{#if isControllerInputActive && (inputMode === 'xbox' || inputMode === 'dualsense')}
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-[#c8b27a]/16 bg-black/26 px-2 py-1 text-[0.52rem] tracking-[0.14em] text-[#f0ddb0]/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
								>
									{#if inputMode === 'xbox'}
										<span
											class="flex h-[16px] w-[16px] items-center justify-center rounded-full border border-yellow-200/45 bg-yellow-400/10 text-[0.58rem] font-black leading-none text-yellow-100 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
											aria-hidden="true"
										>
											Y
										</span>
									{:else}
										<span
											class="flex h-[16px] w-[16px] items-center justify-center rounded-full border border-[#67e8f9]/42 bg-[#07131a]/80 text-[#67e8f9] drop-shadow-[0_0_6px_rgba(103,232,249,0.45)]"
											aria-hidden="true"
										>
											<svg
												class="h-[10px] w-[10px]"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.3"
												stroke-linejoin="round"
											>
												<path d="M12 4l8 16H4z" />
											</svg>
										</span>
									{/if}
									<span>{$t('patch.update.button')}</span>
								</span>
							{:else}
								<span>{$t('patch.update.button')}</span>
							{/if}
						</button>
						<a
							class="pointer-events-none absolute left-0 top-[calc(100%+0.45rem)] z-40 max-w-[360px] rounded-[12px] border border-[#c8b27a]/14 bg-black/82 px-3 py-2 text-[0.58rem] font-semibold tracking-[0.08em] text-white/52 opacity-0 shadow-[0_14px_34px_rgba(0,0,0,0.42)] backdrop-blur-[6px] transition duration-150 hover:text-[#f1ddb0] hover:underline group-hover:pointer-events-auto group-hover:opacity-100"
							href="https://github.com/shadps4-emu/ps4_cheats"
							target="_blank"
							rel="noreferrer"
						>
							https://github.com/shadps4-emu/ps4_cheats
						</a>
					</div>

					{#if patchUpdateStatus.isUpdating || patchUpdateStatus.error}
						<div class="mt-2 min-w-0">
							<div
								class="flex items-center justify-between gap-3 text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-white/42"
							>
								<span>{$t(resolvePatchUpdateStatusKey(patchUpdateStatus.key))}</span>
								{#if patchUpdateStatus.progress !== null}
									<span>{patchUpdateStatus.progress}%</span>
								{/if}
							</div>
							<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-black/34">
								<div
									class="h-full rounded-full bg-[#c8b27a]/74 transition-[width] duration-150"
									style={`width: ${patchUpdateStatus.progress ?? 100}%`}
								></div>
							</div>
						</div>
					{/if}
				</div>

				<div class="relative z-30 mt-5">
					<div
						class="flex items-center gap-3 rounded-[18px] border border-[#c8b27a]/14 bg-black/24 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition focus-within:border-[#c8b27a]/34 focus-within:bg-black/34"
					>
						<svg
							class="h-[17px] w-[17px] shrink-0 text-[#ccb57a]/58"
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
						<input
							bind:this={patchSearchInput}
							class="min-w-0 flex-1 border-0 bg-transparent text-[0.82rem] font-semibold tracking-[0.02em] text-[#f4ead0] outline-none placeholder:text-white/28"
							type="search"
							value={patchSearchQuery}
							placeholder={$t('patch.search.placeholder')}
							autocomplete="off"
							spellcheck="false"
							onfocus={() => {
								isPatchSearchFocused = true;
								if (isControllerInputActive) {
									setVirtualKeyboardSelection(selectedVirtualKeyboardRow, selectedVirtualKeyboardColumn, false);
								}
							}}
							onblur={() => {
								isPatchSearchFocused = false;
							}}
							oninput={(event) => setPatchSearchQuery((event.currentTarget as HTMLInputElement).value)}
						/>
						{#if patchSearchQuery}
							<button
								class="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-white/42 transition hover:border-[#c8b27a]/28 hover:text-[#f1ddb0]"
								onclick={() => {
									setPatchSearchQuery('');
									patchSearchInput?.focus({ preventScroll: true });
								}}
							>
								{$t('patch.search.clear')}
							</button>
						{/if}
					</div>

					{#if isVirtualKeyboardOpen}
						<VirtualKeyboard
							class="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-30"
							{inputMode}
							selectedRow={selectedVirtualKeyboardRow}
							selectedColumn={selectedVirtualKeyboardColumn}
							onHover={(row, column) => setVirtualKeyboardSelection(row, column)}
							onKeyPress={pressVirtualKeyboardKey}
						/>
					{/if}
				</div>
			</div>

			<div bind:this={patchListElement} class="patch-list min-h-0 flex-1 overflow-y-auto px-3 py-3">
				{#if filteredPatches.length > 0}
					{#each filteredPatches as patch, i}
						{@const patchEnabled = isPatchEnabled(patch)}
						<button
							data-patch-index={i}
							class:selected={i === selectedPatchIndex}
							class:enabled={patchEnabled}
							class="patch-row group relative mb-1.5 flex w-full items-center justify-between gap-4 rounded-[18px] border border-transparent bg-transparent px-4 py-3 text-left text-white/78 outline-none transition-all duration-150"
							onmouseenter={() => handlePatchHover(i)}
							onclick={() => handlePatchClick(patch, i)}
						>
							<span class="min-w-0">
								<span class="block truncate text-[0.96rem] font-semibold tracking-[0.01em]">
									{patch.nameKey ? $t(patch.nameKey) : patch.metadataName}
								</span>
								<span class="mt-1 block text-[0.62rem] uppercase tracking-[0.2em] text-white/28">
									{patch.id}
								</span>
							</span>

							<span
								class={`shrink-0 rounded-full border px-2.5 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.18em] transition-all duration-150 ${
									patchEnabled
										? 'border-[#bda76f]/40 bg-[#c8b27a]/14 text-[#f3dfaa]'
										: 'border-white/10 bg-black/24 text-white/34'
								}`}
							>
								{patchEnabled ? $t('menu.state.enabled') : $t('menu.state.disabled')}
							</span>
						</button>
					{/each}
				{:else}
					<div
						class="mx-2 mt-3 rounded-[20px] border border-[#c8b27a]/10 bg-black/20 px-5 py-8 text-center text-[0.82rem] leading-[1.6] text-white/42"
					>
						{$t('patch.search.empty')}
					</div>
				{/if}
			</div>
		</div>

		<div class="relative flex min-h-0 flex-col px-7 py-6">
			<button
				type="button"
				class="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/46 transition hover:border-[#c8b27a]/30 hover:text-[#f1ddb0]"
				onclick={() => {
					playEnterSound();
					onClose();
				}}
			>
				{$t('prompt.back')}
			</button>

			{#if selectedPatch}
				<div class="pr-24">
					<div class="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#ccb57a]/72">
						{selectedPatch.id}
					</div>
					<h3 class="mt-3 text-[1.55rem] font-semibold leading-tight text-[#f5ecd5]">
						{selectedPatchTitle}
					</h3>
					{#if selectedPatch.author}
						<div class="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/38">
							{$t('patch.author', { author: selectedPatch.author })}
						</div>
					{/if}
				</div>

				<div class="mt-6 rounded-[24px] border border-[#c8b27a]/10 bg-black/22 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
					<p class="whitespace-pre-line text-[0.88rem] leading-[1.72] text-white/68">
						{selectedPatchNote}
					</p>
				</div>
			{:else}
				<div class="flex min-h-0 flex-1 items-center justify-center">
					<div
						class="max-w-[330px] rounded-[26px] border border-[#c8b27a]/10 bg-black/20 px-6 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
					>
						<div class="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#ccb57a]/62">
							{$t('patch.search.emptyTitle')}
						</div>
						<p class="mt-3 text-[0.88rem] leading-[1.68] text-white/52">
							{$t('patch.search.emptyDescription')}
						</p>
					</div>
				</div>
			{/if}

			<InputPrompts
				compact
				class="mt-auto pt-5 text-white/42"
				{inputMode}
				{isXboxControllerConnected}
				{isDualSenseControllerConnected}
			/>
		</div>
	</section>
</div>
