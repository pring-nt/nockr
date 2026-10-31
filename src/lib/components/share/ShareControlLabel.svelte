<script lang="ts">
	import { Label } from '$lib/components/ui/label';

	let { text }: { text: string } = $props();
</script>

<Label class="mb-2 block font-semibold text-(--subtle)">{text}</Label>
