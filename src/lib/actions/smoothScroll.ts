export interface SmoothScrollController {
	scrollTo: (position: number) => void;
}

export function smoothScroll(
	node: HTMLElement,
	onReady?: (controller: SmoothScrollController) => void
) {
	let targetScrollLeft = node.scrollLeft;
	let animationFrameId: number | null = null;
	let lastTime: number | null = null;

	function getMaxScroll(): number {
		return Math.max(0, node.scrollWidth - node.clientWidth);
	}

	function handleNativeScroll() {
		if (animationFrameId === null) {
			const maxScroll = getMaxScroll();
			targetScrollLeft = Math.max(0, Math.min(maxScroll, node.scrollLeft));
		}
	}

	function stepScroll(timestamp: number) {
		if (lastTime === null) lastTime = timestamp;
		const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
		lastTime = timestamp;

		const current = node.scrollLeft;
		const maxScroll = getMaxScroll();

		const boundedTarget = Math.max(0, Math.min(maxScroll, targetScrollLeft));
		const diff = boundedTarget - current;

		if (Math.abs(diff) < 0.5) {
			if (maxScroll > 0 && targetScrollLeft >= maxScroll - 2) {
				node.scrollLeft = node.scrollWidth;
			} else {
				node.scrollLeft = boundedTarget;
			}

			targetScrollLeft = node.scrollLeft;
			animationFrameId = null;
			lastTime = null;
			return;
		}

		const lerp = 1 - Math.exp(-14 * dt);
		node.scrollLeft = current + diff * lerp;

		animationFrameId = requestAnimationFrame(stepScroll);
	}

	function handleWheelScroll(e: WheelEvent) {
		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
		if (e.deltaY === 0) return;

		let target = e.target as HTMLElement | null;
		while (target && target !== node) {
			if (target.scrollHeight > target.clientHeight) {
				const overflowY = getComputedStyle(target).overflowY;
				if (overflowY === 'auto' || overflowY === 'scroll') return;
			}
			target = target.parentElement;
		}

		e.preventDefault();

		let delta = e.deltaY;
		if (e.deltaMode === 1) delta *= 16;
		else if (e.deltaMode === 2) delta *= node.clientWidth;

		const maxScroll = getMaxScroll();

		if (animationFrameId === null) {
			targetScrollLeft = Math.max(0, Math.min(maxScroll, node.scrollLeft));
		}

		targetScrollLeft = Math.max(0, Math.min(maxScroll, targetScrollLeft + delta));

		if (animationFrameId === null) {
			lastTime = null;
			animationFrameId = requestAnimationFrame(stepScroll);
		}
	}

	function scrollTo(position: number) {
		targetScrollLeft = position;

		if (animationFrameId === null) {
			lastTime = null;
			animationFrameId = requestAnimationFrame(stepScroll);
		}
	}

	node.addEventListener('wheel', handleWheelScroll, { passive: false });
	node.addEventListener('scroll', handleNativeScroll, { passive: true });

	if (onReady) {
		onReady({ scrollTo });
	}

	return {
		destroy() {
			node.removeEventListener('wheel', handleWheelScroll);
			node.removeEventListener('scroll', handleNativeScroll);
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		}
	};
}
