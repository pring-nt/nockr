<script lang="ts">
	let {
		label,
		value,
		min,
		max,
		onChange
	}: {
		label: string;
		value: number;
		min: number;
		max: number;
		onChange: (value: number) => void;
	} = $props();

	// Holds what is being typed, since "1" on the way to "150" is out of range for a moment
	let draft = $state<string | null>(null);

	function clamp(next: number) {
		return Math.min(max, Math.max(min, Math.round(next)));
	}

	function handleInput(text: string) {
		draft = text;
		const next = Number(text);
		if (text !== '' && next >= min && next <= max) onChange(Math.round(next));
	}

	function commit() {
		if (draft === null) return;
		if (draft !== '' && Number.isFinite(Number(draft))) onChange(clamp(Number(draft)));
		draft = null;
	}
</script>

<div>
	<div class="flex items-center justify-between gap-3">
		<span class="text-xs">{label}</span>
		<input
			type="number"
			inputmode="numeric"
			aria-label="{label} value"
			{min}
			{max}
			value={draft ?? value}
			oninput={(e) => handleInput(e.currentTarget.value)}
			onblur={commit}
			onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
			class="h-8 w-16 rounded-md border border-input bg-background/40 px-2 text-right font-mono text-xs text-(--text) focus:ring-1 focus:ring-ring focus:outline-none"
		/>
	</div>
	<input
		type="range"
		aria-label={label}
		{min}
		{max}
		{value}
		oninput={(e) => onChange(e.currentTarget.valueAsNumber)}
		class="mt-1 block h-8 w-full accent-(--iris)"
	/>
</div>
