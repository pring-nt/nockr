<script lang="ts">
	import { tick } from 'svelte';
	import type { ShareConfig, Term } from '$lib/schemas';
	import { getThemeStyles, getCanvasDimensions } from '$lib/logic/share';
	import { appStore } from '$lib/stores/appState';
	import SummaryWidget from './widgets/SummaryWidget.svelte';
	import TermHeaderWidget from './widgets/TermHeaderWidget.svelte';
	import CourseListWidget from './widgets/CourseListWidget.svelte';
	import { Target } from 'lucide-svelte';

	let {
		config,
		term,
		canvasRef = $bindable()
	}: {
		config: ShareConfig & { showWatermark?: boolean };
		term?: Term;
		canvasRef?: HTMLElement;
	} = $props();

	let themeStyles = $state<Record<string, string>>({});

	// Reactive theme tracking for DOM update synchronicity
	$effect(() => {
		const _activeTheme = $appStore.theme;
		if (_activeTheme) {
			tick().then(() => {
				themeStyles = getThemeStyles();
			});
		}
	});

	let dimensions = $derived(getCanvasDimensions(config.aspectRatio));

	let isLandscape = $derived(config.aspectRatio === '4:3' || config.aspectRatio === '16:9');
	let isSquare = $derived(config.aspectRatio === '1:1');

	let showSummary = $derived(config.widgets.academicSummary);
	let showHeader = $derived(!!term && config.widgets.termHeader);
	let showCourses = $derived(!!term && config.widgets.courseList);

	let activeCount = $derived((showSummary ? 1 : 0) + (showHeader ? 1 : 0) + (showCourses ? 1 : 0));

	let styleString = $derived(
		`width: ${dimensions.width}px; height: ${dimensions.height}px; ` +
			Object.entries(themeStyles)
				.map(([k, v]) => `${k}:${v}`)
				.join(';')
	);
</script>

<div
	bind:this={canvasRef}
	style={styleString}
	class="relative flex flex-col justify-between overflow-hidden p-12 font-sans text-(--text) select-none
    {config.background === 'solid' ? 'bg-(--surface)' : ''}
    {config.background === 'theme' ? 'bg-(--base)' : ''}
    {config.background === 'transparent' ? 'bg-transparent' : ''}"
>
	<!-- Ambient Core Gradient & Noise Texture for Theme Background Mode -->
	{#if config.background === 'theme'}
		<div
			class="pointer-events-none absolute inset-0"
			style="
        background-image:
          radial-gradient(
            circle at 50% 35%,
            color-mix(in srgb, var(--iris, var(--primary)) 20%, transparent) 0%,
            color-mix(in srgb, var(--rose, var(--primary)) 10%, transparent) 40%,
            transparent 75%
          ),
          radial-gradient(
            circle at 85% 15%,
            color-mix(in srgb, var(--iris, var(--primary)) 15%, transparent) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at 15% 85%,
            color-mix(in srgb, var(--pine, var(--subtle)) 12%, transparent) 0%,
            transparent 50%
          ),
          url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.04\'/%3E%3C/svg%3E');
      "
		></div>
	{/if}

	<!-- Optional Header Branding -->
	{#if config.showWatermark ?? true}
		<div class="relative z-10 flex items-center justify-between border-b-2 border-border/80 pb-6">
			<div class="flex items-center gap-4">
				<div
					class="rounded-2xl border-2 border-(--iris)/30 bg-(--iris)/15 p-3 text-(--iris) shadow-md"
				>
					<Target size={32} />
				</div>
				<div>
					<h2 class="text-3xl font-black tracking-tight text-(--text)">Nockr</h2>
					<p class="text-sm font-semibold text-(--subtle)">Academic Performance Tracker</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Body Content -->
	<div class="relative z-10 my-auto w-full py-6">
		{#if isLandscape}
			{#if showSummary && (showHeader || showCourses)}
				<div class="grid w-full grid-cols-12 items-start gap-6">
					<div class="col-span-7">
						<SummaryWidget maskGpa={config.privacy.maskGPA} />
					</div>
					<div class="col-span-5 space-y-6">
						{#if showHeader}
							<TermHeaderWidget
								{term}
								maskGpa={config.privacy.maskGPA}
								showDeansListBadge={config.widgets.deansListBadge}
							/>
						{/if}
						{#if showCourses}
							<CourseListWidget
								courses={term?.courses ?? []}
								gradeDisplay={config.privacy.courseGradeDisplay}
							/>
						{/if}
					</div>
				</div>
			{:else}
				<div class="mx-auto w-full max-w-3xl space-y-6">
					{#if showSummary}
						<SummaryWidget maskGpa={config.privacy.maskGPA} />
					{/if}
					{#if showHeader}
						<TermHeaderWidget
							{term}
							maskGpa={config.privacy.maskGPA}
							showDeansListBadge={config.widgets.deansListBadge}
						/>
					{/if}
					{#if showCourses}
						<CourseListWidget
							courses={term?.courses ?? []}
							gradeDisplay={config.privacy.courseGradeDisplay}
						/>
					{/if}
				</div>
			{/if}
		{:else if isSquare && activeCount === 3}
			<div class="w-full space-y-5">
				<div class="grid grid-cols-12 items-start gap-5">
					<div class="col-span-7">
						<SummaryWidget maskGpa={config.privacy.maskGPA} />
					</div>
					{#if showHeader}
						<div class="col-span-5">
							<TermHeaderWidget
								{term}
								maskGpa={config.privacy.maskGPA}
								showDeansListBadge={config.widgets.deansListBadge}
							/>
						</div>
					{/if}
				</div>
				{#if showCourses}
					<CourseListWidget
						courses={term?.courses ?? []}
						gradeDisplay={config.privacy.courseGradeDisplay}
					/>
				{/if}
			</div>
		{:else}
			<div class="mx-auto w-full max-w-2xl space-y-6">
				{#if showSummary}
					<SummaryWidget maskGpa={config.privacy.maskGPA} />
				{/if}
				{#if showHeader}
					<TermHeaderWidget
						{term}
						maskGpa={config.privacy.maskGPA}
						showDeansListBadge={config.widgets.deansListBadge}
					/>
				{/if}
				{#if showCourses}
					<CourseListWidget
						courses={term?.courses ?? []}
						gradeDisplay={config.privacy.courseGradeDisplay}
					/>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Optional Footer Watermark -->
	{#if config.showWatermark ?? true}
		<div
			class="relative z-10 flex items-center justify-between border-t-2 border-border/80 pt-6 text-sm font-bold text-(--subtle)"
		>
			<span>Generated with Nockr</span>
			<span class="font-mono">nockr.vercel.app</span>
		</div>
	{/if}
</div>
