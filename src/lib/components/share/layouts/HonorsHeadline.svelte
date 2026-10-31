<script lang="ts">
	import type { ShareData } from '$lib/logic/share';
	import ShareHonorText from '../ShareHonorText.svelte';
	import ShareRows from '../ShareRows.svelte';
	import TrendLine from '../TrendLine.svelte';

	let { data }: { data: ShareData } = $props();

	let gpaLine = $derived(data.gpa ? `${data.gpaLabel} ${data.gpa}` : null);
	let headline = $derived(data.honor ?? gpaLine ?? data.heading);
	let details = $derived(
		[data.heading, data.honor ? gpaLine : null]
			.filter((part) => part && part !== headline)
			.join(' · ')
	);
</script>

<p
	class="share-hero w-fit font-serif leading-[1.3] {headline.length > 18
		? 'text-[60px]'
		: headline.length > 14
			? 'text-[80px]'
			: 'text-[104px]'}"
>
	<ShareHonorText text={headline} />
</p>

{#if details}
	<div class="mt-4">
		<p class="share-truncate text-[28px]">{details}</p>
	</div>
{/if}

{#if data.trend.length > 0}
	<TrendLine points={data.trend} class="mt-6" />
{/if}

{#if data.courses.length > 0}
	<ShareRows rows={data.courses} class="mt-6" />
{/if}

{#if data.cgpa}
	<ShareRows rows={[data.cgpa]} class="mt-5" />
{/if}
