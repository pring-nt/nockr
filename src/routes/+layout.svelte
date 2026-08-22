<script lang="ts">
    import './layout.css';
    import { appStore } from '$lib/stores/appState';
    import { applyTheme } from '$lib/themes';
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();

    $effect(() => {
        if ($appStore?.theme) {
            applyTheme($appStore.theme);
        }
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />

    <script>
        (function() {
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

<div class="aurora-bg"></div>

<main class="relative z-0 min-h-screen">
    {@render children()}
</main>