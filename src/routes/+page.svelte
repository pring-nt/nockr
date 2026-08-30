<script lang="ts">
	import AcademicSummaryCard from '$lib/components/summary/AcademicSummaryCard.svelte';
	import TermNavigator from '$lib/components/term/TermNavigator.svelte';
</script>

<svelte:head>
	<title>Nockr — GPA, GWA & Honors Tracker</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-12">
	<AcademicSummaryCard />
	<TermNavigator />
</div>
