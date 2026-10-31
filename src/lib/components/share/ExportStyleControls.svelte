<script lang="ts">
	import type {
		ShareConfig,
		ShareFormat,
		ShareHighlight,
		ShareInk,
		ShareLayoutOptions,
		ShareTextWeight
	} from '$lib/schemas';
	import type { PreviewBackdrop } from '$lib/constants';
	import { loadPhoto, PHOTO_DEFAULTS, type SharePhoto } from '$lib/logic/share';
	import { shareStore } from '$lib/stores/shareState';
	import { THEMES } from '$lib/themes';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import ExportPhotoControls from './ExportPhotoControls.svelte';
	import SegmentedControl from './SegmentedControl.svelte';
	import ShareControlLabel from './ShareControlLabel.svelte';
	import ShareSlider from './ShareSlider.svelte';

	const inkOptions: { label: string; value: ShareInk }[] = [
		{ label: 'White', value: 'white' },
		{ label: 'Black', value: 'black' },
		{ label: 'Theme', value: 'theme' }
	];
	const alignOptions: { label: string; value: ShareLayoutOptions['align'] }[] = [
		{ label: 'Left', value: 'left' },
		{ label: 'Centered', value: 'center' }
	];
	const highlightOptions: { label: string; value: ShareHighlight }[] = [
		{ label: 'None', value: 'none' },
		{ label: 'Accent', value: 'accent' },
		{ label: 'Gradient', value: 'gradient' }
	];
	const stickerThemes = THEMES.filter((theme) => theme.name !== 'custom');
	const formatOptions: { label: string; value: ShareFormat }[] = [
		{ label: 'Sticker', value: 'sticker' },
		{ label: '9:16', value: '9:16' },
		{ label: '3:4', value: '3:4' },
		{ label: '1:1', value: '1:1' }
	];
	const backgroundOptions: { label: string; value: ShareConfig['background'] }[] = [
		{ label: 'Transparent', value: 'transparent' },
		{ label: 'Theme', value: 'theme' },
		{ label: 'Photo', value: 'photo' }
	];
	const backdropOptions: { label: string; value: PreviewBackdrop }[] = [
		{ label: 'Dark', value: 'dark' },
		{ label: 'Light', value: 'light' },
		{ label: 'Checker', value: 'checker' }
	];
	const textWeightOptions: { label: string; value: ShareTextWeight }[] = [
		{ label: 'Light', value: 'light' },
		{ label: 'Regular', value: 'regular' },
		{ label: 'Medium', value: 'medium' },
		{ label: 'Bold', value: 'bold' }
	];

	let {
		photo = $bindable(),
		backdrop = $bindable()
	}: {
		photo: SharePhoto | null;
		backdrop: PreviewBackdrop;
	} = $props();

	let photoInputEl = $state<HTMLInputElement | undefined>();

	let config = $derived($shareStore);
	let options = $derived(config.layouts[config.layout]);
	let background = $derived(
		config.background === 'photo' && !photo ? 'transparent' : config.background
	);

	let stickerThemeLabel = $derived(
		stickerThemes.find((theme) => theme.name === config.theme)?.label ?? 'Same as site'
	);

	function setBackground(value: ShareConfig['background']) {
		if (value === 'photo' && !photo) {
			photoInputEl?.click();
			return;
		}
		// A crop to the text would throw away most of the photo
		const format = value === 'photo' && config.format === 'sticker' ? '9:16' : config.format;
		shareStore.setConfig({ background: value, format });
	}

	async function handlePhoto(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;

		try {
			const url = await loadPhoto(file);
			if (photo) URL.revokeObjectURL(photo.url);
			photo = { url, ...PHOTO_DEFAULTS };
			setBackground('photo');
		} catch (err) {
			console.error('Photo failed to load:', err);
			toast.error('That photo could not be opened');
		}
	}
</script>

<!-- Look of the exported image -->
<div class="space-y-3 border-t border-border/50 pt-4">
	<div>
		<ShareControlLabel text="Text color" />
		<SegmentedControl
			label="Text color"
			options={inkOptions}
			value={config.ink}
			onChange={(ink) => shareStore.setConfig({ ink })}
		/>
	</div>

	<div>
		<ShareControlLabel text="Text thickness" />
		<SegmentedControl
			label="Text thickness"
			options={textWeightOptions}
			value={config.textWeight}
			onChange={(textWeight) => shareStore.setConfig({ textWeight })}
		/>
	</div>

	<div>
		<ShareControlLabel text="Highlight" />
		<SegmentedControl
			label="Highlight"
			options={highlightOptions}
			value={config.highlight}
			onChange={(highlight) => shareStore.setConfig({ highlight })}
		/>
	</div>

	<div>
		<ShareControlLabel text="Text alignment" />
		<SegmentedControl
			label="Text alignment"
			options={alignOptions}
			value={options.align}
			onChange={(align) => shareStore.setOptions({ align })}
		/>
	</div>

	<div>
		<ShareControlLabel text="Sticker theme" />
		<Select.Root
			type="single"
			value={config.theme}
			onValueChange={(theme) => shareStore.setConfig({ theme: theme as ShareConfig['theme'] })}
		>
			<Select.Trigger
				aria-label="Sticker theme"
				class="w-full border-none bg-(--highlight-low) text-xs shadow-none hover:bg-(--highlight-med)"
			>
				{stickerThemeLabel}
			</Select.Trigger>
			<Select.Content class="max-h-72">
				<Select.Item value="site" label="Same as site">Same as site</Select.Item>
				{#each stickerThemes as theme (theme.name)}
					<Select.Item value={theme.name} label={theme.label}>{theme.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<ShareSlider
		label="Text shadow"
		value={config.shadowStrength}
		min={0}
		max={100}
		onChange={(shadowStrength) => shareStore.setConfig({ shadowStrength })}
	/>

	<div>
		<ShareControlLabel text="Format" />
		<SegmentedControl
			label="Format"
			options={formatOptions}
			value={config.format}
			onChange={(format) => shareStore.setConfig({ format })}
		/>
	</div>

	<div>
		<ShareControlLabel text="Background" />
		<SegmentedControl
			label="Background"
			options={backgroundOptions}
			value={background}
			onChange={setBackground}
		/>
		<input
			bind:this={photoInputEl}
			type="file"
			accept="image/*"
			aria-label="Choose a photo"
			class="hidden"
			onchange={handlePhoto}
		/>
	</div>

	{#if photo && background === 'photo'}
		<ExportPhotoControls bind:photo onChangePhoto={() => photoInputEl?.click()} />
	{/if}
</div>

{#if background === 'transparent'}
	<div class="border-t border-border/50 pt-4">
		<ShareControlLabel text="Preview on" />
		<SegmentedControl
			label="Preview backdrop"
			options={backdropOptions}
			value={backdrop}
			onChange={(value) => (backdrop = value)}
		/>
	</div>
{/if}
