<script lang="ts">
	import DataSettings from '$lib/components/settings/DataSettings.svelte';
	import ThemeSettings from '$lib/components/settings/ThemeSettings.svelte';
	import UniversitySettingsForm from '$lib/components/settings/UniversitySettingsForm.svelte';
	import { Database, GraduationCap, Palette } from 'lucide-svelte';

	const sections = [
		{ id: 'appearance', label: 'Appearance', icon: Palette },
		{ id: 'university', label: 'University', icon: GraduationCap },
		{ id: 'data', label: 'Data', icon: Database }
	];
</script>

<svelte:head>
	<title>Settings — Nockr</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
	<header class="mb-6">
		<h1 class="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>
		<p class="mt-1 text-xs text-muted-foreground">
			Choose a theme, set your university's grading rules, and manage your data.
		</p>
	</header>

	<div class="lg:grid lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-8">
		<nav
			aria-label="Settings sections"
			class="mb-5 flex gap-1 overflow-x-auto lg:sticky lg:top-6 lg:mb-0 lg:flex-col lg:self-start"
		>
			{#each sections as section (section.id)}
				<a
					href="#{section.id}"
					class="flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
				>
					<section.icon size={14} />
					{section.label}
				</a>
			{/each}
		</nav>

		<div class="min-w-0 space-y-4 sm:space-y-6">
			<section id="appearance" class="glass scroll-mt-6 space-y-4 rounded-xl p-4 sm:p-6">
				<h2 class="text-base font-semibold text-foreground">Appearance</h2>
				<ThemeSettings />
			</section>

			<section id="university" class="glass scroll-mt-6 space-y-4 rounded-xl p-4 sm:p-6">
				<h2 class="text-base font-semibold text-foreground">University</h2>
				<UniversitySettingsForm />
			</section>

			<section id="data" class="glass scroll-mt-6 space-y-4 rounded-xl p-4 sm:p-6">
				<h2 class="text-base font-semibold text-foreground">Data and Backup</h2>
				<DataSettings />
			</section>
		</div>
	</div>
</div>
