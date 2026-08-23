<script lang="ts">
    import { Button } from '$lib/components/ui/button/index.js';
    import { SlidersHorizontal, Download, Upload, Target } from 'lucide-svelte';
    import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
    import ThemePicker from '$lib/components/settings/ThemePicker.svelte';
    import { appStore } from '$lib/stores/appState';

    let settingsOpen = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);

    function exportState() {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify($appStore, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `nockr-backup-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    function importState(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target?.result as string);
                appStore.set(parsed);
            } catch {
                alert('Invalid JSON backup file.');
            }
        };
        reader.readAsText(file);
    }
</script>

<header class="sticky top-0 z-30 w-full border-b border-border/40 bg-background/50 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
    <!-- Nockr Brand & Mode Tag -->
    <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Target size={18} />
        </div>
        <div class="flex items-center gap-2">
            <span class="font-semibold text-lg tracking-tight gradient-text leading-none">Nockr</span>
            <span class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider rounded-md bg-muted/40 px-1.5 py-0.5 border border-border/40">
        {$appStore.universitySettings.mode}
      </span>
        </div>
    </div>

    <!-- Quick Action Controls -->
    <div class="flex items-center gap-1 sm:gap-2">
        <ThemePicker />

        <!-- Backup Export -->
        <Button
                variant="ghost"
                size="icon"
                onclick={exportState}
                class="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Export Backup (JSON)"
        >
            <Download size={16} />
        </Button>

        <!-- Backup Import -->
        <input
                bind:this={fileInput}
                type="file"
                accept=".json"
                class="hidden"
                onchange={importState}
        />
        <Button
                variant="ghost"
                size="icon"
                onclick={() => fileInput?.click()}
                class="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Import Backup (JSON)"
        >
            <Upload size={16} />
        </Button>

        <div class="h-4 w-px bg-border/60 mx-0.5"></div>

        <!-- Settings Drawer Trigger -->
        <Button
                variant="outline"
                size="sm"
                onclick={() => (settingsOpen = true)}
                class="h-8 gap-1.5 text-xs border-border/60 bg-background/50 hover:bg-muted/50"
        >
            <SlidersHorizontal size={14} />
            <span class="hidden sm:inline font-medium">Settings</span>
        </Button>
    </div>
</header>

<SettingsSidebar bind:open={settingsOpen} />