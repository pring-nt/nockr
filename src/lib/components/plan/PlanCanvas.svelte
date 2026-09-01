<script lang="ts">
    import { appStore } from '$lib/stores/appState';
    import TermColumn from '$lib/components/plan/TermColumn.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Plus } from 'lucide-svelte';

    function addTerm() {
        const newId = crypto.randomUUID();
        appStore.update((state) => ({
            ...state,
            terms: [
                ...state.terms,
                {
                    id: newId,
                    name: `Term ${state.terms.length + 1}`,
                    courses: []
                }
            ]
        }));
    }
</script>

<main class="flex-1 overflow-x-auto overflow-y-auto p-6">
    <div class="flex h-full items-start gap-4" style="width: max-content">
        {#each $appStore.terms as term (term.id)}
            <TermColumn {term} />
        {/each}

        <!-- Add New Term Column Trigger -->
        <div class="flex h-full w-50 shrink-0 items-start">
            <Button
                    variant="outline"
                    onclick={addTerm}
                    class="h-12 w-full gap-2 border-dashed text-muted-foreground hover:text-foreground"
            >
                <Plus size={16} /> Add Term
            </Button>
        </div>
    </div>
</main>