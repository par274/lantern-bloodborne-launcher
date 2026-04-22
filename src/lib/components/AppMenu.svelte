<script module lang="ts">
	import { PLATFORM_COMMANDS } from '$lib/contracts/commands';
	import type { TranslationKey } from '$lib/translations/translations';

	import { platformApi } from '$platform/renderer/api';

	type MenuLabelKey = Extract<TranslationKey, `menu.${string}`>;
	type MenuAction = () => void | Promise<void>;
	const noopMenuAction: MenuAction = () => {};

	type MenuNodeBase = {
		labelKey?: MenuLabelKey | null;
		labelText?: string | null;
		descriptionKey?: TranslationKey | null;
		valueKey?: TranslationKey | null;
		valueText?: string | null;
		progress?: MenuProgress | null;
	};

	export type MenuProgress = {
		value: number;
		labelKey?: TranslationKey | null;
		labelText?: string | null;
	};

	export type MenuDropdownOption = {
		labelKey?: MenuLabelKey | null;
		labelText?: string | null;
		valueKey?: TranslationKey | null;
		valueText?: string | null;
		action: MenuAction;
	};

	export type MenuInputDropdown = {
		value: string;
		placeholderKey?: TranslationKey | null;
		onInput: (value: string) => void | Promise<void>;
		onSubmit: () => void | Promise<void>;
	};

	export type MenuRangeDropdown = {
		value: number;
		min: number;
		max: number;
		step: number;
		unit?: string | null;
		onChange: (value: number) => void | Promise<void>;
	};

	export type MenuNode =
		| (MenuNodeBase & {
				action: MenuAction;
		  })
		| (MenuNodeBase & {
				sub: readonly MenuNode[];
		  })
		| (MenuNodeBase & {
				dropdown: readonly MenuDropdownOption[];
		  })
		| (MenuNodeBase & {
				inputDropdown: MenuInputDropdown;
		  })
		| (MenuNodeBase & {
				rangeDropdown: MenuRangeDropdown;
		  });

	export type MenuBranch = {
		titleKey: MenuLabelKey | null;
		descriptionKey: TranslationKey | null;
		items: readonly MenuNode[];
	};

	type CreateAppMenuTreeOptions = {
		onLaunchGame?: MenuAction;
		onSavedGames?: MenuAction;
		onModManager?: MenuAction;
		onEmulator?: MenuAction;
		onControls?: MenuAction;
		onInterface?: MenuAction;
		onPatches?: MenuAction;
		onExit?: MenuAction;
		generalMenu?: readonly MenuNode[];
		graphicsMenu?: readonly MenuNode[];
		graphicsValueKey?: TranslationKey | null;
		graphicsValueText?: string | null;
	};

	export function createAppMenuTree(options: CreateAppMenuTreeOptions = {}): readonly MenuNode[] {
		return [
			{
				labelKey: 'menu.main.start',
				action: options.onLaunchGame ?? (() => platformApi.invoke(PLATFORM_COMMANDS.LAUNCH_GAME, undefined))
			},
			{
				labelKey: 'menu.main.savedGames',
				action: options.onSavedGames ?? noopMenuAction
			},
			{
				labelKey: 'menu.main.modManager',
				action: options.onModManager ?? noopMenuAction
			},
			{
				labelKey: 'menu.system.title',
				sub: [
					{
						labelKey: 'menu.system.general',
						descriptionKey: 'menu.description.general',
						sub:
							options.generalMenu ??
							([
								{
									labelKey: 'menu.system.general.consoleLanguage',
									action: noopMenuAction
								}
							] as const)
					},
					{
						labelKey: 'menu.system.emulator',
						descriptionKey: 'menu.description.emulator',
						action: options.onEmulator ?? noopMenuAction
					},
					{
						labelKey: 'menu.system.graphics',
						valueKey: options.graphicsValueKey,
						valueText: options.graphicsValueText,
						sub:
							options.graphicsMenu ??
							([
								{
									labelKey: 'menu.system.graphics.presets.quality',
									action: noopMenuAction
								}
							] as const)
					},
					{
						labelKey: 'menu.system.patches',
						descriptionKey: 'menu.description.patches',
						action: options.onPatches ?? noopMenuAction
					},
					{
						labelKey: 'menu.system.controls',
						action: options.onControls ?? noopMenuAction
					},
					{
						labelKey: 'menu.system.interface',
						action: options.onInterface ?? noopMenuAction
					}
				]
			},
			{
				labelKey: 'menu.main.exit',
				action: options.onExit ?? (() => platformApi.invoke(PLATFORM_COMMANDS.APP_EXIT, undefined))
			}
		] as const satisfies readonly MenuNode[];
	}

	export function isMenuSubtree(item: MenuNode): item is Extract<MenuNode, { sub: readonly MenuNode[] }> {
		return 'sub' in item;
	}

	export function isMenuDropdown(item: MenuNode): item is Extract<MenuNode, { dropdown: readonly MenuDropdownOption[] }> {
		return 'dropdown' in item;
	}

	export function isMenuInputDropdown(item: MenuNode): item is Extract<MenuNode, { inputDropdown: MenuInputDropdown }> {
		return 'inputDropdown' in item;
	}

	export function isMenuRangeDropdown(item: MenuNode): item is Extract<MenuNode, { rangeDropdown: MenuRangeDropdown }> {
		return 'rangeDropdown' in item;
	}

	export function resolveMenuBranch(rootItems: readonly MenuNode[], path: readonly number[]): MenuBranch {
		let titleKey: MenuLabelKey | null = null;
		let descriptionKey: TranslationKey | null = null;
		let items = rootItems;

		for (const index of path) {
			const nextItem = items[index];

			if (!nextItem || !isMenuSubtree(nextItem)) {
				break;
			}

			titleKey = nextItem.labelKey ?? null;
			descriptionKey = nextItem.descriptionKey ?? null;
			items = nextItem.sub;
		}

		return { titleKey, descriptionKey, items };
	}
