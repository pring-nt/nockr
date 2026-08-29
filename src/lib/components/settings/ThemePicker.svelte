<script lang="ts">
	import { Palette, Plus, Check, Download, Upload } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { appStore } from '$lib/stores/appState';
	import { THEMES } from '$lib/themes';
	import type { ThemeName, CustomTheme } from '$lib/schemas';

	let customDialogOpen = $state(false);

	// Filter out 'custom' since it is rendered separately at the bottom of the dropdown
	const presetThemes = THEMES.filter((theme) => theme.name !== 'custom');

	let customColors: CustomTheme = $state(
		$appStore.theme.custom ?? {
			base: '#191724',
			surface: '#1f1d2e',
			overlay: '#26233a',
			mutedColor: '#6e6a86',
			subtle: '#908caa',
			text: '#e0def4',
			love: '#eb6f92',
			gold: '#f6c177',
			rose: '#ebbcba',
			pine: '#31748f',
			foam: '#9ccfd8',
			iris: '#c4a7e7',
			highlightLow: '#21202e',
			highlightMed: '#403d52',
			highlightHigh: '#524f67'
		}
	);

	const CSS_VAR_MAP: Record<keyof CustomTheme, string> = {
		base: '--base',
		surface: '--surface',
		overlay: '--overlay',
		mutedColor: '--muted-color',
		subtle: '--subtle',
		text: '--text',
		love: '--love',
		gold: '--gold',
		rose: '--rose',
		pine: '--pine',
		foam: '--foam',
		iris: '--iris',
		highlightLow: '--highlight-low',
		highlightMed: '--highlight-med',
		highlightHigh: '--highlight-high'
	};

	type ColorField = {
		id: keyof CustomTheme;
		label: string;
		desc: string;
	};

	type ColorGroup = {
		title: string;
		fields: ColorField[];
	};

	const colorGroups: ColorGroup[] = [
		{
			title: 'Backgrounds & Surfaces',
			fields: [
				{ id: 'base', label: 'Base', desc: 'Main app background' },
				{ id: 'surface', label: 'Surface', desc: 'Cards, popovers, modals' },
				{ id: 'overlay', label: 'Overlay', desc: 'Muted structural backgrounds' }
			]
		},
		{
			title: 'Highlights & Borders',
			fields: [
				{ id: 'highlightLow', label: 'Highlight Low', desc: 'Borders and inputs' },
				{ id: 'highlightMed', label: 'Highlight Med', desc: 'Secondary active states' },
				{ id: 'highlightHigh', label: 'Highlight High', desc: 'Hover states' }
			]
		},
		{
			title: 'Typography',
			fields: [
				{ id: 'text', label: 'Text', desc: 'Primary foreground text' },
				{ id: 'subtle', label: 'Subtle', desc: 'Muted foreground text' },
				{ id: 'mutedColor', label: 'Muted', desc: 'Disabled or faint text' }
			]
		},
		{
			title: 'Accents & Brand',
			fields: [
				{ id: 'iris', label: 'Iris (Primary)', desc: 'Primary brand, rings, aurora center' },
				{ id: 'rose', label: 'Rose (Accent)', desc: 'Accent color, secondary aurora glow' },
				{ id: 'foam', label: 'Foam', desc: 'Tertiary aurora gradient' },
				{ id: 'love', label: 'Love', desc: 'Destructive / Error states' },
				{ id: 'gold', label: 'Gold', desc: 'Warning / Highlight states' },
				{ id: 'pine', label: 'Pine', desc: 'Success / Info states' }
			]
		}
	];

	function selectPreset(themeName: ThemeName) {
		$appStore.theme = {
			...$appStore.theme,
			active: themeName
		};
	}

	function applyCustomTheme() {
		$appStore.theme = {
			active: 'custom',
			custom: { ...customColors }
		};
		customDialogOpen = false;
	}

	const CSS_VAR_REVERSE_MAP = Object.fromEntries(
		Object.entries(CSS_VAR_MAP).map(([key, varName]) => [varName, key as keyof CustomTheme])
	);

	let fileInputEl: HTMLInputElement;

	function exportThemeCSS() {
		const vars = (Object.entries(CSS_VAR_MAP) as [keyof CustomTheme, string][])
			.map(([key, varName]) => `  ${varName}: ${customColors[key]};`)
			.join('\n');

		const css = `[data-theme="custom"] {\n${vars}\n}`;
		const blob = new Blob([css], { type: 'text/css' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'nockr-theme.css';
		a.click();
		URL.revokeObjectURL(url);
	}

	function importThemeCSS(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const css = e.target?.result as string;
			// Matches lines like:  --base: #191724;
			const varRegex = /(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})/g;
			let match;
			while ((match = varRegex.exec(css)) !== null) {
				const key = CSS_VAR_REVERSE_MAP[match[1]];
				if (key) customColors[key] = match[2];
			}
		};
		reader.readAsText(file);
		// Reset so the same file can be re-imported if needed
		(event.target as HTMLInputElement).value = '';
	}
