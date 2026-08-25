<script lang="ts">
	import { Palette, Plus, Check } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { appStore } from '$lib/stores/appState';
	import type { ThemeName } from '$lib/schemas/theme';

	let customDialogOpen = $state(false);

	const THEMES: { id: ThemeName; label: string }[] = [
		{ id: 'atom-one-dark', label: 'Atom One Dark' },
		{ id: 'gruvbox-dark', label: 'Gruvbox Dark' },
		{ id: 'gruvbox-light', label: 'Gruvbox Light' },
		{ id: 'rose-pine', label: 'Rosé Pine Base' },
		{ id: 'rose-pine-dawn', label: 'Rosé Pine Dawn' },
		{ id: 'catppuccin-mocha', label: 'Catppuccin Mocha' },
		{ id: 'catppuccin-latte', label: 'Catppuccin Latte' },
		{ id: 'nord', label: 'Nord' },
		{ id: 'dracula', label: 'Dracula' },
		{ id: 'tokyo-night', label: 'Tokyo Night' },
		{ id: 'tokyo-light', label: 'Tokyo Light' },
		{ id: 'solarized-dark', label: 'Solarized Dark' },
		{ id: 'solarized-light', label: 'Solarized Light' }
	];

	type CustomColors = {
		base: string;
		surface: string;
		overlay: string;
		mutedColor: string;
		subtle: string;
		text: string;
		love: string;
		gold: string;
		rose: string;
		pine: string;
		foam: string;
		iris: string;
		highlightLow: string;
		highlightMed: string;
		highlightHigh: string;
	};

	let customColors: CustomColors = $state(
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

	type ColorField = {
		id: keyof CustomColors;
		label: string;
		cssVar: string;
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
				{ id: 'base', label: 'Base', cssVar: '--custom-base', desc: 'Main app background' },
				{
					id: 'surface',
					label: 'Surface',
					cssVar: '--custom-surface',
					desc: 'Cards, popovers, modals'
				},
				{
					id: 'overlay',
					label: 'Overlay',
					cssVar: '--custom-overlay',
					desc: 'Muted structural backgrounds'
				}
			]
		},
		{
			title: 'Highlights & Borders',
			fields: [
				{
					id: 'highlightLow',
					label: 'Highlight Low',
					cssVar: '--custom-highlight-low',
					desc: 'Borders and inputs'
				},
				{
					id: 'highlightMed',
					label: 'Highlight Med',
					cssVar: '--custom-highlight-med',
					desc: 'Secondary active states'
				},
				{
					id: 'highlightHigh',
					label: 'Highlight High',
					cssVar: '--custom-highlight-high',
					desc: 'Hover states'
				}
			]
		},
		{
			title: 'Typography',
			fields: [
				{ id: 'text', label: 'Text', cssVar: '--custom-text', desc: 'Primary foreground text' },
				{ id: 'subtle', label: 'Subtle', cssVar: '--custom-subtle', desc: 'Muted foreground text' },
				{
					id: 'mutedColor',
					label: 'Muted',
					cssVar: '--custom-muted-color',
					desc: 'Disabled or faint text'
				}
			]
		},
		{
			title: 'Accents & Brand',
			fields: [
				{
					id: 'iris',
					label: 'Iris (Primary)',
					cssVar: '--custom-iris',
					desc: 'Primary brand, rings, aurora center'
				},
				{
					id: 'rose',
					label: 'Rose (Accent)',
					cssVar: '--custom-rose',
					desc: 'Accent color, secondary aurora glow'
				},
				{ id: 'foam', label: 'Foam', cssVar: '--custom-foam', desc: 'Tertiary aurora gradient' },
				{ id: 'love', label: 'Love', cssVar: '--custom-love', desc: 'Destructive / Error states' },
				{ id: 'gold', label: 'Gold', cssVar: '--custom-gold', desc: 'Warning / Highlight states' },
				{ id: 'pine', label: 'Pine', cssVar: '--custom-pine', desc: 'Success / Info states' }
			]
		}
	];

	function selectPreset(themeId: ThemeName) {
		$appStore.theme = {
			...$appStore.theme,
			active: themeId
		};
	}

	function applyCustomTheme() {
		$appStore.theme = {
			active: 'custom',
			custom: { ...customColors }
		};

		const root = document.documentElement;
		colorGroups.forEach((group) => {
			group.fields.forEach((field) => {
				root.style.setProperty(field.cssVar, customColors[field.id]);
			});
		});

		customDialogOpen = false;
	}
</script>

<Dialog.Root bind:open={customDialogOpen}>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon"
					class="h-9 w-9 text-muted-foreground hover:text-foreground"
				>
					<Palette size={18} />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-48">
			<DropdownMenu.Label>Presets</DropdownMenu.Label>
			<DropdownMenu.Separator />

			{#each THEMES as theme (theme.id)}
				<DropdownMenu.Item
					onclick={() => selectPreset(theme.id)}
					class={$appStore.theme.active === theme.id
						? 'bg-primary/10 font-medium text-primary'
						: ''}
				>
					<div class="flex w-full items-center justify-between">
						{theme.label}
						{#if $appStore.theme.active === theme.id}
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

	<Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-150">
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
			<Button variant="outline" onclick={() => (customDialogOpen = false)}>Cancel</Button>
			<Button onclick={applyCustomTheme}>Apply Custom Theme</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