</script>

<script lang="ts">
	import { t } from '$lib/i18n';

	import VirtualKeyboard, { type VirtualKeyboardKey } from '$lib/components/VirtualKeyboard.svelte';
	import type { InputMode } from '$lib/components/gamepad';

	type Props = {
		menuPathDepth: number;
		currentMenu: MenuBranch;
		items: readonly MenuNode[];
		selected: number;
		activeDropdownIndex: number | null;
		activeDropdownSelectedIndex: number;
		inputMode: InputMode;
		selectedVirtualKeyboardRow: number;
		selectedVirtualKeyboardColumn: number;
		isDisabled: (item: MenuNode, index: number) => boolean;
		onHoverSelect: (index: number) => void;
		onActivate: (index: number) => void;
		onDropdownHover: (index: number) => void;
		onDropdownActivate: (index: number) => void;
		onDropdownPointerEnter: (menuIndex: number) => void;
		onVirtualKeyboardHover: (row: number, column: number) => void;
		onVirtualKeyboardKeyPress: (key: VirtualKeyboardKey) => void;
	};

	let {
		menuPathDepth,
		currentMenu,
		items,
		selected,
		activeDropdownIndex,
		activeDropdownSelectedIndex,
		inputMode,
		selectedVirtualKeyboardRow,
		selectedVirtualKeyboardColumn,
		isDisabled,
		onHoverSelect,
		onActivate,
		onDropdownHover,
		onDropdownActivate,
		onDropdownPointerEnter,
		onVirtualKeyboardHover,
		onVirtualKeyboardKeyPress
	}: Props = $props();

	let dropdownElement = $state<HTMLDivElement | undefined>(undefined);
	let dropdownInputElement = $state<HTMLInputElement | undefined>(undefined);

	function clampProgress(value: number): number {
		return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
	}

	$effect(() => {
		if (!dropdownElement || activeDropdownIndex === null) {
			return;
		}

		const selectedOption = dropdownElement.querySelector<HTMLElement>(
			`[data-dropdown-option-index="${activeDropdownSelectedIndex}"]`
		);

		selectedOption?.scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		const activeItem = activeDropdownIndex === null ? null : items[activeDropdownIndex];
		if (!activeItem || !isMenuInputDropdown(activeItem)) {
			return;
		}

		requestAnimationFrame(() => {
			dropdownInputElement?.focus({ preventScroll: true });
		});
	});
</script>

