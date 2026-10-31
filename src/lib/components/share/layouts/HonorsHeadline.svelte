<script lang="ts">
	import type { ShareData } from '$lib/logic/share';
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
	class="share-hero w-fit font-serif leading-none {headline.length > 14
		? 'text-[80px]'
		: 'text-[104px]'}"
>
	{headline}
</p>

{#if details}
	<p class="mt-4 truncate text-[28px]">{details}</p>
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
