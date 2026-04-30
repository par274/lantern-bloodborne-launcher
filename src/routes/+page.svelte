<script lang="ts">
	import { onMount } from 'svelte';

	import { asset } from '$app/paths';
	import { PLATFORM_COMMANDS, type Shadps4GraphicsSettings } from '$lib/contracts/commands';
	import type { LauncherBootstrapState } from '$lib/contracts/launcherConfig';
	import { setLocale, t } from '$lib/i18n';
	import type { TranslationKey } from '$lib/translations/translations';
	import app from '$platform/app';
	import { platformApi } from '$platform/renderer/api';

	import AppMenu, {
		createAppMenuTree,
		isMenuDropdown,
		isMenuInputDropdown,
		isMenuRangeDropdown,
		isMenuSubtree,
		resolveMenuBranch
	} from '$lib/components/AppMenu.svelte';
	import AppLoading from '$lib/components/AppLoading.svelte';
	import ConfirmDialog, { type ConfirmDialogController } from '$lib/components/ConfirmDialog.svelte';
	import Shadps4Modal, { type Shadps4ModalController } from '$lib/components/emulator/Shadps4Modal.svelte';
	import InputPrompts from '$lib/components/InputPrompts.svelte';
	import LauncherInfoBox from '$lib/components/LauncherInfoBox.svelte';
	import PatchModal, { type PatchModalController } from '$lib/components/patches/PatchModal.svelte';
	import SmokeLayer from '$lib/components/scene/SmokeLayer.svelte';
	import { VIRTUAL_KEYBOARD_ROWS, type VirtualKeyboardKey } from '$lib/components/VirtualKeyboard.svelte';
	import {
		createControllerChangeHandler,
		createControllerTick,
		createGamepadState,
		setDetectedControllerInputMode,
		setKeyboardInputMode,
		updateInputPrompts
	} from '$lib/components/gamepad';

	import {
		createDefaultGraphicsMenuState,
		createGraphicsMenuTree,
		resolveGraphicsPresetValueKey,
		type GraphicsPresetSelection
	} from '$lib/menus/graphicsMenu';
	import { createDefaultGeneralSettings, createGeneralMenuTree } from '$lib/menus/generalMenu';

	const SELECT_SOUND_COOLDOWN_MS = 90;

	let menuPath = $state<number[]>([]);
	let selected = $state(0);
	let activeDropdownIndex = $state<number | null>(null);
	let activeDropdownSelectedIndex = $state(0);
	let selectedVirtualKeyboardRow = $state(1);
	let selectedVirtualKeyboardColumn = $state(0);
	let gamepad = $state(createGamepadState());
	let launcherBootstrapState = $state<LauncherBootstrapState | null>(null);
	let isIntroOverlayVisible = $state(true);
	let isIntroOverlayFading = $state(false);
	let isLauncherInfoModalOpen = $state(false);
	let isPatchModalOpen = $state(false);
	let isShadps4ModalOpen = $state(false);
	let isShaderCacheConfirmOpen = $state(false);
	let isEmbeddedGameActive = $state(false);
	let isGameLaunchPending = $state(false);
	let patchModal = $state<PatchModalController | undefined>(undefined);
	let shadps4Modal = $state<Shadps4ModalController | undefined>(undefined);
	let shaderCacheConfirmDialog = $state<ConfirmDialogController | undefined>(undefined);
	let graphicsMenuState = $state(createDefaultGraphicsMenuState());
	let generalSettings = $state(createDefaultGeneralSettings());
	let trophyKeyInputValue = $state('');
	let shaderCacheDeleteProgress = $state<number | null>(null);
	let shaderCacheDeleteStatusKey = $state<TranslationKey | null>(null);
	let shaderCacheDeleteResetTimer: number | undefined;

	let selectAudio: HTMLAudioElement | undefined;
	let enterAudio: HTMLAudioElement | undefined;
	let lastSelectSoundAt = 0;
	let hasReportedRendererSceneReady = false;
	let hasSmokeLayerReady = false;
	let resolveSmokeLayerReady: () => void = () => {};
	const smokeLayerReady = new Promise<void>((resolve) => {
		resolveSmokeLayerReady = resolve;
	});

	let appMenuTree = $derived(
		createAppMenuTree({
			generalMenu: createGeneralMenuTree({
				settings: generalSettings,
				trophyKeyInputValue,
				applySettings: applyGeneralSettings,
				setTrophyKeyInputValue,
				submitTrophyKey,
				requestShaderCacheDelete,
				shaderCacheDeleteProgress,
				shaderCacheDeleteStatusKey
			}),
			graphicsMenu: createGraphicsMenuTree({
				state: graphicsMenuState,
				selectPreset: selectGraphicsPreset,
				applyCustomSetting: applyCustomGraphicsSetting,
				applyIndependentSetting: applyIndependentGraphicsSetting
			}),
			graphicsValueKey: resolveGraphicsPresetValueKey(graphicsMenuState),
			onLaunchGame: launchGame,
			onSavedGames: noopMenuAction,
			onModManager: noopMenuAction,
			onEmulator: openShadps4Modal,
			onControls: noopMenuAction,
			onInterface: noopMenuAction,
			onPatches: openPatchModal,
			onExit: () => platformApi.invoke(PLATFORM_COMMANDS.APP_EXIT, undefined)
		})
	);
	let currentMenu = $derived(resolveMenuBranch(appMenuTree, menuPath));
	let currentItems = $derived(currentMenu.items);
	let selectedMenuItem = $derived(currentItems[selected]);
	let selectedMenuDescriptionKey = $derived(selectedMenuItem?.descriptionKey ?? currentMenu.descriptionKey ?? null);
	let selectedMenuDescriptionTitleKey = $derived(selectedMenuItem?.descriptionKey ? selectedMenuItem.labelKey : currentMenu.titleKey);
	let activeDropdownItem = $derived(activeDropdownIndex === null ? null : currentItems[activeDropdownIndex]);
	let activeDropdownOptions = $derived(activeDropdownItem && isMenuDropdown(activeDropdownItem) ? activeDropdownItem.dropdown : []);
	let activeInputDropdown = $derived(
		activeDropdownItem && isMenuInputDropdown(activeDropdownItem) ? activeDropdownItem.inputDropdown : null
	);
	let activeRangeDropdown = $derived(
		activeDropdownItem && isMenuRangeDropdown(activeDropdownItem) ? activeDropdownItem.rangeDropdown : null
	);
	let isStartGameAvailable = $derived(launcherBootstrapState ? launcherBootstrapState.emulator.shadps4.isAvailable : true);
	let isControllerInputActive = $derived(
		gamepad.inputMode !== 'keyboard' && (gamepad.isXboxControllerConnected || gamepad.isDualSenseControllerConnected)
	);
	let isLauncherInfoPromptVisible = $derived(
		menuPath.length === 0 &&
			activeDropdownIndex === null &&
			!isLauncherInfoModalOpen &&
			!isPatchModalOpen &&
			!isShadps4ModalOpen &&
			!isShaderCacheConfirmOpen
	);

	$effect(() => {
		if (currentItems.length === 0) {
			selected = 0;
			return;
		}

		if (selected >= currentItems.length) {
			selected = currentItems.length - 1;
		}

		if (isMenuItemDisabled(currentItems[selected])) {
			selected = findFirstEnabledIndex();
		}
	});

	$effect(() => {
		if (activeDropdownIndex === null) {
			return;
		}

		const item = currentItems[activeDropdownIndex];
		if (!item || (!isMenuDropdown(item) && !isMenuInputDropdown(item) && !isMenuRangeDropdown(item))) {
			closeDropdown();
			return;
		}

		if (isMenuDropdown(item) && activeDropdownSelectedIndex >= item.dropdown.length) {
			activeDropdownSelectedIndex = Math.max(0, item.dropdown.length - 1);
		}
	});

	function isMenuItemDisabled(item: (typeof currentItems)[number] | undefined): boolean {
		if (!item || isMenuSubtree(item)) {
			return false;
		}

		return item.labelKey === 'menu.main.start' && !isStartGameAvailable;
	}

	function isMenuItemDisabledAt(index: number): boolean {
		return isMenuItemDisabled(currentItems[index]);
	}

	function noopMenuAction() {}

	async function launchGame() {
		if (isGameLaunchPending || isEmbeddedGameActive) {
			return;
		}

		isGameLaunchPending = true;

		try {
			const result = await platformApi.invoke(PLATFORM_COMMANDS.LAUNCH_GAME, undefined);

			if (result.mode === 'embedded') {
				isEmbeddedGameActive = true;
			}
		} finally {
			isGameLaunchPending = false;
		}
	}

	function findFirstEnabledIndex(): number {
		const nextIndex = currentItems.findIndex((item) => !isMenuItemDisabled(item));
		return nextIndex === -1 ? 0 : nextIndex;
	}

	function findNextEnabledIndex(startIndex: number, direction: -1 | 1): number {
		if (currentItems.length === 0) {
			return 0;
		}

		for (let offset = 1; offset <= currentItems.length; offset += 1) {
			const nextIndex = (startIndex + direction * offset + currentItems.length) % currentItems.length;

			if (!isMenuItemDisabledAt(nextIndex)) {
				return nextIndex;
			}
		}

		return startIndex;
	}

	function findActiveDropdownOptionIndex(index: number): number {
		const item = currentItems[index];
		if (!item || !isMenuDropdown(item)) {
			return 0;
		}

		const activeOptionIndex = item.dropdown.findIndex((option) => option.valueKey === 'menu.state.active');
		return activeOptionIndex === -1 ? 0 : activeOptionIndex;
	}

	function openDropdown(index = selected): boolean {
		const item = currentItems[index];
		if (!item) {
			return false;
		}

		if (isMenuDropdown(item) && item.dropdown.length > 0) {
			activeDropdownIndex = index;
			activeDropdownSelectedIndex = findActiveDropdownOptionIndex(index);
			return true;
		}

		if (isMenuInputDropdown(item)) {
			trophyKeyInputValue = generalSettings.releaseTrophyKey;
			activeDropdownIndex = index;
			activeDropdownSelectedIndex = 0;
			selectedVirtualKeyboardRow = 1;
			selectedVirtualKeyboardColumn = 0;
			return true;
		}

		if (isMenuRangeDropdown(item)) {
			activeDropdownIndex = index;
			activeDropdownSelectedIndex = 0;
			return true;
		}

		return false;
	}

	function closeDropdown() {
		activeDropdownIndex = null;
		activeDropdownSelectedIndex = 0;
	}

	function setDropdownSelectedIndex(nextIndex: number) {
		if (activeDropdownOptions.length === 0) {
			activeDropdownSelectedIndex = 0;
			return;
		}

		const normalizedIndex = (nextIndex + activeDropdownOptions.length) % activeDropdownOptions.length;
		if (normalizedIndex === activeDropdownSelectedIndex) {
			return;
		}

		activeDropdownSelectedIndex = normalizedIndex;
		playSelectSound();
	}

	function moveDropdown(direction: -1 | 1) {
		setDropdownSelectedIndex(activeDropdownSelectedIndex + direction);
	}

	function clampRangeValue(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	function moveRangeDropdown(direction: -1 | 1) {
		if (!activeRangeDropdown) {
			return;
		}

		const nextValue = clampRangeValue(
			activeRangeDropdown.value + activeRangeDropdown.step * direction,
			activeRangeDropdown.min,
			activeRangeDropdown.max
		);

		if (nextValue === activeRangeDropdown.value) {
			return;
		}

		playSelectSound();
		activeRangeDropdown.onChange(nextValue);
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
		setVirtualKeyboardSelection(selectedVirtualKeyboardRow + rowDelta, selectedVirtualKeyboardColumn + columnDelta);
	}

	function moveUp() {
		if (isLauncherInfoModalOpen) {
			return;
		}

		if (isShaderCacheConfirmOpen) {
			shaderCacheConfirmDialog?.moveUp();
			return;
		}

		if (isPatchModalOpen) {
			patchModal?.moveUp();
			return;
		}

		if (isShadps4ModalOpen) {
			shadps4Modal?.moveUp();
			return;
		}

		if (activeInputDropdown) {
			moveVirtualKeyboardSelection(-1, 0);
			return;
		}

		if (activeRangeDropdown) {
			return;
		}

		if (activeDropdownIndex !== null) {
			moveDropdown(-1);
			return;
		}

		if (currentItems.length === 0) return;
		setSelectedIndex(findNextEnabledIndex(selected, -1));
	}

	function moveDown() {
		if (isLauncherInfoModalOpen) {
			return;
		}

		if (isShaderCacheConfirmOpen) {
			shaderCacheConfirmDialog?.moveDown();
			return;
		}

		if (isPatchModalOpen) {
			patchModal?.moveDown();
			return;
		}

		if (isShadps4ModalOpen) {
			shadps4Modal?.moveDown();
			return;
		}

		if (activeInputDropdown) {
			moveVirtualKeyboardSelection(1, 0);
			return;
		}

		if (activeRangeDropdown) {
			return;
		}

		if (activeDropdownIndex !== null) {
			moveDropdown(1);
			return;
		}

		if (currentItems.length === 0) return;
		setSelectedIndex(findNextEnabledIndex(selected, 1));
	}

	function moveLeft() {
		if (isLauncherInfoModalOpen) {
			return;
		}

		if (isShaderCacheConfirmOpen) {
			shaderCacheConfirmDialog?.moveLeft();
			return;
		}

		if (isPatchModalOpen) {
			patchModal?.moveLeft();
			return;
		}

		if (isShadps4ModalOpen) {
			shadps4Modal?.moveLeft();
			return;
		}

		if (activeInputDropdown) {
			moveVirtualKeyboardSelection(0, -1);
			return;
		}

		if (activeRangeDropdown) {
			moveRangeDropdown(-1);
			return;
		}

		if (activeDropdownIndex !== null) {
			moveDropdown(-1);
		}
	}

	function moveRight() {
		if (isLauncherInfoModalOpen) {
			return;
		}

		if (isShaderCacheConfirmOpen) {
			shaderCacheConfirmDialog?.moveRight();
			return;
		}

		if (isPatchModalOpen) {
			patchModal?.moveRight();
			return;
		}

		if (isShadps4ModalOpen) {
			shadps4Modal?.moveRight();
			return;
		}

		if (activeInputDropdown) {
			moveVirtualKeyboardSelection(0, 1);
			return;
		}

		if (activeRangeDropdown) {
			moveRangeDropdown(1);
			return;
		}

		if (activeDropdownIndex !== null) {
			moveDropdown(1);
		}
	}

	function closeMenuLevel() {
		closeDropdown();

		if (menuPath.length === 0) {
			return;
		}

		menuPath = menuPath.slice(0, -1);
		selected = 0;
	}

	function selectGraphicsPreset(presetId: Exclude<GraphicsPresetSelection, 'custom'>) {
		updateGraphicsSettings((nextGraphicsSettings) => {
			nextGraphicsSettings.presetId = presetId;
		});
	}

	function applyCustomGraphicsSetting(update: (state: Shadps4GraphicsSettings) => void) {
		updateGraphicsSettings(update, { forceCustomPreset: true });
	}

	function applyIndependentGraphicsSetting(update: (state: Shadps4GraphicsSettings) => void) {
		updateGraphicsSettings(update);
	}

	function updateGraphicsSettings(
		update: (state: Shadps4GraphicsSettings) => void,
		options: {
			forceCustomPreset?: boolean;
		} = {}
	) {
		const nextGraphicsSettings = $state.snapshot(graphicsMenuState);
		update(nextGraphicsSettings);

		if (options.forceCustomPreset) {
			nextGraphicsSettings.presetId = 'custom';
		}

		applyGraphicsSettings(nextGraphicsSettings);
	}

	function openPatchModal() {
		isPatchModalOpen = true;
	}

	function closePatchModal() {
		isPatchModalOpen = false;
	}

	function openLauncherInfoModal() {
		playEnterSound();
		isLauncherInfoModalOpen = true;
		void refreshLauncherBootstrapState();
	}

	function closeLauncherInfoModal() {
		playEnterSound();
		isLauncherInfoModalOpen = false;
	}

	function openShadps4Modal() {
		isShadps4ModalOpen = true;
	}

	function closeShadps4Modal() {
		isShadps4ModalOpen = false;
	}

	function requestShaderCacheDelete() {
		closeDropdown();
		isShaderCacheConfirmOpen = true;
	}

	function closeShaderCacheConfirmDialog() {
		isShaderCacheConfirmOpen = false;
	}

	function confirmShaderCacheDelete() {
		closeShaderCacheConfirmDialog();
		void deleteShaderCache();
	}

	async function updateShadps4() {
		if (!platformApi.isAvailable) {
			return;
		}

		launcherBootstrapState = await platformApi.invoke(PLATFORM_COMMANDS.UPDATE_SHADPS4, undefined);
	}

	async function refreshLauncherBootstrapState() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			launcherBootstrapState = await platformApi.invoke(PLATFORM_COMMANDS.GET_LAUNCHER_BOOTSTRAP_STATE, undefined);
		} catch (error) {
			console.warn('Launcher bootstrap state could not be refreshed.', error);
		}
	}

	async function loadGeneralSettings() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			generalSettings = await platformApi.invoke(PLATFORM_COMMANDS.GET_SHADPS4_GENERAL_SETTINGS, undefined);
			trophyKeyInputValue = generalSettings.releaseTrophyKey;
		} catch (error) {
			console.warn('General settings could not be loaded.', error);
		}
	}

	async function loadGraphicsSettings() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			graphicsMenuState = await platformApi.invoke(PLATFORM_COMMANDS.GET_SHADPS4_GRAPHICS_SETTINGS, undefined);
		} catch (error) {
			console.warn('Graphics settings could not be loaded.', error);
		}
	}

	function applyGraphicsSettings(nextSettings: Shadps4GraphicsSettings) {
		graphicsMenuState = nextSettings;

		if (!platformApi.isAvailable) {
			return;
		}

		void platformApi.invoke(PLATFORM_COMMANDS.SAVE_SHADPS4_GRAPHICS_SETTINGS, nextSettings).then(
			(writtenSettings) => {
				graphicsMenuState = writtenSettings;
			},
			(error) => {
				console.warn('Graphics settings could not be saved.', error);
			}
		);
	}

	function applyGeneralSettings(update: Partial<typeof generalSettings>) {
		const nextSettings = {
			...generalSettings,
			...update
		};

		generalSettings = nextSettings;
		if (menuPath.length > 2) {
			closeMenuLevel();
		}

		if (!platformApi.isAvailable) {
			return;
		}

		void platformApi.invoke(PLATFORM_COMMANDS.SAVE_SHADPS4_GENERAL_SETTINGS, nextSettings).then(
			(writtenSettings) => {
				generalSettings = writtenSettings;
			},
			(error) => {
				console.warn('General settings could not be saved.', error);
			}
		);
	}

	function setTrophyKeyInputValue(value: string) {
		trophyKeyInputValue = value;
	}

	function submitTrophyKey() {
		const nextTrophyKey = trophyKeyInputValue.trim();
		trophyKeyInputValue = nextTrophyKey;
		applyGeneralSettings({ releaseTrophyKey: nextTrophyKey });
		closeDropdown();
	}

	async function pasteClipboardIntoTrophyKey() {
		if (!platformApi.isAvailable) {
			return;
		}

		try {
			const clipboardText = await platformApi.invoke(PLATFORM_COMMANDS.READ_CLIPBOARD_TEXT, undefined);
			const safeClipboardText = clipboardText.trim().slice(0, 4096);
			if (!safeClipboardText) {
				return;
			}

			setTrophyKeyInputValue(`${trophyKeyInputValue}${safeClipboardText}`);
		} catch (error) {
			console.warn('Clipboard text could not be pasted.', error);
		}
	}

	function scheduleShaderCacheDeleteStatusReset() {
		if (shaderCacheDeleteResetTimer) {
			window.clearTimeout(shaderCacheDeleteResetTimer);
		}

		shaderCacheDeleteResetTimer = window.setTimeout(() => {
			shaderCacheDeleteProgress = null;
			shaderCacheDeleteStatusKey = null;
			shaderCacheDeleteResetTimer = undefined;
		}, 1800);
	}

	async function deleteShaderCache() {
		if (shaderCacheDeleteResetTimer) {
			window.clearTimeout(shaderCacheDeleteResetTimer);
			shaderCacheDeleteResetTimer = undefined;
		}

		shaderCacheDeleteProgress = 8;
		shaderCacheDeleteStatusKey = 'generalSettings.status.deletingCache';

		if (!platformApi.isAvailable) {
			shaderCacheDeleteProgress = 100;
			shaderCacheDeleteStatusKey = 'generalSettings.status.failed';
			scheduleShaderCacheDeleteStatusReset();
			return;
		}

		const progressTimer = window.setInterval(() => {
			if (shaderCacheDeleteProgress === null || shaderCacheDeleteProgress >= 88) {
				return;
			}

			shaderCacheDeleteProgress = Math.min(88, shaderCacheDeleteProgress + 14);
		}, 120);

		try {
			await platformApi.invoke(PLATFORM_COMMANDS.DELETE_SHADPS4_SHADER_CACHE, undefined);
			shaderCacheDeleteProgress = 100;
			shaderCacheDeleteStatusKey = 'generalSettings.status.deletedCache';
		} catch (error) {
			console.warn('Shader cache could not be deleted.', error);
			shaderCacheDeleteProgress = 100;
			shaderCacheDeleteStatusKey = 'generalSettings.status.failed';
		} finally {
			window.clearInterval(progressTimer);
			scheduleShaderCacheDeleteStatusReset();
		}
	}

	function isTextInputEventTarget(target: EventTarget | null): boolean {
		return (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			(target instanceof HTMLElement && target.isContentEditable)
		);
	}

	function playMenuSound(audio: HTMLAudioElement | undefined) {
		if (!audio) {
			return;
		}

		audio.pause();
		audio.currentTime = 0;

		void audio.play().catch(() => {
			// Ignore autoplay or interruption errors; the next interaction will retry.
		});
	}

	function playSelectSound() {
		const now = performance.now();
		if (now - lastSelectSoundAt < SELECT_SOUND_COOLDOWN_MS) {
			return;
		}

		lastSelectSoundAt = now;
		playMenuSound(selectAudio);
	}

	function playEnterSound() {
		playMenuSound(enterAudio);
	}

	function setSelectedIndex(nextIndex: number) {
		if (nextIndex === selected) {
			return;
		}

		selected = nextIndex;
		playSelectSound();
	}

	function handleHoverSelect(index: number) {
		if (isMenuItemDisabledAt(index)) {
			return;
		}

		if (activeDropdownIndex !== null) {
			return;
		}

		setKeyboardInputMode(gamepad);
		setSelectedIndex(index);
	}

	function handleDropdownPointerEnter(menuIndex: number) {
		if (activeDropdownIndex === null) return;
	}

	function isIgnorableMenuActionError(error: unknown): boolean {
		return error instanceof Error && error.message.toLowerCase().includes('object has been destroyed');
	}

	function runMenuAction(action: () => void | Promise<void>) {
		try {
			const result = action();
			if (result instanceof Promise) {
				void result.catch((error) => {
					if (isIgnorableMenuActionError(error)) {
						return;
					}

					console.warn('Menu action failed.', error);
				});
			}
		} catch (error) {
			if (isIgnorableMenuActionError(error)) {
				return;
			}

			console.warn('Menu action failed.', error);
		}
	}

	function handleDropdownHover(index: number) {
		setKeyboardInputMode(gamepad);
		setDropdownSelectedIndex(index);
	}

	function activateDropdownOption(optionIndex = activeDropdownSelectedIndex) {
		if (activeDropdownIndex === null) {
			return;
		}

		const option = activeDropdownOptions[optionIndex];
		if (!option) {
			return;
		}

		playEnterSound();
		closeDropdown();
		runMenuAction(option.action);
	}

	function pressVirtualKeyboardKey(key: VirtualKeyboardKey) {
		if (!activeInputDropdown) {
			return;
		}

		playEnterSound();

		switch (key.action) {
			case 'character':
				activeInputDropdown.onInput(`${activeInputDropdown.value}${key.value ?? ''}`);
				break;
			case 'space':
				activeInputDropdown.onInput(`${activeInputDropdown.value} `);
				break;
			case 'backspace':
				activeInputDropdown.onInput(activeInputDropdown.value.slice(0, -1));
				break;
			case 'clear':
				activeInputDropdown.onInput('');
				break;
			case 'paste':
				void pasteClipboardIntoTrophyKey();
				break;
			case 'done':
				activeInputDropdown.onSubmit();
				closeDropdown();
				break;
		}
	}

	function pressSelectedVirtualKeyboardKey() {
		const key = getVirtualKeyboardRow()[selectedVirtualKeyboardColumn];
		if (!key) {
			return;
		}

		pressVirtualKeyboardKey(key);
	}

	function enterSelected(targetIndex = selected) {
		if (isLauncherInfoModalOpen) {
			closeLauncherInfoModal();
			return;
		}

		if (isShaderCacheConfirmOpen) {
			shaderCacheConfirmDialog?.enterSelected();
			return;
		}

		if (isPatchModalOpen) {
			patchModal?.enterSelected();
			return;
		}

		if (isShadps4ModalOpen) {
			shadps4Modal?.enterSelected();
			return;
		}

		if (activeInputDropdown) {
			pressSelectedVirtualKeyboardKey();
			return;
		}

		if (activeRangeDropdown) {
			playEnterSound();
			closeDropdown();
			return;
		}

		if (activeDropdownIndex !== null) {
			activateDropdownOption();
			return;
		}

		const item = currentItems[targetIndex];
		if (!item || isMenuItemDisabled(item)) return;

		playEnterSound();

		if (isMenuDropdown(item) || isMenuInputDropdown(item) || isMenuRangeDropdown(item)) {
			openDropdown(targetIndex);
			return;
		}

		if (isMenuSubtree(item)) {
			closeDropdown();
			menuPath = [...menuPath, targetIndex];
			selected = 0;
			return;
		}

		runMenuAction(item.action);
	}

	function goBack() {
		if (isLauncherInfoModalOpen) {
			closeLauncherInfoModal();
			return;
		}

		if (isShaderCacheConfirmOpen) {
			shaderCacheConfirmDialog?.goBack();
			return;
		}

		if (isPatchModalOpen) {
			patchModal?.goBack();
			return;
		}

		if (isShadps4ModalOpen) {
			shadps4Modal?.goBack();
			return;
		}

		if (activeDropdownIndex !== null) {
			playEnterSound();
			closeDropdown();
			return;
		}

		if (menuPath.length === 0) return;
		playEnterSound();
		menuPath = menuPath.slice(0, -1);
		selected = 0;
	}

	function onKeydown(e: KeyboardEvent) {
		setKeyboardInputMode(gamepad);

		const isTypingInTextInput = isTextInputEventTarget(e.target);
		const menuNavigationKeys = activeRangeDropdown
			? ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape']
			: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'];

		if (activeInputDropdown && isTypingInTextInput && e.key === 'Enter') {
			e.preventDefault();
			submitTrophyKey();
			return;
		}

		if (isTypingInTextInput && !menuNavigationKeys.includes(e.key)) {
			return;
		}

		if (e.key.toLowerCase() === 'i' && isLauncherInfoPromptVisible) {
			e.preventDefault();
			openLauncherInfoModal();
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			moveUp();
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			moveDown();
		}

		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			moveLeft();
		}

		if (e.key === 'ArrowRight') {
			e.preventDefault();
			moveRight();
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			enterSelected();
		}

		if (e.key === 'Escape' || e.key === 'Backspace') {
			e.preventDefault();
			goBack();
		}
	}

	function onMouseMove(e: MouseEvent) {
		setKeyboardInputMode(gamepad);
	}

	function onMouseUp(e: MouseEvent) {
		setKeyboardInputMode(gamepad);

		if (e.button === 2) {
			e.preventDefault();
			goBack();
		}
	}

	function startIntroFade() {
		if (!isIntroOverlayVisible || isIntroOverlayFading) {
			return;
		}

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			isIntroOverlayVisible = false;
			return;
		}

		requestAnimationFrame(() => {
			isIntroOverlayFading = true;
			window.setTimeout(() => {
				isIntroOverlayVisible = false;
			}, 460);
		});
	}

	function revealSceneWhenVisible() {
		const startedAt = performance.now();

		const tryStart = () => {
			if (!isIntroOverlayVisible) {
				return;
			}

			if (document.visibilityState === 'visible' || document.hasFocus() || performance.now() - startedAt > 1200) {
				startIntroFade();
				return;
			}

			window.setTimeout(tryStart, 16);
		};

		tryStart();
	}

	function handleSmokeLayerReady() {
		if (hasSmokeLayerReady) {
			return;
		}

		hasSmokeLayerReady = true;
		resolveSmokeLayerReady();
	}

	async function notifyRendererSceneReady() {
		if (hasReportedRendererSceneReady || !platformApi.isAvailable) {
			return;
		}

		hasReportedRendererSceneReady = true;

		try {
			await platformApi.invoke(PLATFORM_COMMANDS.RENDERER_SCENE_READY, undefined);
		} catch (error) {
			console.warn('Renderer ready signal could not be delivered.', error);
		}
	}

	onMount(() => {
		const localeReady = (async () => {
			if (!platformApi.isAvailable) {
				return;
			}

			try {
				const bootstrapState = await platformApi.invoke(PLATFORM_COMMANDS.GET_LAUNCHER_BOOTSTRAP_STATE, undefined);
				launcherBootstrapState = bootstrapState;
				setLocale(bootstrapState.config.locale);
				await Promise.all([loadGeneralSettings(), loadGraphicsSettings()]);
			} catch (error) {
				console.warn('Launcher config could not be loaded for locale sync.', error);
			}
		})();

		updateInputPrompts(gamepad);

		if (gamepad.isXboxControllerConnected || gamepad.isDualSenseControllerConnected) {
			setDetectedControllerInputMode(gamepad);
		}

		const controllerTick = createControllerTick(gamepad, {
			moveLeft,
			moveRight,
			moveUp,
			moveDown,
			enterSelected: () => enterSelected(),
			goBack,
			deleteText: () => {
				if (isShaderCacheConfirmOpen) {
					shaderCacheConfirmDialog?.goBack();
					return;
				}

				if (activeInputDropdown) {
					activeInputDropdown.onInput(activeInputDropdown.value.slice(0, -1));
					return;
				}

				if (isPatchModalOpen) {
					patchModal?.deleteText();
				}
			},
			confirmText: () => {
				if (isLauncherInfoModalOpen) {
					closeLauncherInfoModal();
					return;
				}

				if (isShaderCacheConfirmOpen) {
					shaderCacheConfirmDialog?.enterSelected();
					return;
				}

				if (activeInputDropdown) {
					void pasteClipboardIntoTrophyKey();
					return;
				}

				if (isPatchModalOpen) {
					patchModal?.confirmText();
					return;
				}

				if (isShadps4ModalOpen) {
					shadps4Modal?.confirmText();
					return;
				}

				if (isLauncherInfoPromptVisible) {
					openLauncherInfoModal();
				}
			},
			insertSpace: () => {
				if (activeInputDropdown) {
					playEnterSound();
					activeInputDropdown.onInput(`${activeInputDropdown.value} `);
					return;
				}

				if (isPatchModalOpen) {
					patchModal?.insertSpace();
				}
			},
			clearText: () => {
				if (activeInputDropdown) {
					playEnterSound();
					activeInputDropdown.onInput('');
					return;
				}

				if (isPatchModalOpen) {
					patchModal?.clearText();
				}
			},
			toggleOverlay: () => {
				if (!isEmbeddedGameActive) {
					return;
				}

				playEnterSound();
				void platformApi.invoke(PLATFORM_COMMANDS.SET_GAME_OVERLAY_OPEN, { open: true });
			}
		});
		const handleControllerChange = createControllerChangeHandler(gamepad);

		gamepad.controllerLoop = requestAnimationFrame(controllerTick);

		window.addEventListener('gamepadconnected', handleControllerChange);
		window.addEventListener('gamepaddisconnected', handleControllerChange);

		const unsubscribeGameEvents = window.electronAPI?.onGameEvent((event) => {
			if (event.type === 'session-ended') {
				isEmbeddedGameActive = false;
			}
		});

		void Promise.all([smokeLayerReady, localeReady]).then(async () => {
			if (!platformApi.isAvailable) {
				revealSceneWhenVisible();
				return;
			}

			await notifyRendererSceneReady();
			revealSceneWhenVisible();
		});

		return () => {
			cancelAnimationFrame(gamepad.controllerLoop);
			window.removeEventListener('gamepadconnected', handleControllerChange);
			window.removeEventListener('gamepaddisconnected', handleControllerChange);
			unsubscribeGameEvents?.();
		};
	});
