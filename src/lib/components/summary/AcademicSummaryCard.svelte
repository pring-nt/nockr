<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import { computeCGPA, computeUnitsEarned } from '$lib/logic/gpa';
	import { PenLine, Check, Award, ChevronRight, Share2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import LatinHonorsModal from '$lib/components/honors/LatinHonorsModal.svelte';
	import ShareModal from '$lib/components/share/ShareModal.svelte';

	let cgpa = $derived(computeCGPA($appStore.terms));
	let unitsEarned = $derived(computeUnitsEarned($appStore.terms));
	let totalProgramUnits = $derived($appStore.totalProgramUnits ?? 165);
	let remainingUnits = $derived(Math.max(0, totalProgramUnits - unitsEarned));
	let progressPercent = $derived(
		totalProgramUnits > 0 ? Math.min(100, Math.round((unitsEarned / totalProgramUnits) * 100)) : 0
	);

	let isEditingTotal = $state(false);
	let tempTotalUnits = $state(165);
	let honorsModalOpen = $state(false);
	let shareModalOpen = $state(false);

	function startEditing() {
		tempTotalUnits = totalProgramUnits;
		isEditingTotal = true;
	}

	function saveTotalUnits() {
		if (tempTotalUnits > 0) {
			appStore.update((state) => ({ ...state, totalProgramUnits: tempTotalUnits }));
		}
		isEditingTotal = false;
	}
</script>

<Card class="glass border-border/40">
	<CardContent class="space-y-5 p-5 sm:p-6">
		<!-- Header Row with Share Action -->
		<div class="flex items-center justify-between border-b border-border/30 pb-3">
			<h2 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
				Academic Summary
			</h2>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="sm"
							onclick={() => (shareModalOpen = true)}
							class="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
						>
							<Share2 size={13} />
							<span>Export Card</span>
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Export academic summary</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>

		<!-- Stats row -->
		<div class="grid grid-cols-1 items-start gap-6 sm:grid-cols-3 sm:gap-4">
			<!-- Cumulative GPA Column -->
			<div class="space-y-2">
				<span class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
					Cumulative GPA
				</span>

				<div
					class="gradient-text font-mono text-4xl font-bold tracking-tight text-primary sm:text-5xl"
				>
					{cgpa !== null ? cgpa.toFixed(3) : '—'}
				</div>

				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								type="button"
								onclick={() => (honorsModalOpen = true)}
								class="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary shadow-xs transition-all hover:border-primary/50 hover:bg-primary/20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
							>
								<Award size={14} class="shrink-0 transition-transform group-hover:scale-110" />
								<span>Honors Standing</span>
								<ChevronRight
									size={13}
									class="opacity-70 transition-transform group-hover:translate-x-0.5"
								/>
							</button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>View Latin honors standing</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>

			<!-- Earned Units Column -->
			<div class="space-y-1 sm:border-l sm:border-border/30 sm:pl-4">
				<span class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
					Earned Units
				</span>
				<div class="gradient-text font-mono text-2xl font-semibold text-foreground sm:text-3xl">
					{unitsEarned}
				</div>
			</div>

			<!-- Units Remaining Column -->
			<div class="space-y-1 sm:border-l sm:border-border/30 sm:pl-4">
				<span class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
					Units Remaining
				</span>
				<div class="gradient-text font-mono text-2xl font-semibold text-foreground sm:text-3xl">
					{remainingUnits}
				</div>
			</div>
		</div>

		<!-- Progress bar row -->
		<div class="space-y-2 border-t border-border/30 pt-2">
			<div class="flex items-center justify-between text-xs">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<span>Degree Progress</span>
					<span class="font-mono font-medium text-foreground">({progressPercent}%)</span>
				</div>

				{#if isEditingTotal}
					<div class="flex items-center gap-1.5">
						<span class="text-muted-foreground">Target:</span>
						<Input
							type="number"
							bind:value={tempTotalUnits}
							class="h-7 w-16 border-primary/50 bg-background/50 px-1 py-0 text-center font-mono text-xs focus-visible:ring-1"
							min="1"
							onkeydown={(e) => e.key === 'Enter' && saveTotalUnits()}
							onblur={saveTotalUnits}
						/>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										size="icon"
										variant="ghost"
										class="h-7 w-7 text-primary hover:bg-primary/10"
										onclick={saveTotalUnits}
									>
										<Check size={14} />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Save target units</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</div>
				{:else}
					<div class="flex items-center gap-1.5">
						<span class="text-muted-foreground">
							Target:
							<span
								class="border-b border-dashed border-muted-foreground/50 px-0.5 pb-0.5 font-mono font-medium text-foreground"
							>
								{totalProgramUnits}
							</span>
							units
						</span>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										variant="ghost"
										size="icon"
										onclick={startEditing}
										class="h-6 w-6 rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground"
									>
										<PenLine size={13} />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Edit target program units</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</div>
				{/if}
			</div>

			<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
				<div
					class="h-full bg-primary transition-all duration-500 ease-out"
					style="width: {progressPercent}%;"
				></div>
			</div>
		</div>
	</CardContent>
</Card>

<LatinHonorsModal bind:open={honorsModalOpen} />
<ShareModal bind:open={shareModalOpen} />
