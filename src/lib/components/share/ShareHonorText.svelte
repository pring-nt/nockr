<script lang="ts">
	let { text }: { text: string } = $props();

	let lastWordAt = $derived(text.lastIndexOf(' ') + 1);
</script>

<!-- Kaomoji have break points between their characters, so the last word stays whole -->
{text.slice(0, lastWordAt)}<span class="whitespace-nowrap">{text.slice(lastWordAt)}</span>
