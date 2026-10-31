<script lang="ts">
	import { tick } from 'svelte';
	import type { ShareConfig } from '$lib/schemas';
	import { SHARE_CANVAS_WIDTH, SHARE_FORMAT_HEIGHTS } from '$lib/constants';
	import { getThemeStyles, type ShareData, type SharePhoto } from '$lib/logic/share';
	import { themeStore } from '$lib/stores/themeState';
	import { THEMES } from '$lib/themes';
	import { Target } from 'lucide-svelte';
	import HonorsHeadline from './layouts/HonorsHeadline.svelte';
	import Scorecard from './layouts/Scorecard.svelte';
	import StatStack from './layouts/StatStack.svelte';

	const PADDING = 40;
	const INK_COLORS = { white: '#ffffff', black: '#111111', theme: 'var(--text)' };
	const TEXT_WEIGHTS = {
		light: { body: 300, hero: 400 },
		regular: { body: 400, hero: 500 },
		medium: { body: 500, hero: 500 },
		bold: { body: 500, hero: 500 }
	};
	const LAYOUTS = {
		'stat-stack': StatStack,
		'honors-headline': HonorsHeadline,
		scorecard: Scorecard
	};

	let {
		config,
		data,
		photo,
		canvasRef = $bindable()
	}: {
		config: ShareConfig;
		data: ShareData;
		photo?: SharePhoto | null;
		canvasRef?: HTMLElement;
	} = $props();

	let themeStyles = $state<Record<string, string>>({});
	let contentHeight = $state(0);

	$effect(() => {
		const _activeTheme = $themeStore;
		if (_activeTheme) {
			tick().then(() => {
				themeStyles = getThemeStyles();
			});
		}
	});

	let Layout = $derived(LAYOUTS[config.layout]);
	let align = $derived(config.layouts[config.layout].align);
	let height = $derived(config.format === 'sticker' ? null : SHARE_FORMAT_HEIGHTS[config.format]);

	// A long course list has to shrink to fit instead of being cut off by the format
	let fitScale = $derived(
		height && contentHeight > height - PADDING * 2 ? (height - PADDING * 2) / contentHeight : 1
	);

	let stickerTheme = $derived(config.theme === 'site' ? $themeStore.active : config.theme);
	let isThemeDark = $derived(THEMES.find((t) => t.name === stickerTheme)?.isDark ?? true);
	let hasDarkShadow = $derived(config.ink === 'white' || (config.ink === 'theme' && isThemeDark));
	let shadowColor = $derived(hasDarkShadow ? '0, 0, 0' : '255, 255, 255');

	// 50 is the base shadow, so the slider can go either way from it
	function shadow(alpha: number) {
		return `rgba(${shadowColor}, ${Math.min(1, (alpha * config.shadowStrength) / 50)})`;
	}

	let styleString = $derived(
		[
			`width: ${SHARE_CANVAS_WIDTH}px`,
			height ? `height: ${height}px` : '',
			`padding: ${PADDING}px`,
			`text-align: ${align}`,
			`font-weight: ${TEXT_WEIGHTS[config.textWeight].body}`,
			`--hero-weight: ${TEXT_WEIGHTS[config.textWeight].hero}`,
			// DM Mono stops at 500, so Bold is drawn with a stroke
			config.textWeight === 'bold' ? '-webkit-text-stroke: 0.7px currentColor' : '',
			`color: ${INK_COLORS[config.ink]}`,
			config.shadowStrength > 0
				? `text-shadow: 0 1px 2px ${shadow(0.75)}, 0 2px 10px ${shadow(0.6)}, 0 6px 32px ${shadow(0.5)}`
				: '',
			`--ink-filter: ${config.shadowStrength > 0 ? `drop-shadow(0 2px 6px ${shadow(0.7)})` : 'none'}`,
			config.highlight === 'none' ? '' : '--hero: var(--iris)',
			// A picked theme comes from data-theme, so the site's values must not override it
			...(config.theme === 'site' ? Object.entries(themeStyles).map(([k, v]) => `${k}:${v}`) : [])
		]
			.filter(Boolean)
			.join(';')
	);
</script>

<div
	bind:this={canvasRef}
	style={styleString}
	data-theme={config.theme === 'site' ? undefined : config.theme}
	data-highlight={config.highlight}
	data-align={align}
	class="relative flex flex-col justify-center overflow-hidden font-sans select-none
    {config.background === 'theme' ? 'bg-(--base)' : 'bg-transparent'}"
>
	{#if photo && config.background === 'photo'}
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<img
				src={photo.url}
				alt=""
				class="size-full object-cover"
				style="object-position: {photo.x}% {photo.y}%; transform-origin: {photo.x}% {photo.y}%; transform: scale({photo.zoom /
					100}); filter: brightness({photo.brightness}%) contrast({photo.contrast}%) saturate({photo.saturation}%);"
			/>
		</div>
	{/if}

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
            circle at 15% 85%,
            color-mix(in srgb, var(--pine, var(--subtle)) 12%, transparent) 0%,
            transparent 50%
          );
      "
		></div>
	{/if}

	<div
		bind:clientHeight={contentHeight}
		class="relative shrink-0"
		style="transform: scale({fitScale});"
	>
		<Layout {data} />

		{#if config.showWatermark}
			<div class="mt-7 flex flex-col gap-1 {align === 'center' ? 'items-center' : 'items-start'}">
				<div class="flex items-center gap-2.5">
					<span
						class="rounded-md border-2 border-current p-1"
						style="color: var(--hero, inherit); filter: var(--ink-filter);"
					>
						<Target size={26} />
					</span>
					<span class="text-[34px] leading-none font-medium tracking-tight">Nockr</span>
				</div>
				<span class="text-[20px] opacity-80">nockr.nockr-app.workers.dev</span>
			</div>
		{/if}
	</div>
</div>
