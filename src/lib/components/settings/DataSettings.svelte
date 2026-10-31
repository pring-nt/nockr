<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Download, FileSpreadsheet, Upload } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import ImportModal from '$lib/components/settings/ImportModal.svelte';
	import { appStore } from '$lib/stores/appState';
	import { themeStore } from '$lib/stores/themeState';
	import { ThemeSettingsSchema } from '$lib/schemas';

	let importModalOpen = $state(false);
	let fileInputEl = $state<HTMLInputElement | null>(null);

	function exportState() {
		const backupData = {
			...$appStore,
			theme: $themeStore
		};
		const dataStr =
			'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
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

				if (!appStore.restore(parsed)) {
					toast.error('That backup could not be read, so nothing was changed.');
					return;
				}

				const themeResult = ThemeSettingsSchema.safeParse(parsed?.theme);
				if (themeResult.success) themeStore.set(themeResult.data);

				toast.success('Backup restored');
			} catch {
				toast.error('That file is not a valid JSON backup.');
			} finally {
				target.value = '';
			}
		};
		reader.readAsText(file);
	}
</script>

<div class="space-y-3 text-xs">
	<p class="text-[11px] text-muted-foreground">
		Your data only lives in this browser, so keep a backup before clearing site data or switching
		devices.
	</p>

	<div class="grid gap-2 sm:grid-cols-3">
		<Button
			variant="outline"
			size="sm"
			onclick={() => (importModalOpen = true)}
			class="h-9 justify-start gap-2 bg-background px-3 text-xs font-normal"
		>
			<FileSpreadsheet size={14} class="text-primary" />
			<span>Import Grades (ArchersHub)</span>
		</Button>

		<Button
			variant="outline"
			size="sm"
			onclick={exportState}
			class="h-9 justify-start gap-2 bg-background px-3 text-xs font-normal"
		>
			<Download size={14} class="text-muted-foreground" />
			<span>Backup (JSON)</span>
		</Button>

		<Button
			variant="outline"
			size="sm"
			onclick={() => fileInputEl?.click()}
			class="h-9 justify-start gap-2 bg-background px-3 text-xs font-normal"
		>
			<Upload size={14} class="text-muted-foreground" />
			<span>Restore (JSON)</span>
		</Button>
	</div>
</div>

<input bind:this={fileInputEl} type="file" accept=".json" class="hidden" onchange={importState} />

<ImportModal bind:open={importModalOpen} />
