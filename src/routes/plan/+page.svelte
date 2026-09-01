<script lang="ts">
    import { appStore } from '$lib/stores/appState';
    import GEPanel from '$lib/components/plan/GEPanel.svelte';
    import PlanCanvas from '$lib/components/plan/PlanCanvas.svelte';

    let panelOpen = $derived($appStore.ui?.gePanelOpen ?? true);
</script>

<svelte:head>
    <title>Flowchart Planner — Nockr</title>
</svelte:head>

<div class="flex h-[calc(100vh-var(--header-height,56px))] overflow-hidden bg-background">
    <aside
            class="shrink-0 overflow-hidden border-r border-border/60 transition-all duration-200"
            style="width: {panelOpen ? '260px' : '40px'}"
    >
        <GEPanel />
    </aside>

    <PlanCanvas />
</div>