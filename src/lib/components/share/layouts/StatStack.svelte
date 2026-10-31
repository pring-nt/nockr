<script lang="ts">
	import type { ShareData } from '$lib/logic/share';
	import ShareHonorText from '../ShareHonorText.svelte';
	import ShareRows from '../ShareRows.svelte';
	import TrendLine from '../TrendLine.svelte';

	let { data }: { data: ShareData } = $props();
</script>

<p class="share-truncate text-[28px]">{data.heading}</p>

{#if data.gpa}
	<p class="mt-3 text-[28px]">{data.gpaLabel}</p>
	<p class="share-hero w-fit text-[104px] leading-none font-medium tracking-tight">{data.gpa}</p>
{/if}

{#if data.honor}
	<p
		class="share-hero mt-1 w-fit font-serif leading-[1.3] {data.honor.length > 14
			? 'text-[52px]'
			: 'text-[76px]'}"
	>
		<ShareHonorText text={data.honor} />
	</p>
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
