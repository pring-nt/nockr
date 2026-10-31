<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import GettingStartedSteps from '$lib/components/layout/GettingStartedSteps.svelte';
	import ImportModal from '$lib/components/settings/ImportModal.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let importOpen = $state(false);

	function openImport() {
		open = false;
		importOpen = true;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden p-4 sm:max-w-md sm:p-6"
	>
		<GettingStartedSteps onClose={() => (open = false)} onImport={openImport} />
	</Dialog.Content>
</Dialog.Root>

<ImportModal bind:open={importOpen} />
