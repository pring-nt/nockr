<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { SlidersHorizontal, Download, Upload, Target } from 'lucide-svelte';
	import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
	import ThemePicker from '$lib/components/settings/ThemePicker.svelte';
	import { appStore } from '$lib/stores/appState';

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

<Tooltip.Provider>
	<header
		class="sticky top-0 z-30 flex w-full items-center justify-between border-b border-border/40 bg-background/50 px-4 py-3.5 backdrop-blur-md sm:px-6"
	>
		<!-- Nockr Brand & Mode Tag -->
		<div class="flex items-center gap-2.5">
			<div class="rounded-lg border border-primary/20 bg-primary/10 p-1.5 text-primary">
				<Target size={18} />
			</div>
			<div class="flex items-center gap-2">
				<span class="gradient-text text-lg leading-none font-semibold tracking-tight">Nockr</span>
				<span
					class="rounded-md border border-border/40 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
				>
					{$appStore.universitySettings.mode}
				</span>
			</div>
		</div>

		<!-- Quick Action Controls -->
		<div class="flex items-center gap-1 sm:gap-1.5">
			<ThemePicker />

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
			<input
				bind:this={fileInput}
				type="file"
				accept=".json"
				class="hidden"
				onchange={importState}
			/>
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

			<div class="mx-1 h-4 w-px bg-border/60"></div>

			<!-- Settings Drawer Trigger -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="sm"
							onclick={() => (settingsOpen = true)}
							class="h-8 gap-1.5 border-border/60 bg-background/50 text-xs transition-all duration-200 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring"
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
</Tooltip.Provider>

<SettingsSidebar bind:open={settingsOpen} />
