<script lang="ts">
	import { resolve } from '$app/paths';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { EllipsisVertical, Share2, CircleQuestionMark, Info } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';

	let {
		onGettingStarted,
		onAbout
	}: {
		onGettingStarted: () => void;
		onAbout: () => void;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				aria-label="More options"
				class="h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
			>
				<EllipsisVertical size={16} />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-52">
		<DropdownMenu.Item>
			{#snippet child({ props })}
				<a
					{...props}
					href={resolve('/export')}
					class={cn(String(props.class ?? ''), 'flex cursor-pointer items-center gap-2.5 text-xs')}
				>
					<Share2 size={14} class="text-muted-foreground" />
					<span>Export Card</span>
				</a>
			{/snippet}
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<DropdownMenu.Item
			onclick={onGettingStarted}
			class="flex cursor-pointer items-center gap-2.5 text-xs"
		>
			<CircleQuestionMark size={14} class="text-muted-foreground" />
			<span>Getting Started</span>
		</DropdownMenu.Item>

		<DropdownMenu.Item onclick={onAbout} class="flex cursor-pointer items-center gap-2.5 text-xs">
			<Info size={14} class="text-muted-foreground" />
			<span>About Nockr</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
