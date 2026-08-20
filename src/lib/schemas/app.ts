import { z } from 'zod';
import { TermSchema } from './term';
import { GEItemSchema } from './ge';
import { UniversitySettingsSchema } from './university';
import { ThemeSettingsSchema } from './theme';

export const UISettingsSchema = z.object({
	showDeansListBadge: z.boolean().default(true)
});

export const AppStateSchema = z.object({
	terms: z.array(TermSchema).default([]),
	geChecklist: z.array(GEItemSchema).default([]),
	universitySettings: UniversitySettingsSchema.default(() => UniversitySettingsSchema.parse({})),
	theme: ThemeSettingsSchema.default(() => ThemeSettingsSchema.parse({})),
	ui: UISettingsSchema.default(() => UISettingsSchema.parse({})),
	totalProgramUnits: z.number().int().default(165),
	version: z.string().default('1.0.0')
});

export type UISettings = z.infer<typeof UISettingsSchema>;
export type AppState = z.infer<typeof AppStateSchema>;
