export type InputMode = 'keyboard' | 'xbox' | 'dualsense';
type ControllerInputMode = Exclude<InputMode, 'keyboard'>;

export type GamepadState = {
	controllerLoop: number;
	axisHeldX: number;
	axisXHoldStartedAt: number;
	axisXLastRepeatAt: number;
	axisHeldY: number;
	axisHoldStartedAt: number;
	axisLastRepeatAt: number;
	buttonHeldA: boolean;
	buttonHeldB: boolean;
	buttonHeldX: boolean;
	buttonHeldY: boolean;
	buttonHeldLeftShoulder: boolean;
	buttonHeldRightShoulder: boolean;
	inputMode: InputMode;
	isXboxControllerConnected: boolean;
	isDualSenseControllerConnected: boolean;
};

type ControllerActions = {
	moveLeft: () => void;
	moveRight: () => void;
	moveUp: () => void;
	moveDown: () => void;
	enterSelected: () => void;
	goBack: () => void;
	deleteText: () => void;
	confirmText: () => void;
	insertSpace: () => void;
	clearText: () => void;
};

const AXIS_DEADZONE = 0.55;
const NAVIGATION_REPEAT_DELAY_MS = 260;
const NAVIGATION_REPEAT_INTERVAL_MS = 72;
const NAVIGATION_REPEAT_FAST_INTERVAL_MS = 48;
const NAVIGATION_REPEAT_ACCELERATION_MS = 850;

export function createGamepadState(): GamepadState {
	return {
		controllerLoop: 0,
		axisHeldX: 0,
		axisXHoldStartedAt: 0,
		axisXLastRepeatAt: 0,
		axisHeldY: 0,
		axisHoldStartedAt: 0,
		axisLastRepeatAt: 0,
		buttonHeldA: false,
		buttonHeldB: false,
		buttonHeldX: false,
		buttonHeldY: false,
		buttonHeldLeftShoulder: false,
		buttonHeldRightShoulder: false,
		inputMode: 'keyboard',
		isXboxControllerConnected: false,
		isDualSenseControllerConnected: false
	};
}

function resetNavigationHold(state: GamepadState) {
	state.axisHeldX = 0;
	state.axisXHoldStartedAt = 0;
	state.axisXLastRepeatAt = 0;
	state.axisHeldY = 0;
	state.axisHoldStartedAt = 0;
	state.axisLastRepeatAt = 0;
}

function resetVerticalNavigationHold(state: GamepadState) {
	state.axisHeldY = 0;
	state.axisHoldStartedAt = 0;
	state.axisLastRepeatAt = 0;
}

function resetHorizontalNavigationHold(state: GamepadState) {
	state.axisHeldX = 0;
	state.axisXHoldStartedAt = 0;
	state.axisXLastRepeatAt = 0;
}

function getNavigationRepeatInterval(heldFor: number): number {
	return heldFor >= NAVIGATION_REPEAT_ACCELERATION_MS ? NAVIGATION_REPEAT_FAST_INTERVAL_MS : NAVIGATION_REPEAT_INTERVAL_MS;
}

function moveVerticalSelection(direction: -1 | 1, actions: ControllerActions) {
	if (direction === -1) {
		actions.moveUp();
		return;
	}

	actions.moveDown();
}

function moveHorizontalSelection(direction: -1 | 1, actions: ControllerActions) {
	if (direction === -1) {
		actions.moveLeft();
		return;
	}

	actions.moveRight();
}

export function setKeyboardInputMode(state: GamepadState) {
	state.inputMode = 'keyboard';
}

export function setDetectedControllerInputMode(state: GamepadState) {
	if (state.isXboxControllerConnected) {
		state.inputMode = 'xbox';
		return;
	}

	if (state.isDualSenseControllerConnected) {
		state.inputMode = 'dualsense';
	}
}

function getActiveController(): Gamepad | null {
	const pads = navigator.getGamepads?.() ?? [];

	for (const pad of pads) {
		if (pad?.connected) {
			return pad;
		}
	}

	return null;
}

function getControllerInputMode(controller: Gamepad): ControllerInputMode | null {
	const id = controller.id.toLowerCase();

	if (id.includes('xbox') || id.includes('xinput') || id.includes('microsoft')) {
		return 'xbox';
	}

	if (
		id.includes('dualsense') ||
		id.includes('playstation') ||
		id.includes('wireless controller') ||
		id.includes('sony') ||
		id.includes('054c')
	) {
		return 'dualsense';
	}

	return null;
}

export function updateInputPrompts(state: GamepadState) {
	const controller = getActiveController();

	if (!controller) {
		state.isXboxControllerConnected = false;
		state.isDualSenseControllerConnected = false;

		if (state.inputMode !== 'keyboard') {
			state.inputMode = 'keyboard';
		}

		return;
	}

	const controllerInputMode = getControllerInputMode(controller);
	state.isXboxControllerConnected = controllerInputMode === 'xbox';
	state.isDualSenseControllerConnected = controllerInputMode === 'dualsense';

	if (
		(state.inputMode === 'xbox' && !state.isXboxControllerConnected) ||
		(state.inputMode === 'dualsense' && !state.isDualSenseControllerConnected)
	) {
		state.inputMode = 'keyboard';
	}
}