</script>

<Dialog.Root bind:open={customDialogOpen}>
	<DropdownMenu.Root>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props: tooltipProps })}
					<DropdownMenu.Trigger>
						{#snippet child({ props: menuProps })}
							<Button
								{...tooltipProps}
								{...menuProps}
								variant="ghost"
								size="icon"
								aria-label="Select theme"
								class="h-9 w-9 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
							>
								<Palette size={18} class="transition-transform duration-200 hover:rotate-12" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="bottom">
				<p>Theme options</p>
			</Tooltip.Content>
		</Tooltip.Root>

		<DropdownMenu.Content align="end" class="w-48">
			<DropdownMenu.Label>Presets</DropdownMenu.Label>
			<DropdownMenu.Separator />

			{#each presetThemes as theme (theme.name)}
				<DropdownMenu.Item
					onclick={() => selectPreset(theme.name)}
					class={$appStore.theme.active === theme.name
						? 'bg-primary/10 font-medium text-primary'
						: ''}
				>
					<div class="flex w-full items-center justify-between">
						{theme.label}
						{#if $appStore.theme.active === theme.name}
							<Check size={14} />
						{/if}
					</div>
				</DropdownMenu.Item>
			{/each}

			<DropdownMenu.Separator />

			<DropdownMenu.Item
				onclick={() => (customDialogOpen = true)}
				class={$appStore.theme.active === 'custom' ? 'bg-primary/10 font-medium text-primary' : ''}
			>
				<div class="flex w-full items-center justify-between">
					<div class="flex items-center">
						<Plus size={14} class="mr-2" />
						Custom Theme
					</div>
					{#if $appStore.theme.active === 'custom'}
						<Check size={14} />
					{/if}
				</div>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Dialog.Content
		onCloseAutoFocus={(e) => e.preventDefault()}
		class="max-h-[85vh] overflow-y-auto sm:max-w-150"
	>
		<Dialog.Header>
			<Dialog.Title>Build Custom Theme</Dialog.Title>
			<Dialog.Description>
				Define your exact 15-color palette. These map directly to the app's aesthetic tokens.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid grid-cols-1 gap-x-8 gap-y-6 py-4 md:grid-cols-2">
			{#each colorGroups as group (group.title)}
				<div class="space-y-4">
					<h4 class="border-b border-border pb-1 text-sm font-semibold text-foreground">
						{group.title}
					</h4>
					<div class="space-y-3">
						{#each group.fields as field (field.id)}
							<div class="flex items-center justify-between gap-3">
								<div class="space-y-0.5">
									<Label for={field.id} class="text-xs">{field.label}</Label>
									<p class="max-w-30 text-[10px] leading-tight text-muted-foreground">
										{field.desc}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<div
										class="relative h-7 w-8 shrink-0 overflow-hidden rounded border border-border"
									>
										<input
											type="color"
											id={field.id}
											bind:value={customColors[field.id]}
											class="absolute -top-2 -left-2 h-12 w-12 cursor-pointer border-0 p-0"
										/>
									</div>
									<Input
										bind:value={customColors[field.id]}
										class="h-7 w-20 px-2 font-mono text-[10px] uppercase"
									/>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<Dialog.Footer class="border-t border-border pt-4">
			<!-- Hidden file input triggered by the Import button -->
			<input
				bind:this={fileInputEl}
				type="file"
				accept=".css"
				class="hidden"
				onchange={importThemeCSS}
			/>

			<!-- Left side: import / export -->
			<div class="flex flex-1 gap-2">
				<Button variant="outline" size="sm" onclick={() => fileInputEl.click()}>
					<Upload size={14} class="mr-1.5" />
					Import
				</Button>
				<Button variant="outline" size="sm" onclick={exportThemeCSS}>
					<Download size={14} class="mr-1.5" />
					Export
				</Button>
			</div>

			<!-- Right side: cancel / apply -->
			<div class="flex gap-2">
				<Button variant="outline" onclick={() => (customDialogOpen = false)}>Cancel</Button>
				<Button onclick={applyCustomTheme}>Apply Custom Theme</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
