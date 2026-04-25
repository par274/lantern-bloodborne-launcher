<script lang="ts">
	import type { LauncherBootstrapState } from '$lib/contracts/launcherConfig';
	import { t } from '$lib/i18n';
	import app from '$platform/app';

	type Props = {
		bootstrapState: LauncherBootstrapState | null;
		isOpen: boolean;
		onClose: () => void;
		playEnterSound: () => void;
	};

	let {
		bootstrapState,
		isOpen,
		onClose,
		playEnterSound
	}: Props = $props();

	let bloodborne = $derived(bootstrapState?.config.games.bloodborne ?? null);
	let title = $derived(bloodborne?.title || 'Bloodborne');
	let titleId = $derived(bloodborne?.titleId ?? bootstrapState?.bloodborne.titleId ?? null);
	let appVersion = $derived(bloodborne?.appVer ?? null);
	let contentId = $derived(bloodborne?.contentId ?? null);
	let installPath = $derived(bloodborne?.installPath ?? bootstrapState?.bloodborne.installPath ?? null);

	function displayValue(value: string | null | undefined): string {
		return value?.trim() || $t('app.info.unavailable');
	}

	function closeInfo() {
		playEnterSound();
		onClose();
	}
</script>

{#if isOpen}
	<div class="bb-modal-overlay fixed inset-0 z-[24] flex items-center justify-center bg-black/38 px-5 py-8 backdrop-blur-[2px]">
		<section
			class="bb-modal-frame relative max-h-[min(86vh,820px)] w-[min(88vw,620px)] overflow-y-auto rounded-[28px] border border-[#d0b875]/16 bg-[radial-gradient(circle_at_18%_0%,rgba(202,181,120,0.13),transparent_42%),linear-gradient(180deg,rgba(18,13,10,0.92),rgba(6,5,4,0.86))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.58)] patch-scrollbar"
			aria-modal="true"
			role="dialog"
		>
			<div class="bb-modal-border pointer-events-none absolute inset-0"></div>

			<div class="relative z-10 flex items-start justify-between gap-5">
				<div class="min-w-0">
					<div class="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-[#ccb57a]/72">
						{$t('app.info.eyebrow')}
					</div>
					<h2 class="mt-2 text-[1.65rem] font-semibold leading-tight text-[#f5ecd5]">
						{$t('app.info.title')}
					</h2>
					<p class="mt-2 max-w-[460px] text-[0.82rem] leading-[1.7] text-white/52">
						{$t('app.info.description')}
					</p>
				</div>

				<button
					type="button"
					class="shrink-0 rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/46 transition hover:border-[#c8b27a]/30 hover:text-[#f1ddb0]"
					onclick={closeInfo}
				>
					{$t('prompt.back')}
				</button>
			</div>

			<div class="relative z-10 mt-6 grid gap-2">
				<div class="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#ccb57a]/62">
					{$t('app.info.launcherSection')}
				</div>

				<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
					<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
						{$t('app.info.nameLabel')}
					</div>
					<div class="mt-1 break-words text-[0.92rem] font-semibold text-[#f4ead0]">{displayValue(app.appShortTitle)}</div>
				</div>

				<div class="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
					<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
						<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
							{$t('app.info.versionLabel')}
						</div>
						<div class="mt-1 break-words text-[0.88rem] font-semibold text-white/76">{displayValue(app.appVer)}</div>
					</div>

					<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
						<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
							{$t('app.info.buildLabel')}
						</div>
						<div class="mt-1 break-words text-[0.88rem] font-semibold text-white/76">{displayValue(app.buildTitle)}</div>
					</div>
				</div>

				<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
					<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
						{$t('app.info.repositoryLabel')}
					</div>
					<a
						class="mt-1 block break-all text-[0.82rem] font-semibold text-white/70 transition hover:text-[#f1ddb0] hover:underline"
						href={app.github}
						target="_blank"
						rel="noopener noreferrer"
					>
						{displayValue(app.github)}
					</a>
				</div>

				<div class="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
					<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
						<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
							{$t('app.info.licenseLabel')}
						</div>
						<div class="mt-1 break-all text-[0.78rem] font-semibold leading-[1.55] text-white/62">
							{displayValue(app.license)}
						</div>
					</div>

					<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
						<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
							{$t('app.info.copyrightLabel')}
						</div>
						<div class="mt-1 break-all text-[0.78rem] font-semibold leading-[1.55] text-white/62">
							{displayValue(app.copyright)}
						</div>
					</div>
				</div>

				<div class="my-3 h-px bg-[linear-gradient(90deg,transparent,rgba(200,178,122,0.28),transparent)]"></div>

				<div class="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#ccb57a]/62">
					{$t('app.info.bloodborneSection')}
				</div>

				<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
					<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
						{$t('bloodborne.meta.titleLabel')}
					</div>
					<div class="mt-1 break-words text-[0.92rem] font-semibold text-[#f4ead0]">{displayValue(title)}</div>
				</div>

				<div class="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
					<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
						<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
							{$t('bloodborne.meta.titleIdLabel')}
						</div>
						<div class="mt-1 break-words text-[0.88rem] font-semibold text-white/76">{displayValue(titleId)}</div>
					</div>

					<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
						<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
							{$t('bloodborne.meta.appVerLabel')}
						</div>
						<div class="mt-1 break-words text-[0.88rem] font-semibold text-white/76">{displayValue(appVersion)}</div>
					</div>
				</div>

				<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
					<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
						{$t('bloodborne.meta.contentIdLabel')}
					</div>
					<div class="mt-1 break-all text-[0.82rem] font-semibold text-white/70">{displayValue(contentId)}</div>
				</div>

				<div class="rounded-[18px] border border-[#c8b27a]/10 bg-black/20 px-4 py-3">
					<div class="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#ccb57a]/58">
						{$t('bloodborne.info.installPathLabel')}
					</div>
					<div class="mt-1 break-all text-[0.78rem] font-semibold leading-[1.55] text-white/62">
						{displayValue(installPath)}
					</div>
				</div>
			</div>
		</section>
	</div>
{/if}
