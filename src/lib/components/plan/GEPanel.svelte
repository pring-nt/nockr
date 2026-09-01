<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { appStore } from '$lib/stores/appState';
	import type { GEItem } from '$lib/schemas';
	import GEItemRow from '$lib/components/plan/GEItemRow.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ChevronLeft, ChevronRight, Plus, RotateCcw, Info } from 'lucide-svelte';

	let isOpen = $derived($appStore.ui?.gePanelOpen ?? true);
	let geItems = $derived($appStore.geChecklist ?? []);

	let newItemLabel = $state('');

	let takenCoursesSet = $derived.by(() => {
		const set = new SvelteSet<string>();
		for (const term of $appStore.terms) {
			for (const course of term.courses) {
				const name = course.name.trim().toLowerCase();
				if (
					name &&
					course.grade !== null &&
					course.grade !== undefined &&
					String(course.grade).trim() !== ''
				) {
					set.add(name);
				}
			}
		}
		return set;
	});

	let completedCount = $derived(
		geItems.filter((i) => i.completed || takenCoursesSet.has(i.label.trim().toLowerCase())).length
	);

	function togglePanel() {
		appStore.update((state) => ({
			...state,
			ui: {
				...state.ui,
				gePanelOpen: !state.ui.gePanelOpen
			}
		}));
	}

	function toggleItem(id: string) {
		appStore.update((state) => ({
			...state,
			geChecklist: state.geChecklist.map((item) =>
				item.id === id ? { ...item, completed: !item.completed } : item
			)
		}));
	}

	function updateItemLabel(id: string, newLabel: string) {
		appStore.update((state) => ({
			...state,
			geChecklist: state.geChecklist.map((item) =>
				item.id === id ? { ...item, label: newLabel } : item
			)
		}));
	}

	function deleteItem(id: string) {
		appStore.update((state) => ({
			...state,
			geChecklist: state.geChecklist.filter((item) => item.id !== id)
		}));
	}

	function addCustomItem() {
		if (!newItemLabel.trim()) return;
		const item: GEItem = {
			id: crypto.randomUUID(),
			label: newItemLabel.trim(),
			completed: false
		};
		appStore.update((state) => ({
			...state,
			geChecklist: [...state.geChecklist, item]
		}));
		newItemLabel = '';
	}
</script>

<div class="relative flex h-full flex-col bg-background/20 backdrop-blur-md">
	<!-- Top Bar / Header -->
	<div class="flex h-14 items-center justify-between border-b border-border/40 px-3">
		{#if isOpen}
			<div class="flex items-center gap-1.5 overflow-hidden">
				<h2 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					GE Checklist
				</h2>
				<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
					{completedCount}/{geItems.length}
				</span>

				<!-- Note Trigger -->
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-6 w-6 text-muted-foreground hover:text-foreground"
								aria-label="Curriculum info"
							>
								<Info size={13} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content side="bottom" align="start" class="w-68 p-3 text-xs leading-relaxed">
						<p class="font-semibold text-foreground">Curriculum Note</p>
						<p class="text-[11px] leading-normal text-muted-foreground">
							The default GE courses are general presets and may vary depending on your university
							or degree program (e.g., DLSU flowcharts). Feel free to customize or add items to
							match your specific curriculum.
						</p>
					</Popover.Content>
				</Popover.Root>
			</div>

			<div class="flex items-center gap-1">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-muted-foreground hover:text-foreground"
								onclick={() => appStore.resetGEChecklist()}
							>
								<RotateCcw size={13} />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Reset to default GE preset</p>
					</Tooltip.Content>
				</Tooltip.Root>

				<Button variant="ghost" size="icon" class="h-7 w-7 shrink-0" onclick={togglePanel}>
					<ChevronLeft size={16} />
				</Button>
			</div>
		{:else}
			<div class="flex w-full justify-center">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-muted-foreground hover:text-foreground"
								onclick={togglePanel}
								aria-label="Expand GE Checklist"
							>
								<ChevronRight size={16} />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="right">
						<p>Expand GE Checklist</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		{/if}
	</div>

	{#if isOpen}
		<!-- GE Items Scroll Container -->
		<div class="flex-1 space-y-1.5 overflow-y-auto p-3 text-xs">
			{#each geItems as item (item.id)}
				<GEItemRow
					{item}
					isAutoCompleted={takenCoursesSet.has(item.label.trim().toLowerCase())}
					onToggle={() => toggleItem(item.id)}
					onDelete={() => deleteItem(item.id)}
					onUpdateLabel={(newLabel) => updateItemLabel(item.id, newLabel)}
				/>
			{/each}
		</div>

		<!-- Add Custom GE Input -->
		<div class="border-t border-border/40 p-3">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					addCustomItem();
				}}
				class="flex gap-1.5"
			>
				<Input
					type="text"
					bind:value={newItemLabel}
					placeholder="Add custom GE..."
					class="h-8 bg-background/40 text-xs backdrop-blur-xs"
				/>
				<Button type="submit" size="sm" class="h-8 px-2.5">
					<Plus size={14} />
				</Button>
			</form>
		</div>
	{/if}
</div>
