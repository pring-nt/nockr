<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Mail, CodeXml, AtSign, Target, Copy, ExternalLink } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false) }: { open: boolean } = $props();

	async function copyEmail() {
		try {
			await navigator.clipboard.writeText('natetrndd@gmail.com');
			toast.success('Email copied to clipboard');
		} catch {
			toast.error('Failed to copy email');
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		onCloseAutoFocus={(e) => e.preventDefault()}
		class="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden p-4 sm:max-w-lg sm:p-6"
	>
		<Dialog.Header class="space-y-1 text-left">
			<div class="flex items-center gap-2.5">
				<div class="rounded-lg border border-primary/20 bg-primary/10 p-1.5 text-primary">
					<Target size={16} />
				</div>
				<Dialog.Title class="text-lg font-bold sm:text-xl">About Nockr</Dialog.Title>
			</div>
			<Dialog.Description class="text-xs leading-relaxed text-muted-foreground">
				A local-first GPA tracker built for students who actually care about their standing. No
				account, no backend — everything stays on your device.
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-3 flex-1 space-y-3.5 overflow-y-auto pr-1">
			<!-- Contact -->
			<div class="space-y-2">
				<p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Have issues, concerns, or questions? Reach me here.
				</p>
				<div class="space-y-1.5">
					<button
						type="button"
						onclick={copyEmail}
						class="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:border-primary/30 hover:bg-muted/60 sm:py-2.5"
					>
						<span class="flex min-w-0 items-center gap-3">
							<Mail size={16} class="shrink-0 text-muted-foreground" />
							<span class="flex min-w-0 flex-col">
								<span class="text-[10px] text-muted-foreground">Email</span>
								<span class="truncate font-medium text-foreground">natetrndd@gmail.com</span>
							</span>
						</span>
						<span class="ml-2 flex shrink-0 items-center text-xs text-muted-foreground">
							<Copy size={14} />
						</span>
					</button>

					<a
						href="https://github.com/pring-nt"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm transition-colors hover:border-primary/30 hover:bg-muted/60 sm:py-2.5"
					>
						<span class="flex min-w-0 items-center gap-3">
							<CodeXml size={16} class="shrink-0 text-muted-foreground" />
							<span class="flex min-w-0 flex-col">
								<span class="text-[10px] text-muted-foreground">GitHub</span>
								<span class="truncate font-medium text-foreground">pring-nt</span>
							</span>
						</span>
						<span class="ml-2 flex shrink-0 items-center text-xs text-muted-foreground">
							<ExternalLink size={14} />
						</span>
					</a>

					<a
						href="https://www.instagram.com/_nate.pringles/"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm transition-colors hover:border-primary/30 hover:bg-muted/60 sm:py-2.5"
					>
						<span class="flex min-w-0 items-center gap-3">
							<AtSign size={16} class="shrink-0 text-muted-foreground" />
							<span class="flex min-w-0 flex-col">
								<span class="text-[10px] text-muted-foreground">Instagram</span>
								<span class="truncate font-medium text-foreground">_nate.pringles</span>
							</span>
						</span>
						<span class="ml-2 flex shrink-0 items-center text-xs text-muted-foreground">
							<ExternalLink size={14} />
						</span>
					</a>
				</div>
			</div>

			<!-- Disclaimers -->
			<div
				class="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground sm:p-4"
			>
				<p class="leading-relaxed">
					<span class="font-semibold text-foreground">Your data never leaves your device.</span>
					Nockr stores everything locally in your browser. There is no account system, no server, and
					nothing is ever transmitted anywhere. Clearing your browser data will reset the app.
				</p>
				<p class="leading-relaxed">
					<span class="font-semibold text-foreground">Not affiliated with any university.</span>
					Nockr is an independent student project. University presets are approximations — always verify
					your institution's official grading policies.
				</p>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
