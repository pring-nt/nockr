<script lang="ts">
	import type { ShareLayout, ShareMessage, ShareSubject, Term, ValueDisplay } from '$lib/schemas';
	import { getTrend, NOT_EARNED_MESSAGES, type ShareData } from '$lib/logic/share';
	import { appStore } from '$lib/stores/appState';
	import { shareStore } from '$lib/stores/shareState';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import SegmentedControl from './SegmentedControl.svelte';
	import ShareControlLabel from './ShareControlLabel.svelte';

	const layoutOptions: { label: string; value: ShareLayout }[] = [
		{ label: 'Stat stack', value: 'stat-stack' },
		{ label: 'Honors', value: 'honors-headline' },
		{ label: 'Scorecard', value: 'scorecard' }
	];
	const subjectOptions: { label: string; value: ShareSubject }[] = [
		{ label: 'This term', value: 'term' },
		{ label: 'Cumulative', value: 'cumulative' }
	];
	const displayOptions: { label: string; value: ValueDisplay }[] = [
		{ label: 'Full', value: 'full' },
		{ label: 'Masked', value: 'masked' },
		{ label: 'Hidden', value: 'hidden' }
	];

	let {
		data,
		activeTerm,
		latestTerm,
		selectedTermId,
		courseModes = $bindable(),
		onSelectTerm
	}: {
		data: ShareData;
		activeTerm: Term | undefined;
		latestTerm: Term | undefined;
		selectedTermId: string;
		courseModes: Record<string, ValueDisplay>;
		onSelectTerm: (id: string) => void;
	} = $props();

	let config = $derived($shareStore);
	let options = $derived(config.layouts[config.layout]);
	let isTerm = $derived(config.subject === 'term');
	let terms = $derived($appStore.terms ?? []);

	let activeTermLabel = $derived(
		activeTerm
			? `${activeTerm.name}${activeTerm.id === latestTerm?.id ? ' (Latest)' : ''}`
			: 'Select Term'
	);

	let adjustableCourses = $derived(
		(activeTerm?.courses ?? []).filter((c) => c.type === 'graded' || options.showNonAcademic)
	);

	let canShowTrend = $derived(
		getTrend(
			isTerm && activeTerm ? terms.slice(0, terms.indexOf(activeTerm) + 1) : terms,
			$appStore.universitySettings
		).length > 0
	);

	function setAllGrades(mode: ValueDisplay) {
		courseModes = {};
		shareStore.setOptions({ gradeDisplay: mode });
	}
</script>

{#snippet toggle(label: string, checked: boolean, onChange: (value: boolean) => void)}
	<div class="flex items-center justify-between gap-3">
		<span class="text-xs">{label}</span>
		<Switch {checked} onCheckedChange={onChange} aria-label={label} />
	</div>
{/snippet}

<div class="space-y-3">
	<div>
		<ShareControlLabel text="Layout" />
		<SegmentedControl
			label="Layout"
			options={layoutOptions}
			value={config.layout}
			onChange={(layout) => shareStore.setConfig({ layout })}
		/>
	</div>

	<div>
		<ShareControlLabel text="Share" />
		<SegmentedControl
			label="What to share"
			options={subjectOptions}
			value={config.subject}
			onChange={(subject) => shareStore.setConfig({ subject })}
		/>
	</div>

	{#if isTerm && terms.length > 0}
		<Select.Root type="single" value={selectedTermId} onValueChange={onSelectTerm}>
			<Select.Trigger
				aria-label="Term"
				class="w-full border-none bg-(--highlight-low) text-xs shadow-none hover:bg-(--highlight-med)"
			>
				{activeTermLabel}
			</Select.Trigger>
			<Select.Content>
				{#each terms as t (t.id)}
					<Select.Item
						value={t.id}
						label={`${t.name}${t.id === latestTerm?.id ? ' (Latest)' : ''}`}
					>
						{t.name}
						{t.id === latestTerm?.id ? '(Latest)' : ''}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	{/if}
</div>

<!-- What the current layout shows -->
<div class="space-y-3 border-t border-border/50 pt-4">
	<Label class="block font-semibold text-(--subtle)">Show on this layout</Label>

	<div>
		<span class="mb-1.5 block text-xs">{isTerm ? 'Term GPA' : 'Cumulative GPA'}</span>
		<SegmentedControl
			label="GPA display"
			options={displayOptions}
			value={options.gpaDisplay}
			onChange={(gpaDisplay) => shareStore.setOptions({ gpaDisplay })}
		/>
	</div>

	{@render toggle(isTerm ? "Dean's List" : 'Latin Honors', options.showHonors, (showHonors) =>
		shareStore.setOptions({ showHonors })
	)}

	{#if options.showHonors && !data.honorEarned}
		{@render toggle(
			'Show a kind message instead',
			options.showNotEarnedMessage,
			(showNotEarnedMessage) => shareStore.setOptions({ showNotEarnedMessage })
		)}
		{#if options.showNotEarnedMessage}
			<Select.Root
				type="single"
				value={options.notEarnedMessage}
				onValueChange={(value) =>
					shareStore.setOptions({ notEarnedMessage: value as ShareMessage })}
			>
				<Select.Trigger
					aria-label="Kind message"
					class="w-full border-none bg-(--highlight-low) text-xs shadow-none hover:bg-(--highlight-med)"
				>
					{NOT_EARNED_MESSAGES[options.notEarnedMessage]}
				</Select.Trigger>
				<Select.Content>
					{#each Object.entries(NOT_EARNED_MESSAGES) as [value, label] (value)}
						<Select.Item {value} {label}>{label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		{/if}
	{/if}

	{#if isTerm}
		{@render toggle('CGPA', options.showCgpa, (showCgpa) => shareStore.setOptions({ showCgpa }))}
		{@render toggle('Courses', options.showCourses, (showCourses) =>
			shareStore.setOptions({ showCourses })
		)}

		{#if options.showCourses}
			{@render toggle('Non-academic courses', options.showNonAcademic, (showNonAcademic) =>
				shareStore.setOptions({ showNonAcademic })
			)}

			<div>
				<span class="mb-1.5 block text-xs">Course grades</span>
				<SegmentedControl
					label="Course grade display"
					options={displayOptions}
					value={options.gradeDisplay}
					onChange={setAllGrades}
				/>
			</div>

			{#if adjustableCourses.length > 0}
				<details class="group">
					<summary class="cursor-pointer text-xs text-(--subtle) hover:text-(--text)">
						Adjust each course
					</summary>
					<div class="mt-2 space-y-1.5">
						{#each adjustableCourses as course (course.id)}
							<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2">
								<span class="truncate text-xs">{course.name || 'Untitled Course'}</span>
								<SegmentedControl
									label="{course.name || 'Untitled Course'} grade display"
									options={displayOptions}
									value={courseModes[course.id] ?? options.gradeDisplay}
									onChange={(mode) => (courseModes[course.id] = mode)}
								/>
							</div>
						{/each}
					</div>
				</details>
			{/if}
		{/if}
	{/if}

	{#if canShowTrend}
		{@render toggle('Trend line', options.showTrend, (showTrend) =>
			shareStore.setOptions({ showTrend })
		)}
	{:else}
		<div class="flex items-center justify-between gap-3">
			<span class="text-xs">Trend line</span>
			<span class="text-[11px] text-(--subtle)">Needs two graded terms</span>
		</div>
	{/if}
	{@render toggle('Watermark', config.showWatermark, (showWatermark) =>
		shareStore.setConfig({ showWatermark })
	)}
</div>
