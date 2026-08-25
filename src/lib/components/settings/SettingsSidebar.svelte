<!-- src/lib/components/settings/SettingsSidebar.svelte -->
<script lang="ts">
    import * as Sheet from '$lib/components/ui/sheet/index.js';
    import * as Select from '$lib/components/ui/select/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import { Switch } from '$lib/components/ui/switch/index.js';
    import { SlidersHorizontal, Plus, Trash2, Check, Award, GraduationCap, Lock, Copy } from 'lucide-svelte';
    import { appStore } from '$lib/stores/appState';
    import { UNIVERSITY_PRESETS } from '$lib/constants';
    import type { UniversitySettings, HonorTier, UniversityMode } from '$lib/schemas';

    let { open = $bindable(false) }: { open: boolean } = $props();

    let settings = $derived($appStore.universitySettings);
    let isPreset = $derived(settings.mode !== 'custom');
    let selectedTemplate = $state<string>('');

    const presetLabels: Record<string, string> = {
        dlsu: 'DLSU (De La Salle University)',
        up: 'UP (University of the Philippines)',
        ust: 'UST (University of Santo Tomas)',
        admu: 'ADMU (Ateneo de Manila University)'
    };

    let triggerLabel = $derived(
        presetLabels[selectedTemplate] ?? 'Select preset to populate Custom...'
    );

    function selectMode(mode: UniversityMode) {
        appStore.update((state) => {
            if (mode === 'custom') {
                const restoredCustom = state.customSettingsCache ?? {
                    ...state.universitySettings,
                    mode: 'custom'
                };
                return {
                    ...state,
                    universitySettings: { ...restoredCustom, mode: 'custom' }
                };
            }

            const preset = UNIVERSITY_PRESETS[mode];
            const customCache =
                state.universitySettings.mode === 'custom'
                    ? { ...state.universitySettings }
                    : state.customSettingsCache;

            return {
                ...state,
                customSettingsCache: customCache,
                universitySettings: { ...preset }
            };
        });
    }

    function loadPresetToCustom(presetKey: keyof typeof UNIVERSITY_PRESETS) {
        const preset = UNIVERSITY_PRESETS[presetKey];
        if (!preset) return;

        const copiedSettings: UniversitySettings = {
            ...preset,
            mode: 'custom',
            deansListTiers: preset.deansListTiers.map((tier) => ({
                ...tier,
                id: crypto.randomUUID()
            })),
            latinHonorsTiers: preset.latinHonorsTiers.map((tier) => ({
                ...tier,
                id: crypto.randomUUID()
            }))
        };

        appStore.update((state) => ({
            ...state,
            universitySettings: copiedSettings,
            customSettingsCache: copiedSettings
        }));
    }

    function handleTemplateSelect(val: string | undefined) {
        if (val && val in UNIVERSITY_PRESETS) {
            loadPresetToCustom(val as keyof typeof UNIVERSITY_PRESETS);
        }
    }

    function updateSetting<K extends keyof UniversitySettings>(
        key: K,
        value: UniversitySettings[K]
    ) {
        appStore.update((state) => {
            const nextSettings = {
                ...state.universitySettings,
                [key]: value,
                mode: 'custom' as const
            };
            return {
                ...state,
                universitySettings: nextSettings,
                customSettingsCache: nextSettings
            };
        });
    }

    /* Tier CRUD helpers */
    function addTier(target: 'latinHonorsTiers' | 'deansListTiers') {
        const newTier: HonorTier = {
            id: crypto.randomUUID(),
            label: 'New Tier',
            lowerBound: settings.gradeMin,
            upperBound: settings.gradeMax
        };
        updateSetting(target, [...settings[target], newTier]);
    }

    function removeTier(target: 'latinHonorsTiers' | 'deansListTiers', id: string) {
        updateSetting(
            target,
            settings[target].filter((t) => t.id !== id)
        );
    }

    function updateTier(
        target: 'latinHonorsTiers' | 'deansListTiers',
        id: string,
        field: keyof HonorTier,
        value: string | number
    ) {
        const updated = settings[target].map((tier) =>
            tier.id === id ? { ...tier, [field]: value } : tier
        );
        updateSetting(target, updated);
    }

    /* Unfocus numeric parse handlers */
    function commitNumericSetting(
        key: keyof UniversitySettings,
        rawValue: string,
        fallback: number | null
    ) {
        const trimmed = rawValue.trim();
        if (trimmed === '') {
            updateSetting(key, fallback);
            return;
        }
        const parsed = parseFloat(trimmed);
        updateSetting(key, isNaN(parsed) ? fallback : parsed);
    }

    function commitTierBound(
        target: 'latinHonorsTiers' | 'deansListTiers',
        id: string,
        field: 'lowerBound' | 'upperBound',
        rawValue: string,
        fallback: number
    ) {
        const trimmed = rawValue.trim();
        if (trimmed === '') {
            updateTier(target, id, field, fallback);
            return;
        }
        const parsed = parseFloat(trimmed);
        updateTier(target, id, field, isNaN(parsed) ? fallback : parsed);
    }
