<script lang="ts">
	import type { Course, GradeDisplayMode } from '$lib/schemas';
	import { maskGrade } from '$lib/logic/share';

	let {
		courses = [],
		gradeDisplay = 'full'
	}: {
		courses: Course[];
		gradeDisplay: GradeDisplayMode;
	} = $props();
</script>

<div
	class="overflow-hidden rounded-3xl border border-border/50 bg-card/90 p-6 shadow-lg backdrop-blur-md"
>
	<table class="w-full text-left">
		<thead>
			<tr class="border-b border-border/40 text-xs tracking-wider text-muted-foreground uppercase">
				<th class="pb-3 font-bold">Course</th>
				<th class="pb-3 text-center font-bold">Units</th>
				{#if gradeDisplay !== 'hidden'}
					<th class="pb-3 text-center font-bold">Grade</th>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-border/30 font-semibold text-foreground">
			{#each courses as course (course.id)}
				<tr>
					<td class="max-w-60 truncate py-3 pr-3 text-base font-bold"
						>{course.name || 'Untitled Course'}</td
					>
					<td class="py-3 text-center font-mono text-base text-muted-foreground">{course.units}</td>
					{#if gradeDisplay !== 'hidden'}
						<td class="py-3 text-center font-mono text-lg font-black text-primary">
							{maskGrade(course.grade, gradeDisplay) ?? '—'}
						</td>
					{/if}
				</tr>
			{/each}
			{#if courses.length === 0}
				<tr>
					<td
						colspan={gradeDisplay === 'hidden' ? 2 : 3}
						class="py-6 text-center text-base text-muted-foreground"
					>
						No courses listed
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