</script>

<svelte:head>
	<title>{app.appShortTitle}</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div
	class:controller-mode={isControllerInputActive}
	class:bg-black={!isEmbeddedGameActive}
	class:bg-transparent={isEmbeddedGameActive}
	class="screen relative flex h-screen w-screen items-center justify-center overflow-hidden select-none"
>
	<audio bind:this={selectAudio} preload="auto" src={asset('/sounds/select.mp3')}></audio>
	<audio bind:this={enterAudio} preload="auto" src={asset('/sounds/enter.mp3')}></audio>

	<div class:hidden={isEmbeddedGameActive} class="absolute inset-0">
		<div class="bg-layer absolute inset-0 z-[0]">
			<img class="bg-image" src={asset('/astral-clock-tower.jpg')} alt="Background" draggable="false" />
		</div>

		<div class="side-bars pointer-events-none absolute inset-0 z-[1]"></div>

		<div class="smoke-layer pointer-events-none absolute inset-0 z-[2]">
			<SmokeLayer onReady={handleSmokeLayerReady} />
		</div>

		<div class="hunter-layer pointer-events-none absolute inset-0 z-[3]">
			<img class="hunter-image" src={asset('/maria.png')} alt="Hunter" draggable="false" />
		</div>

		<div class="overlay pointer-events-none absolute inset-0 z-[4]"></div>
		<div class="vignette pointer-events-none absolute inset-0 z-[5]"></div>

		<div class="grain-layer pointer-events-none absolute inset-0 z-[6]"></div>

		<div class="content-frame relative z-[7] h-full w-full">
			<div class="logo-layer pointer-events-none absolute inset-0">
				<img class="bb-logo" src={asset('/bb-logo.png')} alt="Bloodborne logo" draggable="false" />
			</div>

			{#if menuPath.length === 0 || isLauncherInfoModalOpen}
				<LauncherInfoBox
					bootstrapState={launcherBootstrapState}
					isOpen={isLauncherInfoModalOpen}
					onClose={() => {
						isLauncherInfoModalOpen = false;
					}}
					{playEnterSound}
				/>
			{/if}

			<div class="relative z-[12] flex h-full w-full items-center justify-center px-4">
				<div class="flex w-full items-center justify-center">
					<AppMenu
						menuPathDepth={menuPath.length}
						{currentMenu}
						items={currentItems}
						{selected}
						{activeDropdownIndex}
						{activeDropdownSelectedIndex}
						inputMode={gamepad.inputMode}
						{selectedVirtualKeyboardRow}
						{selectedVirtualKeyboardColumn}
						isDisabled={(item) => isMenuItemDisabled(item)}
						onHoverSelect={handleHoverSelect}
						onActivate={enterSelected}
						onDropdownHover={handleDropdownHover}
						onDropdownActivate={activateDropdownOption}
						onDropdownPointerEnter={handleDropdownPointerEnter}
						onVirtualKeyboardHover={(row, column) => setVirtualKeyboardSelection(row, column)}
						onVirtualKeyboardKeyPress={pressVirtualKeyboardKey}
					/>
				</div>
			</div>

			{#if selectedMenuDescriptionKey}
				<div class="pointer-events-none absolute inset-x-0 bottom-24 z-[11] flex justify-center px-4">
					<div
						class="w-[min(88vw,520px)] rounded-[22px] border border-[#c8b27a]/12 bg-[linear-gradient(180deg,rgba(16,11,8,0.74),rgba(8,6,5,0.58))] px-5 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-[6px]"
					>
						{#if selectedMenuDescriptionTitleKey}
							<div class="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#ccb57a]/78">
								{$t(selectedMenuDescriptionTitleKey)}
							</div>
						{/if}

						<p class="whitespace-pre-line text-[0.84rem] leading-[1.72] text-white/70">
							{$t(selectedMenuDescriptionKey)}
						</p>
					</div>
				</div>
			{/if}

			{#if isPatchModalOpen}
				<PatchModal
					bind:this={patchModal}
					inputMode={gamepad.inputMode}
					isXboxControllerConnected={gamepad.isXboxControllerConnected}
					isDualSenseControllerConnected={gamepad.isDualSenseControllerConnected}
					onClose={closePatchModal}
					onKeyboardInput={() => setKeyboardInputMode(gamepad)}
					{playSelectSound}
					{playEnterSound}
				/>
			{/if}

			{#if isShadps4ModalOpen}
				<Shadps4Modal
					bind:this={shadps4Modal}
					inputMode={gamepad.inputMode}
					isXboxControllerConnected={gamepad.isXboxControllerConnected}
					isDualSenseControllerConnected={gamepad.isDualSenseControllerConnected}
					shadps4={launcherBootstrapState?.emulator.shadps4 ?? null}
					onClose={closeShadps4Modal}
					onUpdate={updateShadps4}
					{playEnterSound}
				/>
			{/if}

			{#if isShaderCacheConfirmOpen}
				<ConfirmDialog
					bind:this={shaderCacheConfirmDialog}
					titleKey="generalSettings.shaderCache.confirmTitle"
					messageKey="generalSettings.shaderCache.confirmMessage"
					inputMode={gamepad.inputMode}
					isXboxControllerConnected={gamepad.isXboxControllerConnected}
					isDualSenseControllerConnected={gamepad.isDualSenseControllerConnected}
					onConfirm={confirmShaderCacheDelete}
					onCancel={closeShaderCacheConfirmDialog}
					{playSelectSound}
					{playEnterSound}
				/>
			{/if}

			<InputPrompts
				class="absolute bottom-6 left-8 z-20"
				inputMode={gamepad.inputMode}
				isXboxControllerConnected={gamepad.isXboxControllerConnected}
				isDualSenseControllerConnected={gamepad.isDualSenseControllerConnected}
				showInfo={isLauncherInfoPromptVisible}
			/>

			<div
				class="absolute bottom-5 right-7 z-20 flex flex-col items-end gap-[2px] text-[0.72rem] tracking-[0.08em] text-white/40 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-sm:bottom-4 max-sm:right-4 max-sm:text-[0.64rem]"
			>
				<div>
					<a
						class="text-blue-400 drop-shadow-[0_0_8px_rgba(0, 143, 255, 0.6)]"
						target="_blank"
						rel="noopener noreferrer"
						href={app.github}
					>
						{app.appShortTitle}
					</a>
				</div>
				<div>{$t('app.version', { version: app.appVer })}</div>
				<div>{app.buildTitle}</div>
			</div>
		</div>
	</div>

	{#if isGameLaunchPending}
		<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/62 backdrop-blur-[2px]">
			<div
				class="rounded-[28px] border border-[#f2e4b6]/18 bg-[radial-gradient(circle_at_50%_0%,rgba(242,228,182,0.13),transparent_48%),rgba(6,6,5,0.86)] px-10 py-9 shadow-[0_26px_80px_rgba(0,0,0,0.54)]"
			>
				<AppLoading statusKey="splash.launchingGame" compact />
			</div>
		</div>
	{/if}

	{#if isIntroOverlayVisible}
		<div
			class:intro-overlay-fading={isIntroOverlayFading}
			class="intro-overlay pointer-events-none absolute inset-0 z-30 bg-black"
		></div>
	{/if}
</div>
