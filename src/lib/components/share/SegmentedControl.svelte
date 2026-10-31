<script lang="ts" generics="T extends string">
	import { cn } from '$lib/utils.js';

	let {
		label,
		options,
		value,
		onChange
	}: {
		label: string;
		options: { label: string; value: T }[];
		value: T;
		onChange: (value: T) => void;
	} = $props();
</script>

<div
	role="group"
	aria-label={label}
	class="flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/30 p-1"
>
	{#each options as option (option.value)}
		<button
			type="button"
			aria-pressed={value === option.value}
			onclick={() => onChange(option.value)}
			class={cn(
				'h-8 min-w-0 flex-1 truncate rounded-md px-1.5 text-[11px] font-medium transition-colors md:h-7',
				value === option.value
					? 'bg-background text-foreground shadow-xs'
					: 'text-muted-foreground hover:text-foreground'
			)}
		>
			{option.label}
		</button>
	{/each}
</div>