</script>

<Sheet.Root bind:open>
    <Sheet.Content class="w-full sm:max-w-md p-4 sm:p-6 overflow-y-auto">
        <Sheet.Header class="pb-4 border-b border-border/30">
            <div class="flex items-center gap-2.5">
                <div class="rounded-lg bg-primary/10 p-2 text-primary border border-primary/20">
                    <SlidersHorizontal size={18} />
                </div>
                <div>
                    <Sheet.Title class="text-base font-semibold">University Settings</Sheet.Title>
                    <Sheet.Description class="text-xs">
                        Configure grading scale, Dean's List, and Latin Honors policies.
                    </Sheet.Description>
                </div>
            </div>
        </Sheet.Header>

        <div class="space-y-5 pt-5 text-xs">
            <!-- Preset Selector -->
            <div class="space-y-2.5">
                <Label class="text-xs font-semibold text-foreground">University Preset</Label>

                <div class="space-y-2">
                    <!-- Row 1: DLSU & UP -->
                    <div class="grid grid-cols-2 gap-2">
                        <Button
                                variant={settings.mode === 'dlsu' ? 'default' : 'outline'}
                                size="sm"
                                onclick={() => selectMode('dlsu')}
                                class="text-xs justify-between h-9 px-3"
                        >
                            <span>DLSU</span>
                            {#if settings.mode === 'dlsu'}<Check size={14} />{/if}
                        </Button>

                        <Button
                                variant={settings.mode === 'up' ? 'default' : 'outline'}
                                size="sm"
                                onclick={() => selectMode('up')}
                                class="text-xs justify-between h-9 px-3"
                        >
                            <span>UP</span>
                            {#if settings.mode === 'up'}<Check size={14} />{/if}
                        </Button>
                    </div>

                    <!-- Row 2: UST & ADMU -->
                    <div class="grid grid-cols-2 gap-2">
                        <Button
                                variant={settings.mode === 'ust' ? 'default' : 'outline'}
                                size="sm"
                                onclick={() => selectMode('ust')}
                                class="text-xs justify-between h-9 px-3"
                        >
                            <span>UST</span>
                            {#if settings.mode === 'ust'}<Check size={14} />{/if}
                        </Button>

                        <Button
                                variant={settings.mode === 'admu' ? 'default' : 'outline'}
                                size="sm"
                                onclick={() => selectMode('admu')}
                                class="text-xs justify-between h-9 px-3"
                        >
                            <span>ADMU</span>
                            {#if settings.mode === 'admu'}<Check size={14} />{/if}
                        </Button>
                    </div>

                    <!-- Row 3: Custom -->
                    <Button
                            variant={settings.mode === 'custom' ? 'default' : 'outline'}
                            size="sm"
                            onclick={() => selectMode('custom')}
                            class="w-full text-xs justify-between h-9 px-3"
                    >
                        <span>Custom</span>
                        {#if settings.mode === 'custom'}<Check size={14} />{/if}
                    </Button>
                </div>

                {#if isPreset}
                    <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                        <Lock size={12} class="shrink-0" />
                        <span>Presets are read-only. Select <strong>Custom</strong> to edit.</span>
                    </div>
                {:else}
                    <!-- Custom Template Base Dropdown -->
                    <div class="space-y-1.5 pt-2 border-t border-border/40">
                        <div class="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Copy size={11} />
                            <span>Start from a university template:</span>
                        </div>

                        <Select.Root
                                type="single"
                                bind:value={selectedTemplate}
                                onValueChange={handleTemplateSelect}
                        >
                            <Select.Trigger class="w-full h-8 text-xs bg-background">
                                {triggerLabel}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="dlsu">DLSU (De La Salle University)</Select.Item>
                                <Select.Item value="up">UP (University of the Philippines)</Select.Item>
                                <Select.Item value="ust">UST (University of Santo Tomas)</Select.Item>
                                <Select.Item value="admu">ADMU (Ateneo de Manila University)</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </div>
                {/if}
            </div>

            <!-- Grade Scale & Direction -->
            <div class="space-y-3 rounded-xl bg-muted/30 p-3.5">
                <span class="font-semibold text-foreground">Grading Scale & Direction</span>

                <div class="grid grid-cols-2 gap-2.5">
                    <div class="space-y-1">
                        <Label class="text-[11px] text-muted-foreground">Min Grade</Label>
                        <Input
                                type="number"
                                step="0.1"
                                disabled={isPreset}
                                value={settings.gradeMin}
                                onblur={(e) => commitNumericSetting('gradeMin', e.currentTarget.value, 0)}
                                class="h-8 font-mono text-xs bg-background"
                        />
                    </div>

                    <div class="space-y-1">
                        <Label class="text-[11px] text-muted-foreground">Max Grade</Label>
                        <Input
                                type="number"
                                step="0.1"
                                disabled={isPreset}
                                value={settings.gradeMax}
                                onblur={(e) => commitNumericSetting('gradeMax', e.currentTarget.value, 4.0)}
                                class="h-8 font-mono text-xs bg-background"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                    <div class="space-y-1">
                        <Label class="text-[11px] text-muted-foreground">Failing Grade</Label>
                        <Input
                                type="number"
                                step="0.1"
                                disabled={isPreset}
                                value={settings.failingGrade ?? ''}
                                onblur={(e) => commitNumericSetting('failingGrade', e.currentTarget.value, null)}
                                class="h-8 font-mono text-xs bg-background"
                                placeholder="e.g. 0.0 or 5.0"
                        />
                    </div>

                    <div class="space-y-1">
                        <Label class="text-[11px] text-muted-foreground">Direction</Label>
                        <div class="flex h-9 items-center rounded-lg border border-input bg-muted/40 p-1 gap-1">
                            <button
                                    type="button"
                                    disabled={isPreset}
                                    onclick={() => updateSetting('gradeDirection', 'ascending')}
                                    class="flex-1 h-full text-[11px] font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed {settings.gradeDirection === 'ascending' ? 'bg-background text-primary shadow-xs border border-border/40 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
                            >
                                Ascending
                            </button>
                            <button
                                    type="button"
                                    disabled={isPreset}
                                    onclick={() => updateSetting('gradeDirection', 'descending')}
                                    class="flex-1 h-full text-[11px] font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed {settings.gradeDirection === 'descending' ? 'bg-background text-primary shadow-xs border border-border/40 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
                            >
                                Descending
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dean's List Settings -->
            <div class="space-y-3 rounded-xl bg-muted/30 p-3.5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 font-semibold text-foreground">
                        <GraduationCap size={15} class="text-primary" />
                        <span>Dean's List Rules</span>
                    </div>
                    <Switch
                            disabled={isPreset}
                            checked={settings.deansListEnabled}
                            onCheckedChange={(v) => updateSetting('deansListEnabled', v)}
                    />
                </div>

                {#if settings.deansListEnabled}
                    <div class="space-y-3 pt-2 border-t border-border/30">
                        <div class="space-y-1">
                            <Label class="text-[11px] text-muted-foreground">Label</Label>
                            <Input
                                    type="text"
                                    disabled={isPreset}
                                    value={settings.deansListLabel}
                                    oninput={(e) => updateSetting('deansListLabel', e.currentTarget.value)}
                                    class="h-8 text-xs bg-background"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div class="space-y-1">
                                <Label class="text-[11px] text-muted-foreground">Min Term Units</Label>
                                <Input
                                        type="number"
                                        disabled={isPreset}
                                        value={settings.deansListMinUnits}
                                        onblur={(e) => commitNumericSetting('deansListMinUnits', e.currentTarget.value, 0)}
                                        class="h-8 font-mono text-xs bg-background"
                                />
                            </div>

                            <div class="space-y-1">
                                <Label class="text-[11px] text-muted-foreground">Min Course Grade</Label>
                                <Input
                                        type="number"
                                        step="0.1"
                                        disabled={isPreset}
                                        value={settings.deansListMinCourseGrade ?? ''}
                                        onblur={(e) => commitNumericSetting('deansListMinCourseGrade', e.currentTarget.value, null)}
                                        class="h-8 font-mono text-xs bg-background"
                                        placeholder="None"
                                />
                            </div>
                        </div>

                        <div class="space-y-2 pt-1">
                            <div class="flex items-center justify-between">
                                <Label class="text-[11px] font-medium text-muted-foreground">Dean's List Cutoffs</Label>
                                <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isPreset}
                                        onclick={() => addTier('deansListTiers')}
                                        class="h-6 px-1.5 text-[11px] gap-1 text-primary hover:bg-primary/10"
                                >
                                    <Plus size={11} />
                                    <span>Add Tier</span>
                                </Button>
                            </div>

                            {#each settings.deansListTiers as tier (tier.id)}
                                <div class="flex items-center gap-1.5">
                                    <Input
                                            type="text"
                                            disabled={isPreset}
                                            value={tier.label}
                                            oninput={(e) => updateTier('deansListTiers', tier.id, 'label', e.currentTarget.value)}
                                            class="h-7 text-xs flex-1 bg-background"
                                    />
                                    <Input
                                            type="number"
                                            step="0.01"
                                            disabled={isPreset}
                                            value={tier.lowerBound}
                                            onblur={(e) => commitTierBound('deansListTiers', tier.id, 'lowerBound', e.currentTarget.value, tier.lowerBound)}
                                            class="h-7 w-14 text-xs font-mono text-center px-1 bg-background"
                                    />
                                    <span class="text-muted-foreground text-[10px]">-</span>
                                    <Input
                                            type="number"
                                            step="0.01"
                                            disabled={isPreset}
                                            value={tier.upperBound}
                                            onblur={(e) => commitTierBound('deansListTiers', tier.id, 'upperBound', e.currentTarget.value, tier.upperBound)}
                                            class="h-7 w-14 text-xs font-mono text-center px-1 bg-background"
                                    />
                                    <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isPreset}
                                            onclick={() => removeTier('deansListTiers', tier.id)}
                                            class="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                    >
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Latin Honors Settings -->
            <div class="space-y-3 rounded-xl bg-muted/30 p-3.5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 font-semibold text-foreground">
                        <Award size={15} class="text-primary" />
                        <span>Latin Honors Rules</span>
                    </div>
                    <Switch
                            disabled={isPreset}
                            checked={settings.latinHonorsEnabled}
                            onCheckedChange={(v) => updateSetting('latinHonorsEnabled', v)}
                    />
                </div>

                {#if settings.latinHonorsEnabled}
                    <div class="space-y-3 pt-2 border-t border-border/30">
                        <div class="space-y-1">
                            <Label class="text-[11px] text-muted-foreground">Label</Label>
                            <Input
                                    type="text"
                                    disabled={isPreset}
                                    value={settings.latinHonorsLabel}
                                    oninput={(e) => updateSetting('latinHonorsLabel', e.currentTarget.value)}
                                    class="h-8 text-xs bg-background"
                            />
                        </div>

                        <div class="flex items-center justify-between pt-1">
                            <div class="space-y-0.5">
                                <Label class="text-[11px] text-foreground font-medium">Enforce No-Fail Policy</Label>
                                <p class="text-[10px] text-muted-foreground leading-tight">
                                    Disqualify student if any course matches failing grade ({settings.failingGrade ?? 'N/A'}).
                                </p>
                            </div>
                            <Switch
                                    disabled={isPreset}
                                    checked={settings.latinHonorsNoFailPolicy}
                                    onCheckedChange={(v) => updateSetting('latinHonorsNoFailPolicy', v)}
                            />
                        </div>

                        <div class="space-y-2 pt-1">
                            <div class="flex items-center justify-between">
                                <Label class="text-[11px] font-medium text-muted-foreground">Honors Tiers</Label>
                                <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isPreset}
                                        onclick={() => addTier('latinHonorsTiers')}
                                        class="h-6 px-1.5 text-[11px] gap-1 text-primary hover:bg-primary/10"
                                >
                                    <Plus size={11} />
                                    <span>Add Tier</span>
                                </Button>
                            </div>

                            {#each settings.latinHonorsTiers as tier (tier.id)}
                                <div class="flex items-center gap-1.5">
                                    <Input
                                            type="text"
                                            disabled={isPreset}
                                            value={tier.label}
                                            oninput={(e) => updateTier('latinHonorsTiers', tier.id, 'label', e.currentTarget.value)}
                                            class="h-7 text-xs flex-1 bg-background"
                                    />
                                    <Input
                                            type="number"
                                            step="0.01"
                                            disabled={isPreset}
                                            value={tier.lowerBound}
                                            onblur={(e) => commitTierBound('latinHonorsTiers', tier.id, 'lowerBound', e.currentTarget.value, tier.lowerBound)}
                                            class="h-7 w-14 text-xs font-mono text-center px-1 bg-background"
                                    />
                                    <span class="text-muted-foreground text-[10px]">-</span>
                                    <Input
                                            type="number"
                                            step="0.01"
                                            disabled={isPreset}
                                            value={tier.upperBound}
                                            onblur={(e) => commitTierBound('latinHonorsTiers', tier.id, 'upperBound', e.currentTarget.value, tier.upperBound)}
                                            class="h-7 w-14 text-xs font-mono text-center px-1 bg-background"
                                    />
                                    <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isPreset}
                                            onclick={() => removeTier('latinHonorsTiers', tier.id)}
                                            class="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                    >
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </Sheet.Content>
</Sheet.Root>