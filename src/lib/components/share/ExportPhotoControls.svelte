<script lang="ts">
	import { PHOTO_DEFAULTS, type SharePhoto } from '$lib/logic/share';
	import { Button } from '$lib/components/ui/button';
	import ShareSlider from './ShareSlider.svelte';

	const photoSliders: {
		key: keyof typeof PHOTO_DEFAULTS;
		label: string;
		min: number;
		max: number;
	}[] = [
		{ key: 'zoom', label: 'Zoom', min: 100, max: 300 },
		{ key: 'x', label: 'Horizontal', min: 0, max: 100 },
		{ key: 'y', label: 'Vertical', min: 0, max: 100 },
		{ key: 'brightness', label: 'Brightness', min: 40, max: 160 },
		{ key: 'contrast', label: 'Contrast', min: 50, max: 150 },
		{ key: 'saturation', label: 'Saturation', min: 0, max: 200 }
	];

	let {
		photo = $bindable(),
		onChangePhoto
	}: {
		photo: SharePhoto;
		onChangePhoto: () => void;
	} = $props();

	function resetPhoto() {
		Object.assign(photo, PHOTO_DEFAULTS);
	}
</script>

<div class="space-y-3 rounded-lg bg-muted/30 p-3">
	{#each photoSliders as slider (slider.key)}
		<ShareSlider
			label={slider.label}
			value={photo[slider.key]}
			min={slider.min}
			max={slider.max}
			onChange={(value) => (photo[slider.key] = value)}
		/>
	{/each}

	<div class="flex gap-2 pt-1">
		<Button
			variant="ghost"
			size="sm"
			onclick={onChangePhoto}
			class="h-8 flex-1 bg-(--highlight-low) text-xs hover:bg-(--highlight-med)"
		>
			Change photo
		</Button>
		<Button
			variant="ghost"
			size="sm"
			onclick={resetPhoto}
			class="h-8 flex-1 bg-(--highlight-low) text-xs hover:bg-(--highlight-med)"
		>
			Reset
		</Button>
	</div>

	<p class="text-[11px] text-(--subtle)">Your photo stays on this device and is not saved.</p>
</div>
