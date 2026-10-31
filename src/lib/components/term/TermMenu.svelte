<script lang="ts">
	import { resolve } from '$app/paths';
	import { EllipsisVertical, Pencil, Share2, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';

	let {
		termId,
		termName,
		triggerClass,
		onRename,
		onDelete
	}: {
		termId: string;
		termName: string;
		triggerClass?: string;
		onRename: () => void;
		onDelete: () => void;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class={cn('shrink-0 text-muted-foreground hover:text-foreground', triggerClass)}
				aria-label="Options for {termName}"
			>
				<EllipsisVertical size={15} />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<!-- Rename focuses an input, so the menu must not hand focus back to its trigger on close -->
	<DropdownMenu.Content align="end" class="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
		<DropdownMenu.Item onclick={onRename}>
			<Pencil size={14} />
			Rename
		</DropdownMenu.Item>

		<DropdownMenu.Item>
			{#snippet child({ props })}
				<a {...props} href="{resolve('/export')}?termId={termId}">
					<Share2 size={14} />
					Export card
				</a>
			{/snippet}
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<DropdownMenu.Item variant="destructive" onclick={onDelete}>
			<Trash2 size={14} />
			Delete term
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
