<script lang="ts">
	import type { CourseType, Term } from '$lib/schemas';
	import { CalendarArrowUp, EllipsisVertical, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let {
		type,
		triggerClass,
		moveTargets = [],
		onTypeChange,
		onMove,
		onDelete
	}: {
		type: CourseType;
		triggerClass?: string;
		moveTargets?: Term[];
		onTypeChange: (type: CourseType) => void;
		onMove?: (termId: string) => void;
		onDelete: () => void;
	} = $props();

	const typeOptions: { value: CourseType; label: string; hint: string }[] = [
		{ value: 'graded', label: 'Graded', hint: 'Counts toward GPA and units' },
		{ value: 'non-academic', label: 'Non-academic', hint: 'Pass or fail, not in GPA' },
		{ value: 'credited', label: 'Credited', hint: 'Exempted, not in GPA' }
	];
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class={triggerClass}
				aria-label="Course options"
			>
				<EllipsisVertical size={14} />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-56">
		{#if moveTargets.length > 0}
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>
					<CalendarArrowUp size={14} />
					Move to term
				</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent class="max-h-64 overflow-y-auto">
					{#each moveTargets as term (term.id)}
						<DropdownMenu.Item onclick={() => onMove?.(term.id)}>{term.name}</DropdownMenu.Item>
					{/each}
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>

			<DropdownMenu.Separator />
		{/if}

		<DropdownMenu.Label>Course type</DropdownMenu.Label>
		<DropdownMenu.RadioGroup
			value={type}
			onValueChange={(value) => onTypeChange(value as CourseType)}
		>
			{#each typeOptions as option (option.value)}
				<DropdownMenu.RadioItem value={option.value}>
					<div class="flex flex-col">
						<span>{option.label}</span>
						<span class="text-[10px] text-muted-foreground">{option.hint}</span>
					</div>
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>

		<DropdownMenu.Separator />

		<DropdownMenu.Item variant="destructive" onclick={onDelete}>
			<Trash2 size={14} />
			Delete course
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
