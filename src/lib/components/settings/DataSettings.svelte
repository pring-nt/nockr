<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Download, FileSpreadsheet, Upload } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import ImportModal from '$lib/components/settings/ImportModal.svelte';
	import { appStore } from '$lib/stores/appState';
	import { shareStore } from '$lib/stores/shareState';
	import { themeStore } from '$lib/stores/themeState';
	import {
		MAX_BACKUP_BYTES,
		ShareConfigSchema,
		ThemeSettingsSchema,
		type AppState
	} from '$lib/schemas';

	interface PendingBackup {
		state: AppState;
		clearedGrades: number;
		theme: unknown;
		share: unknown;
	}

	let importModalOpen = $state(false);
	let fileInputEl = $state<HTMLInputElement | null>(null);
	let pendingBackup = $state.raw<PendingBackup | null>(null);

	let pendingTerms = $derived(pendingBackup?.state.terms.length ?? 0);
	let pendingCourses = $derived(
		pendingBackup?.state.terms.reduce((total, term) => total + term.courses.length, 0) ?? 0
	);

	function exportState() {
		const backupData = {
			...$appStore,
			theme: $themeStore,
			share: $shareStore
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
		target.value = '';
		if (!file) return;

		if (file.size > MAX_BACKUP_BYTES) {
			toast.error('That file is too large to be a Nockr backup, so nothing was changed.');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const parsed = JSON.parse(e.target?.result as string);
				const backup = appStore.readBackup(parsed);

				if (!backup) {
					toast.error('That file is not a Nockr backup, so nothing was changed.');
					return;
				}
				pendingBackup = { ...backup, theme: parsed.theme, share: parsed.share };
			} catch {
				toast.error('That file is not a valid JSON backup.');
			}
		};
		reader.onerror = () => toast.error('That file could not be read.');
		reader.readAsText(file);
	}

	function restoreBackup() {
		if (!pendingBackup) return;
		const { state, clearedGrades, theme, share } = pendingBackup;
		pendingBackup = null;

		appStore.set(state);

		const themeResult = ThemeSettingsSchema.safeParse(theme);
		if (themeResult.success) themeStore.set(themeResult.data);

		const shareResult = ShareConfigSchema.safeParse(share);
		if (shareResult.success) shareStore.update(() => shareResult.data);

		if (clearedGrades > 0) {
			toast.warning(
				`Backup restored. ${clearedGrades} ${clearedGrades === 1 ? 'grade was' : 'grades were'} outside your grading scale and got cleared.`
			);
		} else {
			toast.success('Backup restored');
		}
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

<Dialog.Root
	open={pendingBackup !== null}
	onOpenChange={(isOpen) => {
		if (!isOpen) pendingBackup = null;
	}}
>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Restore this backup?</Dialog.Title>
			<Dialog.Description class="text-xs">
				Found {pendingTerms}
				{pendingTerms === 1 ? 'term' : 'terms'} and {pendingCourses}
				{pendingCourses === 1 ? 'course' : 'courses'}. This replaces everything you have here now,
				and it can't be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (pendingBackup = null)}>Cancel</Button>
			<Button variant="destructive" onclick={restoreBackup}>Replace my data</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
