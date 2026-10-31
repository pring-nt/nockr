<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import ChecklistDrawer from '$lib/components/plan/ChecklistDrawer.svelte';
	import ChecklistPanel from '$lib/components/plan/ChecklistPanel.svelte';
	import PlanCanvas from '$lib/components/plan/PlanCanvas.svelte';
	import PlanDeck from '$lib/components/plan/PlanDeck.svelte';

	let panelOpen = $derived($appStore.ui?.checklistPanelOpen ?? true);
	let isPhone = $state(false);

	$effect(() => {
		const query = window.matchMedia('(max-width: 767px)');
		const sync = () => (isPhone = query.matches);
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});
</script>

<svelte:head>
	<title>Flowchart Planner — Nockr</title>
</svelte:head>

{#if isPhone}
	<div class="flex h-[calc(100dvh-var(--header-height,56px))] flex-col overflow-hidden">
		<PlanDeck />
		<ChecklistDrawer />
	</div>
{:else}
	<div class="flex h-[calc(100vh-var(--header-height,56px))] overflow-hidden bg-transparent">
		<aside
			class="shrink-0 overflow-hidden border-r border-border/40 transition-all duration-200"
			style="width: {panelOpen ? '260px' : '40px'}"
		>
			<ChecklistPanel />
		</aside>

		<PlanCanvas />
	</div>
{/if}
