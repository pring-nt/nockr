<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Settings, FileSpreadsheet, BookOpen, Ruler } from 'lucide-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		onCloseAutoFocus={(e) => e.preventDefault()}
		class="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden p-4 sm:max-w-lg sm:p-6"
	>
		<Dialog.Header class="space-y-1 text-left">
			<Dialog.Title class="text-lg font-bold sm:text-xl">Getting Started</Dialog.Title>
			<Dialog.Description class="text-xs text-muted-foreground">
				Get Nockr set up in a few steps.
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-3 flex-1 space-y-3 overflow-y-auto px-1">
			<!-- Step 1 -->
			<div class="flex gap-3 rounded-xl border border-border bg-muted/30 p-3.5 sm:p-4">
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				>
					<Settings size={16} />
				</div>
				<div class="space-y-0.5">
					<p class="text-sm font-semibold text-foreground">Configure your university</p>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Open <span class="font-medium text-foreground">Settings</span> from the header and pick
						your university preset. This sets the right grading scale, honors tiers, and policies
						for your school. If your university isn't listed, choose
						<span class="font-medium text-foreground">Custom</span> and configure everything yourself.
					</p>
				</div>
			</div>

			<!-- Step 2 -->
			<div class="flex gap-3 rounded-xl border border-border bg-muted/30 p-3.5 sm:p-4">
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				>
					<Ruler size={16} />
				</div>
				<div class="space-y-0.5">
					<p class="text-sm font-semibold text-foreground">Set your total program units</p>
					<p class="text-xs leading-relaxed text-muted-foreground">
						On the <span class="font-medium text-foreground">Overview</span> page, find the degree progress
						bar on your summary card and click the unit count to edit it. This is used to track how far
						along you are and powers the unit calculator.
					</p>
				</div>
			</div>

			<!-- Step 3 -->
			<div class="flex gap-3 rounded-xl border border-border bg-muted/30 p-3.5 sm:p-4">
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				>
					<BookOpen size={16} />
				</div>
				<div class="space-y-0.5">
					<p class="text-sm font-semibold text-foreground">Add your terms and courses</p>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Hit <span class="font-medium text-foreground">Add Term</span>, then add your courses
						with their names, units, and grades. Your TGPA and CGPA update live as you type. Courses
						with no grade yet are treated as ungraded and excluded from your GPA.
					</p>
				</div>
			</div>

			<!-- Step 4 — DLSU only -->
			<div class="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4">
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				>
					<FileSpreadsheet size={16} />
				</div>
				<div class="space-y-0.5">
					<div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
						<p class="text-sm font-semibold text-foreground">Import from ArchersHub</p>
						<span
							class="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
						>
							DLSU only
						</span>
					</div>
					<p class="text-xs leading-relaxed text-muted-foreground">
						Skip manual entry for courses you've already taken. Use the <span
							class="font-medium text-foreground">spreadsheet icon</span
						> in the bottom of the settings sidebar to import your grade history directly from your ArchersHub
						Curriculum Progression export. Core courses only — electives and minor courses will need to
						be added manually.
					</p>
				</div>
			</div>
		</div>

		<Dialog.Footer class="mt-3">
			<Button onclick={() => (open = false)} size="sm" class="w-full sm:w-auto">Got it</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
