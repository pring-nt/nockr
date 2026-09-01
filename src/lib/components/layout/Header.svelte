<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {SlidersHorizontal, Download, Upload, Target, Share2, LayoutDashboard, Calendar} from 'lucide-svelte';
	import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
	import ThemePicker from '$lib/components/settings/ThemePicker.svelte';
	import MobileHeaderMenu from '$lib/components/layout/MobileHeaderMenu.svelte';
	import { appStore } from '$lib/stores/appState';
	import { cn } from '$lib/utils.js';

	let settingsOpen = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	function exportState() {
		const dataStr =
				'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify($appStore, null, 2));
		const downloadAnchor = document.createElement('a');
		downloadAnchor.setAttribute('href', dataStr);
		downloadAnchor.setAttribute(
				'download',
				`nockr-backup-${new Date().toISOString().split('T')[0]}.json`
		);
		document.body.appendChild(downloadAnchor);
		downloadAnchor.click();
		downloadAnchor.remove();
	}

	function importState(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const parsed = JSON.parse(e.target?.result as string);
				appStore.set(parsed);
			} catch {
				alert('Invalid JSON backup file.');
			}
		};
		reader.readAsText(file);
	}
</script>

<header
		class="relative z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/40 bg-background/50 px-3 backdrop-blur-md sm:px-6"
>
	<!-- Brand & Navigation -->
	<div class="flex items-center gap-2.5 sm:gap-6">
		<a href={resolve('/')} class="flex items-center gap-2 no-underline">
			<div class="rounded-lg border border-primary/20 bg-primary/10 p-1.5 text-primary">
				<Target size={18} />
			</div>
			<div class="flex items-center gap-1.5">
				<span class="gradient-text text-base font-semibold tracking-tight sm:text-lg">Nockr</span>
				<span
						class="hidden rounded-md border border-border/40 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase md:inline-flex"
				>
          {$appStore.universitySettings.mode}
        </span>
			</div>
		</a>

		<!-- Navigation Pills -->
		<nav class="flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/30 p-1">
			<a
					href={resolve('/')}
					class={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-2.5',
          page.url.pathname === '/'
            ? 'bg-background text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        )}
			>
				<LayoutDashboard size={13} />
				<span class="hidden sm:inline">Overview</span>
			</a>
			<a
					href={resolve('/plan')}
					class={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-2.5',
          page.url.pathname.startsWith('/plan')
            ? 'bg-background text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        )}
			>
				<Calendar size={13} />
				<span class="hidden sm:inline">Plan</span>
			</a>
		</nav>
	</div>

	<!-- Quick Action Controls -->
	<div class="flex items-center gap-1 sm:gap-1.5">
		<ThemePicker />

		<!-- Desktop Secondary Actions -->
		<div class="hidden items-center gap-1 sm:flex">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
								{...props}
								href={resolve('/export')}
								variant="ghost"
								size="icon"
								aria-label="Export Card"
								class="h-8 w-8 text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
						>
							<Share2 size={16} />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">
					<p>Export academic summary</p>
				</Tooltip.Content>
			</Tooltip.Root>

			<!-- Backup Export -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
								{...props}
								variant="ghost"
								size="icon"
								onclick={exportState}
								aria-label="Export Backup"
								class="h-8 w-8 text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
						>
							<Download size={16} />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">
					<p>Export backup (JSON)</p>
				</Tooltip.Content>
			</Tooltip.Root>

			<!-- Backup Import -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
								{...props}
								variant="ghost"
								size="icon"
								onclick={() => fileInput?.click()}
								aria-label="Import Backup"
								class="h-8 w-8 text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
						>
							<Upload size={16} />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">
					<p>Import backup (JSON)</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>

		<!-- Mobile Overflow Dropdown -->
		<div class="sm:hidden">
			<MobileHeaderMenu
					onExportBackup={exportState}
					onImportBackup={() => fileInput?.click()}
			/>
		</div>

		<!-- Hidden file input for import -->
		<input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={importState} />

		<div class="mx-0.5 h-4 w-px bg-border/60 sm:mx-1"></div>

		<!-- Settings Drawer Trigger -->
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
							{...props}
							variant="outline"
							size="sm"
							onclick={() => (settingsOpen = true)}
							class="h-8 gap-1.5 border-border/60 bg-background/50 px-2 text-xs transition-all duration-200 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring sm:px-3"
					>
						<SlidersHorizontal size={14} />
						<span class="hidden font-medium sm:inline">Settings</span>
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="bottom">
				<p>University Settings</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</div>
</header>

<SettingsSidebar bind:open={settingsOpen} />