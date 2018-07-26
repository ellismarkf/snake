export const RIGHT = 1;
export const LEFT = 2;
export const UP = 3;
export const DOWN = 4;
export const opposite = {
	[LEFT]: RIGHT,
	[RIGHT]: LEFT,
	[UP]: DOWN,
	[DOWN]: UP,
};
export const controlsMap = {
	37: LEFT,
	38: UP,
	39: RIGHT,
	40: DOWN,
};
export const directionMap = {
	[LEFT]: 37,
	[UP]: 38,
	[RIGHT]: 39,
	[DOWN]: 40,
};
export const width = 500;
export const height = 500;
export const cellSize = 10;
export const MS_PER_UPDATE = 16;
export const MAX_SPEED = 50;