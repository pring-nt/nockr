import { z } from 'zod';
import { TermSchema } from './term';
import { ChecklistFilterSchema, ChecklistItemSchema, ChecklistSortSchema } from './checklist';
import { UniversitySettingsSchema } from './university';
import { MAX_PROGRAM_UNITS } from './limits';

export const DEFAULT_PROGRAM_UNITS = 165;

export const UISettingsSchema = z.object({
	cardViewMode: z.enum(['focus', 'grid']).default('focus'),
	checklistPanelOpen: z.boolean().default(true),
	checklistFilter: ChecklistFilterSchema.default('all'),
	checklistSort: ChecklistSortSchema.default('custom'),
	hasSeenOnboarding: z.boolean().default(false),
	hasConfirmedUnits: z.boolean().default(false)
});

export const AppStateSchema = z.object({
	terms: z.array(TermSchema).default([]),
	courseChecklist: z.array(ChecklistItemSchema).default([]),
	universitySettings: UniversitySettingsSchema.default(() => UniversitySettingsSchema.parse({})),
	customSettingsCache: UniversitySettingsSchema.optional(),
	ui: UISettingsSchema.default(() => UISettingsSchema.parse({})),
	totalProgramUnits: z
		.number()
		.int()
		.min(1)
		.max(MAX_PROGRAM_UNITS)
		.default(DEFAULT_PROGRAM_UNITS)
		.catch(DEFAULT_PROGRAM_UNITS),
	version: z.string().default('1.3.0')
});

export type UISettings = z.infer<typeof UISettingsSchema>;
export type AppState = z.infer<typeof AppStateSchema>;