export function handleControllerInput(state: GamepadState, actions: ControllerActions) {
	const controller = getActiveController();

	if (!controller) {
		state.isXboxControllerConnected = false;
		state.isDualSenseControllerConnected = false;
		resetNavigationHold(state);
		state.buttonHeldA = false;
		state.buttonHeldB = false;
		state.buttonHeldX = false;
		state.buttonHeldY = false;
		state.buttonHeldLeftShoulder = false;
		state.buttonHeldRightShoulder = false;

		if (state.inputMode !== 'keyboard') {
			state.inputMode = 'keyboard';
		}

		return;
	}

	updateInputPrompts(state);

	const axisX = controller.axes[0] ?? 0;
	const axisY = controller.axes[1] ?? 0;
	const dpadLeft = !!controller.buttons[14]?.pressed;
	const dpadRight = !!controller.buttons[15]?.pressed;
	const dpadUp = !!controller.buttons[12]?.pressed;
	const dpadDown = !!controller.buttons[13]?.pressed;
	const horizontalDirection: -1 | 0 | 1 =
		dpadLeft || axisX <= -AXIS_DEADZONE ? -1 : dpadRight || axisX >= AXIS_DEADZONE ? 1 : 0;
	const navigationDirection: -1 | 0 | 1 = dpadUp || axisY <= -AXIS_DEADZONE ? -1 : dpadDown || axisY >= AXIS_DEADZONE ? 1 : 0;

	if (navigationDirection === 0) {
		resetVerticalNavigationHold(state);
	} else {
		const now = performance.now();

		setDetectedControllerInputMode(state);

		if (state.axisHeldY !== navigationDirection) {
			moveVerticalSelection(navigationDirection, actions);
			state.axisHeldY = navigationDirection;
			state.axisHoldStartedAt = now;
			state.axisLastRepeatAt = now;
		} else {
			const heldFor = now - state.axisHoldStartedAt;
			const repeatInterval = getNavigationRepeatInterval(heldFor);

			if (heldFor >= NAVIGATION_REPEAT_DELAY_MS && now - state.axisLastRepeatAt >= repeatInterval) {
				moveVerticalSelection(navigationDirection, actions);
				state.axisLastRepeatAt = now;
			}
		}
	}

	if (horizontalDirection === 0) {
		resetHorizontalNavigationHold(state);
	} else {
		const now = performance.now();

		setDetectedControllerInputMode(state);

		if (state.axisHeldX !== horizontalDirection) {
			moveHorizontalSelection(horizontalDirection, actions);
			state.axisHeldX = horizontalDirection;
			state.axisXHoldStartedAt = now;
			state.axisXLastRepeatAt = now;
		} else {
			const heldFor = now - state.axisXHoldStartedAt;
			const repeatInterval = getNavigationRepeatInterval(heldFor);

			if (heldFor >= NAVIGATION_REPEAT_DELAY_MS && now - state.axisXLastRepeatAt >= repeatInterval) {
				moveHorizontalSelection(horizontalDirection, actions);
				state.axisXLastRepeatAt = now;
			}
		}
	}

	const aPressed = !!controller.buttons[0]?.pressed;
	if (aPressed && !state.buttonHeldA) {
		setDetectedControllerInputMode(state);
		actions.enterSelected();
	}
	state.buttonHeldA = aPressed;

	const bPressed = !!controller.buttons[1]?.pressed;
	if (bPressed && !state.buttonHeldB) {
		setDetectedControllerInputMode(state);
		actions.goBack();
	}
	state.buttonHeldB = bPressed;

	const xPressed = !!controller.buttons[2]?.pressed;
	if (xPressed && !state.buttonHeldX) {
		setDetectedControllerInputMode(state);
		actions.deleteText();
	}
	state.buttonHeldX = xPressed;

	const yPressed = !!controller.buttons[3]?.pressed;
	if (yPressed && !state.buttonHeldY) {
		setDetectedControllerInputMode(state);
		actions.confirmText();
	}
	state.buttonHeldY = yPressed;

	const leftShoulderPressed = !!controller.buttons[4]?.pressed;
	if (leftShoulderPressed && !state.buttonHeldLeftShoulder) {
		setDetectedControllerInputMode(state);
		actions.insertSpace();
	}
	state.buttonHeldLeftShoulder = leftShoulderPressed;

	const rightShoulderPressed = !!controller.buttons[5]?.pressed;
	if (rightShoulderPressed && !state.buttonHeldRightShoulder) {
		setDetectedControllerInputMode(state);
		actions.clearText();
	}
	state.buttonHeldRightShoulder = rightShoulderPressed;
}

export function createControllerTick(state: GamepadState, actions: ControllerActions) {
	function controllerTick() {
		handleControllerInput(state, actions);
		state.controllerLoop = requestAnimationFrame(controllerTick);
	}

	return controllerTick;
}

export function createControllerChangeHandler(state: GamepadState) {
	return () => {
		updateInputPrompts(state);

		if (state.isXboxControllerConnected || state.isDualSenseControllerConnected) {
			setDetectedControllerInputMode(state);
		}
	};
}
