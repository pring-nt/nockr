<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import { isProgramUnitsSet, isValidProgramUnits } from '$lib/logic/unitCalc';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();

	let units = $state<number | null>(null);
	let total = $derived($appStore.totalProgramUnits);

	function save() {
		if (isValidProgramUnits(units)) appStore.setProgramUnits(units);
	}
</script>

{#if !isProgramUnitsSet($appStore)}
	<div class={cn('space-y-2 rounded-lg border border-primary/30 bg-primary/10 p-3', className)}>
		<div class="space-y-0.5">
			<p class="text-xs font-semibold text-foreground">Set your program units</p>
			<p class="text-[11px] leading-relaxed text-muted-foreground">
				We're assuming {total}, the default. Your program's real total changes your units remaining,
				honors, and Unit Runway.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Input
				type="number"
				min="1"
				bind:value={units}
				placeholder={String(total)}
				aria-label="Total program units"
				class="h-8 w-20 bg-background/50 text-center font-mono text-xs"
				onkeydown={(e) => e.key === 'Enter' && save()}
			/>
			<Button size="sm" class="h-8" disabled={!isValidProgramUnits(units)} onclick={save}>
				Save
			</Button>
			<Button
				size="sm"
				variant="ghost"
				class="h-8 text-muted-foreground"
				onclick={() => appStore.setProgramUnits(total)}
			>
				Keep {total}
			</Button>
		</div>
	</div>
{/if}
