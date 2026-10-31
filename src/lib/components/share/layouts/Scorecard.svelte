<script lang="ts">
	import type { ShareData } from '$lib/logic/share';
	import ShareRows from '../ShareRows.svelte';
	import TrendLine from '../TrendLine.svelte';

	let { data }: { data: ShareData } = $props();

	let rows = $derived([...data.courses, ...data.stats]);
</script>

{#snippet rule()}
	<div class="my-4 border-t-[3px] border-current" style="filter: var(--ink-filter);"></div>
{/snippet}

<p class="share-truncate text-[34px] font-medium">{data.heading}</p>
{@render rule()}

{#if rows.length > 0}
	<ShareRows {rows} />
	{@render rule()}
{/if}

{#if data.trend.length > 0}
	<TrendLine points={data.trend} height={72} />
	{@render rule()}
{/if}

{#if data.gpa}
	<div class="flex items-baseline justify-between gap-6">
		<span class="text-[30px]">{data.gpaLabel}</span>
		<span class="share-hero text-[72px] leading-none font-medium tracking-tight">{data.gpa}</span>
	</div>
{/if}

{#if data.honor}
	<p class="mt-2 text-[30px] {data.gpa ? '' : 'share-hero w-fit'}">{data.honor}</p>
{/if}

{#if data.cgpa}
	<ShareRows rows={[data.cgpa]} class="mt-3" />
{/if}
