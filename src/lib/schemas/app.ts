import { z } from 'zod';
import { TermSchema } from './term';
import { GEItemSchema } from './ge';
import { UniversitySettingsSchema } from './university';

export const UISettingsSchema = z.object({
	cardViewMode: z.enum(['focus', 'grid']).default('focus'),
	gePanelOpen: z.boolean().default(true),
	hasSeenOnboarding: z.boolean().default(false)
});

export const AppStateSchema = z.object({
	terms: z.array(TermSchema).default([]),
	geChecklist: z.array(GEItemSchema).default([]),
	universitySettings: UniversitySettingsSchema.default(() => UniversitySettingsSchema.parse({})),
	customSettingsCache: UniversitySettingsSchema.optional(),
	ui: UISettingsSchema.default(() => UISettingsSchema.parse({})),
	totalProgramUnits: z.number().int().default(165),
	version: z.string().default('1.2.0')
});

export type UISettings = z.infer<typeof UISettingsSchema>;
export type AppState = z.infer<typeof AppStateSchema>;
