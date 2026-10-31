<script lang="ts">
	import type { Course, CourseResult } from '$lib/schemas';
	import { cn } from '$lib/utils.js';

	let {
		course,
		id,
		onChange,
		onNavigate
	}: {
		course: Course;
		id?: string;
		onChange: (result: CourseResult) => void;
		onNavigate?: () => void;
	} = $props();

	let passedButton = $state<HTMLButtonElement | null>(null);
	let failedButton = $state<HTMLButtonElement | null>(null);

	function toggle(result: CourseResult) {
		onChange(course.result === result ? 'pending' : result);
	}

	// Mirrors the grade input: Enter moves on and Escape clears. Space keeps its native toggle
	function handleKeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		const key = e.key.toLowerCase();
		if (key === 'enter') {
			e.preventDefault();
			onNavigate?.();
		} else if (key === 'escape') {
			e.preventDefault();
			onChange('pending');
		} else if (key === 'p') {
			onChange('passed');
			passedButton?.focus();
		} else if (key === 'f') {
			onChange('failed');
			failedButton?.focus();
		} else if (key === 'arrowleft') {
			e.preventDefault();
			passedButton?.focus();
		} else if (key === 'arrowright') {
			e.preventDefault();
			failedButton?.focus();
		}
	}
</script>

{#if course.type === 'credited'}
	<p class="pb-0.5 text-center text-xs leading-8 text-muted-foreground sm:leading-normal">
		Credited
	</p>
{:else}
	<div class="grid grid-cols-2 gap-1 pb-0.5" role="group" aria-label="Course result">
		<button
			{id}
			bind:this={passedButton}
			type="button"
			title="Passed"
			aria-label="Passed"
			aria-pressed={course.result === 'passed'}
			onclick={() => toggle('passed')}
			onkeydown={handleKeydown}
			class={cn(
				'h-8 rounded-sm text-xs font-medium transition-colors sm:h-5',
				course.result === 'passed'
					? 'bg-primary/15 text-primary'
					: 'text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground'
			)}
		>
			P
		</button>
		<button
			bind:this={failedButton}
			type="button"
			title="Failed"
			aria-label="Failed"
			aria-pressed={course.result === 'failed'}
			onclick={() => toggle('failed')}
			onkeydown={handleKeydown}
			class={cn(
				'h-8 rounded-sm text-xs font-medium transition-colors sm:h-5',
				course.result === 'failed'
					? 'bg-destructive/15 text-destructive'
					: 'text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground'
			)}
		>
			F
		</button>
	</div>
{/if}