<div class="menu-wrap flex w-[min(88vw,640px)] justify-center">
	<div class="flex w-full flex-col items-center gap-[0.08rem]">
		{#if menuPathDepth > 0 && currentMenu.titleKey}
			<div class="menu-back mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8b27a]/80">
				{$t(currentMenu.titleKey)}
			</div>
		{/if}

		{#each items as item, i}
			{@const itemDisabled = isDisabled(item, i)}
			<div
				class="relative w-full"
				role="presentation"
				onmouseenter={() => onDropdownPointerEnter(i)}
			>
				<button
					class:selected={i === selected}
					class="menu-item relative my-[2px] w-full border-0 bg-transparent px-[1em] py-[0.14em] text-[1.1rem] leading-[1.08] tracking-[0.01em] text-white/95 outline-none transition-all duration-150 ease-in-out sm:px-[1.2em] sm:text-[1.2rem] md:px-[1.35em] md:text-[1.32rem] lg:px-[1.5em] lg:py-[0.16em] lg:text-[1.5rem]"
					class:cursor-pointer={!itemDisabled}
					class:cursor-default={itemDisabled}
					class:opacity-35={itemDisabled}
					disabled={itemDisabled}
					aria-disabled={itemDisabled}
					onmouseenter={() => {
						if (!itemDisabled) {
							onHoverSelect(i);
						}
					}}
					onclick={() => {
						if (!itemDisabled) {
							onActivate(i);
						}
					}}
				>
					<span class="relative z-[2] inline-flex max-w-full items-center justify-center gap-3 px-5">
						<span>{item.labelKey ? $t(item.labelKey) : item.labelText}</span>
					</span>

					{#if item.valueKey || item.valueText || isMenuSubtree(item) || isMenuDropdown(item) || isMenuInputDropdown(item) || isMenuRangeDropdown(item)}
						<span class="pointer-events-none absolute right-2 top-1/2 z-[3] flex -translate-y-1/2 items-center gap-2">
							{#if item.valueKey || item.valueText}
								<span
									class="menu-value rounded-full border border-[#c8b27a]/20 bg-black/35 px-2.5 py-[0.32rem] text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#c9b47d]/78 shadow-[0_2px_14px_rgba(0,0,0,0.35)] transition-all duration-150"
								>
									{#if item.valueKey}
										{$t(item.valueKey)}
									{:else}
										{item.valueText}
									{/if}
								</span>
							{/if}

							{#if isMenuSubtree(item)}
								<span class="menu-arrow text-[0.8rem] text-white/25 transition-all duration-150"> > </span>
							{:else if isMenuDropdown(item) || isMenuInputDropdown(item) || isMenuRangeDropdown(item)}
								<span class="menu-arrow text-[0.8rem] text-white/25 transition-all duration-150">
									{activeDropdownIndex === i ? '^' : 'v'}
								</span>
							{/if}
						</span>
					{/if}
				</button>

				{#if item.progress}
					<div class="menu-progress mx-auto mt-1 w-[min(82%,360px)] rounded-full border border-[#c8b27a]/12 bg-black/24 p-[3px] shadow-[0_8px_18px_rgba(0,0,0,0.22)]">
						<div class="mb-1 flex items-center justify-between px-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#c8b27a]/62">
							<span>{item.progress.labelKey ? $t(item.progress.labelKey) : item.progress.labelText}</span>
							<span>{clampProgress(item.progress.value)}%</span>
						</div>
						<div class="h-[0.28rem] overflow-hidden rounded-full bg-white/7">
							<div
								class="h-full rounded-full bg-[linear-gradient(90deg,rgba(200,178,122,0.38),rgba(255,232,176,0.78))] shadow-[0_0_16px_rgba(200,178,122,0.22)] transition-[width] duration-200 ease-out"
								style={`width: ${clampProgress(item.progress.value)}%`}
							></div>
						</div>
					</div>
				{/if}

				{#if activeDropdownIndex === i && isMenuDropdown(item)}
					<div
						bind:this={dropdownElement}
						class="menu-dropdown patch-list absolute left-1/2 top-[calc(100%+0.04rem)] z-40 flex max-h-[min(34vh,260px)] w-[min(92%,430px)] -translate-x-1/2 flex-col overflow-y-auto rounded-[10px] border-y border-[#c8b27a]/14 bg-[linear-gradient(90deg,transparent,rgba(12,8,6,0.72)_12%,rgba(12,8,6,0.9)_50%,rgba(12,8,6,0.72)_88%,transparent)] py-1 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-[4px]"
					>
						{#each item.dropdown as option, optionIndex}
							<button
								type="button"
								data-dropdown-option-index={optionIndex}
								class:selected={optionIndex === activeDropdownSelectedIndex}
								class="group relative flex items-center justify-center gap-2 px-4 py-1.5 text-center text-[1rem] font-semibold tracking-[0.1em] text-white/52 outline-none transition hover:bg-[#c8b27a]/7 hover:text-[#f4ead0] [&.selected]:bg-[#c8b27a]/10 [&.selected]:text-[#fff0bd]"
								onmouseenter={() => onDropdownHover(optionIndex)}
								onclick={(event) => {
									event.stopPropagation();
									onDropdownActivate(optionIndex);
								}}
							>
								<span>{option.labelKey ? $t(option.labelKey) : option.labelText}</span>
								{#if option.valueKey || option.valueText}
									<span class="absolute right-3 rounded-full border border-[#c8b27a]/12 bg-black/18 px-1.5 py-0.5 text-[0.75rem] tracking-[0.1em] text-[#c9b47d]/66">
										{#if option.valueKey}
											{$t(option.valueKey)}
										{:else}
											{option.valueText}
										{/if}
									</span>
								{/if}
							</button>
						{/each}
					</div>
				{:else if activeDropdownIndex === i && isMenuRangeDropdown(item)}
					<div
						class="menu-dropdown absolute left-1/2 top-[calc(100%+0.04rem)] z-40 w-[min(88%,360px)] -translate-x-1/2 rounded-[14px] border border-[#c8b27a]/14 bg-[linear-gradient(180deg,rgba(16,12,9,0.96),rgba(6,5,4,0.92))] px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.36)] backdrop-blur-[7px]"
					>
						<div class="mb-2 flex items-center justify-between gap-3">
							<span class="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/42">
								{item.labelKey ? $t(item.labelKey) : item.labelText}
							</span>
							<span class="rounded-full border border-[#c8b27a]/18 bg-black/28 px-2.5 py-1 text-[0.78rem] font-semibold tracking-[0.08em] text-[#f4ead0]">
								{item.rangeDropdown.value}{item.rangeDropdown.unit ?? ''}
							</span>
						</div>

						<input
							class="menu-range-input w-full"
							type="range"
							min={item.rangeDropdown.min}
							max={item.rangeDropdown.max}
							step={item.rangeDropdown.step}
							value={item.rangeDropdown.value}
							oninput={(event) => item.rangeDropdown.onChange(Number((event.currentTarget as HTMLInputElement).value))}
						/>

						<div class="mt-1.5 flex justify-between text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-white/26">
							<span>{item.rangeDropdown.min}{item.rangeDropdown.unit ?? ''}</span>
							<span>{Math.round((item.rangeDropdown.min + item.rangeDropdown.max) / 2)}{item.rangeDropdown.unit ?? ''}</span>
							<span>{item.rangeDropdown.max}{item.rangeDropdown.unit ?? ''}</span>
						</div>
					</div>
				{:else if activeDropdownIndex === i && isMenuInputDropdown(item)}
					<div
						class="menu-dropdown absolute left-1/2 top-[calc(100%+0.04rem)] z-40 w-[min(96%,520px)] -translate-x-1/2 rounded-[18px] border border-[#c8b27a]/14 bg-[linear-gradient(180deg,rgba(16,12,9,0.96),rgba(6,5,4,0.92))] p-3 shadow-[0_16px_42px_rgba(0,0,0,0.44)] backdrop-blur-[7px]"
					>
						<input
							bind:this={dropdownInputElement}
							class="w-full rounded-[13px] border border-[#c8b27a]/16 bg-black/24 px-3.5 py-2 text-center text-[0.82rem] font-semibold tracking-[0.04em] text-[#f4ead0] outline-none transition placeholder:text-white/26 focus:border-[#c8b27a]/38"
							type="text"
							value={item.inputDropdown.value}
							placeholder={item.inputDropdown.placeholderKey ? $t(item.inputDropdown.placeholderKey) : ''}
							autocomplete="off"
							spellcheck="false"
							oninput={(event) => item.inputDropdown.onInput((event.currentTarget as HTMLInputElement).value)}
						/>

						<VirtualKeyboard
							class="mt-2"
							{inputMode}
							selectedRow={selectedVirtualKeyboardRow}
							selectedColumn={selectedVirtualKeyboardColumn}
							onHover={onVirtualKeyboardHover}
							onKeyPress={onVirtualKeyboardKeyPress}
						/>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
