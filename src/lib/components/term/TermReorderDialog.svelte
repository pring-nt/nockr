<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { appStore } from '$lib/stores/appState';
	import { moveTerm } from '$lib/logic/terms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ArrowDown, ArrowUp } from 'lucide-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let terms = $derived($appStore.terms);

	async function move(index: number, delta: -1 | 1) {
		const { id } = terms[index];
		appStore.update((state) => ({
			...state,
			terms: moveTerm(state.terms, index, index + delta)
		}));

		// The pressed button can move or become disabled, which would drop keyboard focus
		await tick();
		const target = delta < 0 ? 'up' : 'down';
		const fallback = delta < 0 ? 'down' : 'up';
		const button = document.getElementById(`reorder-${id}-${target}`) as HTMLButtonElement | null;
		const next = button?.disabled ? document.getElementById(`reorder-${id}-${fallback}`) : button;
		next?.focus();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Reorder terms</Dialog.Title>
			<Dialog.Description>
				Terms named Term 1, Term 2, and so on renumber to match. Terms you renamed keep their names.
			</Dialog.Description>
		</Dialog.Header>

		<ol class="max-h-[60dvh] space-y-1.5 overflow-y-auto">
			{#each terms as term, index (term.id)}
				<li
					animate:flip={{ duration: 150 }}
					class="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2"
				>
					<span class="w-5 shrink-0 font-mono text-[11px] text-muted-foreground">{index + 1}</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">{term.name}</p>
						<p class="text-[11px] text-muted-foreground">
							{term.courses.length}
							{term.courses.length === 1 ? 'course' : 'courses'}
						</p>
					</div>
					<Button
						id="reorder-{term.id}-up"
						variant="ghost"
						size="icon"
						class="h-8 w-8 shrink-0"
						aria-label="Move {term.name} earlier"
						disabled={index === 0}
						onclick={() => move(index, -1)}
					>
						<ArrowUp size={15} />
					</Button>
					<Button
						id="reorder-{term.id}-down"
						variant="ghost"
						size="icon"
						class="h-8 w-8 shrink-0"
						aria-label="Move {term.name} later"
						disabled={index === terms.length - 1}
						onclick={() => move(index, 1)}
					>
						<ArrowDown size={15} />
					</Button>
				</li>
			{/each}
		</ol>

		<Dialog.Footer>
			<Button onclick={() => (open = false)}>Done</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
