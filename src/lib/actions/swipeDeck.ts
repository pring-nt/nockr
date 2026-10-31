export interface SwipeDeckOptions {
	onMove: (dx: number) => void;
	onRelease: (dx: number, velocity: number) => void;
	onEdgeHold: (direction: -1 | 1) => void;
}

const LOCK_PX = 10;
const EDGE_PX = 36;
const EDGE_HOLD_MS = 600;

function isDraggingCourse(): boolean {
	return document.getElementById('dnd-action-dragged-el') !== null;
}

/**
 * Horizontal swipes on a deck of cards. Listens in the capture phase because svelte-dnd-action
 * stops touch events from bubbling off its items. It cancels a pending drag once the finger
 * moves, so a quick swipe lands here and a long press stays a drag.
 */
export function swipeDeck(node: HTMLElement, options: SwipeDeckOptions) {
	let current = options;
	let startX = 0;
	let startY = 0;
	let startTime = 0;
	let tracking = false;
	let swiping = false;
	let edgeDirection: -1 | 1 | null = null;
	let edgeTimer: number | undefined;

	function clearEdgeHold() {
		window.clearTimeout(edgeTimer);
		edgeDirection = null;
	}

	function trackEdgeHold(x: number) {
		const direction = x < EDGE_PX ? -1 : x > window.innerWidth - EDGE_PX ? 1 : null;
		if (direction === edgeDirection) return;

		clearEdgeHold();
		edgeDirection = direction;
		if (direction === null) return;

		const hold = () => {
			current.onEdgeHold(direction);
			edgeTimer = window.setTimeout(hold, EDGE_HOLD_MS);
		};
		edgeTimer = window.setTimeout(hold, EDGE_HOLD_MS);
	}

	function handleStart(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
		startTime = e.timeStamp;
		tracking = true;
		swiping = false;
	}

	function handleMove(e: TouchEvent) {
		const touch = e.touches[0];
		if (isDraggingCourse()) {
			tracking = false;
			trackEdgeHold(touch.clientX);
			return;
		}
		if (!tracking) return;

		const dx = touch.clientX - startX;
		const dy = touch.clientY - startY;

		if (!swiping) {
			if (Math.abs(dy) > LOCK_PX && Math.abs(dy) > Math.abs(dx)) {
				tracking = false;
			} else if (Math.abs(dx) > LOCK_PX) {
				swiping = true;
			}
		}
		if (swiping) current.onMove(dx);
	}

	function handleEnd(e: TouchEvent) {
		clearEdgeHold();
		if (swiping) {
			const dx = e.changedTouches[0].clientX - startX;
			current.onRelease(dx, dx / Math.max(1, e.timeStamp - startTime));
		}
		tracking = false;
		swiping = false;
	}

	node.addEventListener('touchstart', handleStart, { capture: true, passive: true });
	window.addEventListener('touchmove', handleMove, { capture: true, passive: true });
	window.addEventListener('touchend', handleEnd, { capture: true, passive: true });
	window.addEventListener('touchcancel', handleEnd, { capture: true, passive: true });

	return {
		update(next: SwipeDeckOptions) {
			current = next;
		},
		destroy() {
			clearEdgeHold();
			node.removeEventListener('touchstart', handleStart, { capture: true });
			window.removeEventListener('touchmove', handleMove, { capture: true });
			window.removeEventListener('touchend', handleEnd, { capture: true });
			window.removeEventListener('touchcancel', handleEnd, { capture: true });
		}
	};
}
