<script lang="ts">
	let {
		points,
		height = 96,
		class: className = ''
	}: { points: number[]; height?: number; class?: string } = $props();

	const WIDTH = 460;
	const INSET = 10;

	let coords = $derived(
		points.map((point, i) => ({
			x: INSET + (i / (points.length - 1)) * (WIDTH - INSET * 2),
			y: height - INSET - point * (height - INSET * 2)
		}))
	);
	let last = $derived(coords[coords.length - 1]);
</script>

<svg
	viewBox="0 0 {WIDTH} {height}"
	width="100%"
	{height}
	class={className}
	style="filter: var(--ink-filter); color: var(--hero, inherit);"
	aria-hidden="true"
>
	<polyline
		points={coords.map(({ x, y }) => `${x},${y}`).join(' ')}
		fill="none"
		stroke="currentColor"
		stroke-width="6"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<circle cx={last.x} cy={last.y} r="9" fill="currentColor" />
</svg>
