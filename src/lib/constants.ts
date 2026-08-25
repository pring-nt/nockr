// src/lib/constants.ts
import type { UniversitySettings } from '$lib/schemas';

// GE Checklist

export const DEFAULT_GE_LIST = [
	{ id: 'LCFILIA', label: 'LCFILIA' },
	{ id: 'LCFILIB', label: 'LCFILIB' },
	{ id: 'LCENWRD', label: 'LCENWRD' },
	{ id: 'LCASEAN', label: 'LCASEAN' },
	{ id: 'LCFAITH', label: 'LCFAITH' },
	{ id: 'GEPCOMM', label: 'GEPCOMM' },
	{ id: 'GEUSELF', label: 'GEUSELF' },
	{ id: 'GERPHIS', label: 'GERPHIS' },
	{ id: 'GEETHIC', label: 'GEETHIC' },
	{ id: 'GESTSOC', label: 'GESTSOC' },
	{ id: 'GERIZAL', label: 'GERIZAL' },
	{ id: 'GEWORLD', label: 'GEWORLD' },
	{ id: 'GEARTAP', label: 'GEARTAP' },
	{ id: 'GEMATMW', label: 'GEMATMW' },
	{ id: 'GELITPH', label: 'GELITPH' }
] as const;

export const DLSU_PRESET: UniversitySettings = {
	mode: 'dlsu',
	gradeDirection: 'ascending',
	gradeMin: 0,
	gradeMax: 4,
	failingGrade: 0.0,
	deansListEnabled: true,
	deansListLabel: "Dean's List",
	deansListMinUnits: 12, // DLSU requires 12 units
	deansListMinCourseGrade: 2.0, // DLSU disqualifies if below 2.0
	deansListTiers: [
		{ id: crypto.randomUUID(), label: 'First Honors', lowerBound: 3.4, upperBound: 4.0 },
		{ id: crypto.randomUUID(), label: 'Second Honors', lowerBound: 3.0, upperBound: 3.399 }
	],
	latinHonorsEnabled: true,
	latinHonorsLabel: 'Latin Honors',
	latinHonorsTiers: [
		{ id: crypto.randomUUID(), label: 'Summa Cum Laude', lowerBound: 3.8, upperBound: 4.0 },
		{ id: crypto.randomUUID(), label: 'Magna Cum Laude', lowerBound: 3.6, upperBound: 3.799 },
		{ id: crypto.randomUUID(), label: 'Cum Laude', lowerBound: 3.4, upperBound: 3.599 },
		{ id: crypto.randomUUID(), label: 'Honorable Mention', lowerBound: 3.2, upperBound: 3.399 }
	],
	latinHonorsNoFailPolicy: true
};

export const UP_PRESET: UniversitySettings = {
	mode: 'up',
	gradeDirection: 'descending',
	gradeMin: 1.0,
	gradeMax: 5.0,
	failingGrade: 5.0,
	deansListEnabled: true,
	deansListLabel: "Dean's List",
	deansListMinUnits: 15,
	deansListMinCourseGrade: 3.0,
	deansListTiers: [
		{ id: crypto.randomUUID(), label: 'University Scholar', lowerBound: 1.0, upperBound: 1.45 },
		{ id: crypto.randomUUID(), label: 'College Scholar', lowerBound: 1.46, upperBound: 1.75 }
	],
	latinHonorsEnabled: true,
	latinHonorsLabel: 'Latin Honors',
	latinHonorsTiers: [
		{ id: crypto.randomUUID(), label: 'Summa Cum Laude', lowerBound: 1.0, upperBound: 1.25 },
		{ id: crypto.randomUUID(), label: 'Magna Cum Laude', lowerBound: 1.26, upperBound: 1.5 },
		{ id: crypto.randomUUID(), label: 'Cum Laude', lowerBound: 1.51, upperBound: 1.75 }
	],
	latinHonorsNoFailPolicy: false
};

export const UST_PRESET: UniversitySettings = {
	mode: 'ust',
	gradeDirection: 'descending',
	gradeMin: 1.0,
	gradeMax: 5.0,
	failingGrade: 5.0,
	deansListEnabled: true,
	deansListLabel: "Dean's List",
	deansListMinUnits: 15,
	deansListMinCourseGrade: 3.0,
	deansListTiers: [
		{ id: crypto.randomUUID(), label: "Dean's Lister", lowerBound: 1.0, upperBound: 1.75 }
	],
	latinHonorsEnabled: true,
	latinHonorsLabel: 'Latin Honors',
	latinHonorsTiers: [
		{ id: crypto.randomUUID(), label: 'Summa Cum Laude', lowerBound: 1.0, upperBound: 1.2 },
		{ id: crypto.randomUUID(), label: 'Magna Cum Laude', lowerBound: 1.21, upperBound: 1.45 },
		{ id: crypto.randomUUID(), label: 'Cum Laude', lowerBound: 1.46, upperBound: 1.75 }
	],
	latinHonorsNoFailPolicy: true
};

export const ADMU_PRESET: UniversitySettings = {
	mode: 'admu',
	gradeDirection: 'ascending',
	gradeMin: 0.0,
	gradeMax: 4.0,
	failingGrade: 0.0,
	deansListEnabled: true,
	deansListLabel: "Dean's List",
	deansListMinUnits: 15,
	deansListMinCourseGrade: 1.0, // Set to 1.0 (lowest passing grade, 'D')
	deansListTiers: [
		{ id: crypto.randomUUID(), label: 'First Honors', lowerBound: 3.7, upperBound: 4.0 },
		{ id: crypto.randomUUID(), label: 'Second Honors', lowerBound: 3.35, upperBound: 3.699 }
	],
	latinHonorsEnabled: true,
	latinHonorsLabel: 'Latin Honors',
	latinHonorsTiers: [
		{ id: crypto.randomUUID(), label: 'Summa Cum Laude', lowerBound: 3.87, upperBound: 4.0 },
		{ id: crypto.randomUUID(), label: 'Magna Cum Laude', lowerBound: 3.7, upperBound: 3.869 },
		{ id: crypto.randomUUID(), label: 'Cum Laude', lowerBound: 3.5, upperBound: 3.699 },
		{ id: crypto.randomUUID(), label: 'Honorable Mention', lowerBound: 3.35, upperBound: 3.499 }
	],
	latinHonorsNoFailPolicy: true
};

export const UNIVERSITY_PRESETS = {
	dlsu: DLSU_PRESET,
	up: UP_PRESET,
	ust: UST_PRESET,
	admu: ADMU_PRESET
} as const;
