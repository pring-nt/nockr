<script lang="ts">
	import './layout.css';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { appStore } from '$lib/stores/appState';
	import { applyTheme } from '$lib/themes';
	import Header from '$lib/components/layout/Header.svelte';

	let { children } = $props();

	$effect(() => {
		if ($appStore?.theme) {
			applyTheme($appStore.theme);
		}
	});
</script>

<svelte:head>
	<script>
		(function () {
			try {
				const canvas = document.createElement('canvas');
				const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
				if (!gl) {
					document.documentElement.classList.add('no-gpu');
				} else {
					const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
					if (debugInfo) {
						const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
						const softwareRenderers = [
							'swiftshader',
							'llvmpipe',
							'software',
							'basic render driver',
							'mesa'
						];
						if (softwareRenderers.some((sr) => renderer.includes(sr))) {
							document.documentElement.classList.add('no-gpu');
						}
					}
				}
			} catch (e) {
				document.documentElement.classList.add('no-gpu');
			}

			/* Restore Theme State */
			try {
				const raw = localStorage.getItem('nockr_state');
				if (!raw) return;
				const state = JSON.parse(raw);
				const theme = state?.theme;
				if (!theme?.active) return;

				const root = document.documentElement;
				root.setAttribute('data-theme', theme.active);

				if (theme.active === 'custom' && theme.custom) {
					const vars = {
						base: '--custom-base',
						surface: '--custom-surface',
						overlay: '--custom-overlay',
						mutedColor: '--custom-muted-color',
						subtle: '--custom-subtle',
						text: '--custom-text',
						love: '--custom-love',
						gold: '--custom-gold',
						rose: '--custom-rose',
						pine: '--custom-pine',
						foam: '--custom-foam',
						iris: '--custom-iris',
						highlightLow: '--custom-highlight-low',
						highlightMed: '--custom-highlight-med',
						highlightHigh: '--custom-highlight-high'
					};
					for (const [key, cssVar] of Object.entries(vars)) {
						if (theme.custom[key]) {
							root.style.setProperty(cssVar, theme.custom[key]);
						}
					}
				}
			} catch (e) {}
		})();
	</script>
</svelte:head>

<Tooltip.Provider delayDuration={300} disableHoverableContent>
	<div class="aurora-bg"></div>

	<div class="relative z-0 flex min-h-screen flex-col">
		<Header />

		<main class="w-full flex-1">
			{@render children()}
		</main>
	</div>
</Tooltip.Provider>
