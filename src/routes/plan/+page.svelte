<script lang="ts">
	import { appStore } from '$lib/stores/appState';
	import ChecklistPanel from '$lib/components/plan/ChecklistPanel.svelte';
	import PlanCanvas from '$lib/components/plan/PlanCanvas.svelte';

	let panelOpen = $derived($appStore.ui?.checklistPanelOpen ?? true);
</script>

<svelte:head>
	<title>Flowchart Planner — Nockr</title>
</svelte:head>

<div class="flex h-[calc(100vh-var(--header-height,56px))] overflow-hidden bg-transparent">
	<aside
		class="shrink-0 overflow-hidden border-r border-border/40 transition-all duration-200"
		style="width: {panelOpen ? '260px' : '40px'}"
	>
		<ChecklistPanel />
	</aside>

	<PlanCanvas />
</div>
