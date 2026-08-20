<script lang="ts">
    import '../routes/layout.css';
    import { appStore } from '$lib/stores/appState';
    import { applyTheme } from '$lib/themes';
    import { onMount } from 'svelte';
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();

    $effect(() => {
        applyTheme($appStore.theme);
    });

    onMount(() => {
        applyTheme($appStore.theme);
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
