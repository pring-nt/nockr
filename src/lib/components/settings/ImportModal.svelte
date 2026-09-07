<script lang="ts">
	import type { Term } from '$lib/schemas';
	import { parseGradeExport } from '$lib/logic/import';
	import { appStore } from '$lib/stores/appState';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import {
		TriangleAlert,
		CircleAlert,
		FileSpreadsheet,
		LoaderCircle,
		CircleCheck
	} from 'lucide-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let step = $state<'upload' | 'confirm' | 'success'>('upload');
	let isParsing = $state(false);
	let errorMessage = $state<string | null>(null);
	let parsedTerms = $state<Term[]>([]);
	let fileInputEl = $state<HTMLInputElement | null>(null);

	let totalCoursesCount = $derived(parsedTerms.reduce((acc, term) => acc + term.courses.length, 0));

	function resetState() {
		step = 'upload';
		isParsing = false;
		errorMessage = null;
		parsedTerms = [];
		if (fileInputEl) fileInputEl.value = '';
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) resetState();
	}

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		await processFile(file);
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;
		await processFile(file);
	}

	async function processFile(file: File) {
		isParsing = true;
		errorMessage = null;

		const result = await parseGradeExport(file);
		isParsing = false;

		if (result.status === 'ok') {
			parsedTerms = result.terms;
			step = 'confirm';
		} else {
			errorMessage = result.message;
		}
	}

	function executeImport() {
		appStore.update((state) => ({
			...state,
			terms: parsedTerms
		}));
		step = 'success';
	}
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
	<DialogContent
		onCloseAutoFocus={(e) => e.preventDefault()}
		class="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden p-4 sm:max-w-lg sm:p-6"
	>
		{#if step === 'upload'}
			<DialogHeader class="space-y-1 text-left">
				<DialogTitle class="text-lg font-bold sm:text-xl">Import Grades from ArchersHub</DialogTitle
				>
				<DialogDescription class="text-xs text-muted-foreground">
					This feature is only available for DLSU students via ArchersHub.
				</DialogDescription>
			</DialogHeader>

			<div class="mt-3 flex-1 space-y-3.5 overflow-y-auto px-1 text-xs">
				<ol class="list-decimal space-y-1 pl-5 font-medium text-foreground">
					<li>Log in to <span class="font-bold">ArchersHub</span></li>
					<li>Go to <span class="font-bold">Profile</span> on the left sidebar</li>
					<li>Select <span class="font-bold">Curriculum Progression</span></li>
					<li>Scroll down to <span class="font-bold">Core Courses</span></li>
					<li>Click <span class="font-bold">Export Data</span></li>
				</ol>

				<label
					ondragover={(e) => e.preventDefault()}
					ondrop={handleDrop}
					class="relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 sm:p-6"
				>
					<input
						bind:this={fileInputEl}
						type="file"
						accept=".xls,.html,.htm"
						class="sr-only"
						onchange={handleFileSelect}
						disabled={isParsing}
					/>
					{#if isParsing}
						<LoaderCircle class="mb-2 size-7 animate-spin text-primary sm:size-8" />
						<p class="font-semibold text-foreground">Parsing grade export...</p>
					{:else}
						<FileSpreadsheet class="mb-2 size-7 text-muted-foreground sm:size-8" />
						<p class="font-semibold text-foreground">Click to upload or drag & drop</p>
						<p class="mt-0.5 text-[11px] text-muted-foreground">
							Exported .xls / .html file from Core Courses
						</p>
					{/if}
				</label>

				{#if errorMessage}
					<div
						class="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive"
					>
						<CircleAlert class="mt-0.5 size-4 shrink-0" />
						<p class="text-xs">{errorMessage}</p>
					</div>
				{/if}

				<div class="rounded-xl border border-border bg-muted/40 p-3 text-muted-foreground">
					<div class="mb-1 flex items-center gap-1.5 font-bold text-foreground">
						<TriangleAlert class="size-4 shrink-0 text-muted-foreground" />
						<span>Know before you import</span>
					</div>
					<p class="leading-relaxed">
						The Core Courses export only covers your core curriculum. Tech electives and courses
						taken out of sequence will not appear — add these manually after importing.
					</p>
					<p class="mt-1.5 leading-relaxed">
						If you are enrolled in a minor program, some minor courses may appear incorrectly or be
						missing entirely due to how ArchersHub generates this export.
					</p>
					<p class="mt-2 text-[10px] text-muted-foreground/70">
						Nockr is not affiliated with De La Salle University.
					</p>
				</div>
			</div>
		{:else if step === 'confirm'}
			<DialogHeader class="space-y-1 text-left">
				<DialogTitle class="text-lg font-bold sm:text-xl">Confirm Data Replacement</DialogTitle>
				<DialogDescription class="text-xs text-muted-foreground">
					Review the extracted terms and courses below before completing the import.
				</DialogDescription>
			</DialogHeader>

			<div class="mt-3 flex-1 space-y-3.5 overflow-y-auto px-1">
				<div class="rounded-xl border border-border bg-card p-3.5 sm:p-4">
					<p class="mb-2 text-xs font-bold text-foreground">
						Found {parsedTerms.length} terms · {totalCoursesCount} courses
					</p>
					<div
						class="max-h-36 space-y-1 overflow-y-auto pr-1 font-mono text-xs text-muted-foreground sm:max-h-40"
					>
						{#each parsedTerms as term (term.id)}
							<div class="flex justify-between border-b border-border/40 py-1 last:border-none">
								<span class="truncate pr-2">{term.name}</span>
								<span class="shrink-0 font-semibold text-foreground"
									>{term.courses.length} courses</span
								>
							</div>
						{/each}
					</div>
				</div>

				<div
					class="rounded-xl border border-destructive/50 bg-destructive/10 p-3.5 text-destructive sm:p-4"
				>
					<div class="flex items-start gap-2.5">
						<TriangleAlert class="mt-0.5 size-4 shrink-0 sm:size-5" />
						<div class="space-y-1 text-xs">
							<p class="font-bold">
								This will permanently replace all of your current terms and courses.
							</p>
							<p class="leading-relaxed">
								Any manual edits, renamed courses, or courses you added yourself will be lost.
							</p>
							<p class="text-[11px] font-bold tracking-wider uppercase">This cannot be undone.</p>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button variant="ghost" onclick={resetState} size="sm" class="w-full sm:w-auto"
					>Cancel</Button
				>
				<Button variant="destructive" onclick={executeImport} size="sm" class="w-full sm:w-auto">
					Replace my data and import
				</Button>
			</div>
		{:else if step === 'success'}
			<div class="space-y-3 py-2 text-center sm:py-4">
				<div
					class="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary sm:size-12"
				>
					<CircleCheck class="size-5 sm:size-6" />
				</div>
				<DialogHeader class="items-center text-center">
					<DialogTitle class="text-lg font-bold sm:text-xl">Import Complete</DialogTitle>
				</DialogHeader>
				<p class="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
					Import complete. Tech electives and out-of-sequence courses were not included — add these
					manually if needed.
				</p>
				<Button onclick={() => handleOpenChange(false)} class="mt-2 w-full sm:w-auto" size="sm"
					>Done</Button
				>
			</div>
		{/if}
	</DialogContent>
</Dialog>
