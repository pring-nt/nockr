<script lang="ts">
    import { Target } from 'lucide-svelte';
    import AcademicSummaryCard from '$lib/components/summary/AcademicSummaryCard.svelte';
    import TermNavigator from "$lib/components/term/TermNavigator.svelte";
</script>

<div class="min-h-screen pb-12">
    <!-- Header -->
    <header class="border-b border-border/40 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md z-10">
        <div class="flex items-center gap-2.5">
            <div class="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Target size={18} />
            </div>
            <span class="font-semibold text-lg tracking-tight gradient-text">Nockr</span>
        </div>
        <div class="flex items-center gap-2">
            <!-- Settings sheet trigger goes here (Phase 3) -->
            <!-- Theme picker goes here (Phase 5) -->
        </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <AcademicSummaryCard />
        <TermNavigator />
    </main>
</div>