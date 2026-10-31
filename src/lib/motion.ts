import { animate, cleanInlineStyles, stagger, waapi, type JSAnimation } from 'animejs';

const ENTER = { opacity: { from: 0 }, translateY: { from: 10 }, duration: 280, ease: 'outCubic' };

/**
 * The `.no-gpu` CSS rule only shortens CSS animations, so anything driven from JS has to ask here.
 * Check this before starting an animation, and jump straight to the end state when it is true.
 */
export function isMotionReduced(): boolean {
	if (typeof window === 'undefined') return true;
	return (
		document.documentElement.classList.contains('no-gpu') ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/** Fades an element up as it mounts */
export function enter(node: HTMLElement) {
	if (isMotionReduced()) return;

	const animation = animate(node, { ...ENTER, onComplete: (self) => cleanInlineStyles(self) });
	return { destroy: () => animation.cancel() };
}

/** Fades an element's children up one after another as it mounts */
export function enterStagger(node: HTMLElement) {
	if (isMotionReduced()) return;

	const animation = animate(node.children, {
		...ENTER,
		delay: stagger(40),
		onComplete: (self) => cleanInlineStyles(self)
	});
	return { destroy: () => animation.cancel() };
}

interface TweenOptions {
	styles: Record<string, string>;
	animateOnMount?: boolean;
}

/** Animates style values whenever they change, such as a panel's width or a progress bar */
export function tween(node: HTMLElement, options: TweenOptions) {
	let current: JSAnimation | undefined;

	function apply(styles: Record<string, string>, shouldAnimate: boolean) {
		current?.cancel();
		if (!shouldAnimate || isMotionReduced()) {
			Object.assign(node.style, styles);
			return;
		}
		current = animate(node, { ...styles, duration: 240, ease: 'outCubic' });
	}

	apply(options.styles, Boolean(options.animateOnMount));

	return {
		update: (next: TweenOptions) => apply(next.styles, true),
		destroy: () => current?.cancel()
	};
}

/** Drifts the aurora blobs. Uses WAAPI so these never-ending loops run off the main thread. */
export function auroraDrift(node: HTMLElement) {
	if (isMotionReduced()) return;

	const [first, second] = Array.from(node.children);
	const shared = { loop: true, alternate: true, ease: 'inOutSine' };

	const animations = [
		waapi.animate(first as HTMLElement, {
			...shared,
			duration: 22000,
			translateX: ['0%', '-8%', '5%', '-3%'],
			translateY: ['0%', '10%', '-6%', '4%'],
			rotate: ['0deg', '110deg', '220deg', '360deg'],
			scale: [1, 1.12, 0.92, 1.05],
			borderRadius: [
				'42% 58% 70% 30% / 45% 45% 55% 55%',
				'70% 30% 46% 54% / 30% 60% 40% 70%',
				'38% 62% 63% 37% / 60% 35% 65% 40%',
				'54% 46% 38% 62% / 50% 58% 42% 50%'
			]
		}),
		waapi.animate(second as HTMLElement, {
			...shared,
			duration: 28000,
			translateX: ['0%', '10%', '-6%', '4%'],
			translateY: ['0%', '-12%', '8%', '-4%'],
			rotate: ['0deg', '-130deg', '-250deg', '-360deg'],
			scale: [1, 1.15, 0.9, 1.08],
			borderRadius: [
				'65% 35% 30% 70% / 55% 30% 70% 45%',
				'35% 65% 60% 40% / 60% 45% 55% 40%',
				'50% 50% 35% 65% / 40% 65% 35% 60%',
				'60% 40% 52% 48% / 45% 52% 48% 55%'
			]
		})
	];

	return {
		destroy() {
			for (const animation of animations) animation.cancel();
		}
	};
}
