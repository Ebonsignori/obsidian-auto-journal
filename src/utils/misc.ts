import { Notice } from "obsidian";

// Constants
export const APP_NAME = "Auto Journal";

/**
 * Highlights the search result and adds it to an HTML element without using dangerouslySetInnerHTML
 * Derived from https://github.com/farzher/fuzzysort/blob/c7f1d2674d7fa526015646bc02fd17e29662d30c/fuzzysort.js#L132
 * @param element - The element to add the search result to
 * @param result - The search result from fuzzysort
 * @returns
 */
export function highlightSearch<T>(
	element: HTMLElement,
	result: Fuzzysort.KeyResult<T>
): void {
	if (result === null) return;
	let matchesIndex = 0;
	let opened = false;
	const target = result.target;
	const targetLen = target.length;
	// @ts-expect-error _indexes is private
	let indexes = result._indexes;
	indexes = indexes
		.slice(0, indexes.len)
		.sort((a: number, b: number) => a - b);
	let strongElement = undefined;
	for (let i = 0; i < targetLen; ++i) {
		const char = target[i];
		// We are at first match
		if (indexes[matchesIndex] === i) {
			++matchesIndex;
			if (!opened) {
				opened = true;
				strongElement = document.createElement("strong");
			}

			// We are at end of matches
			if (matchesIndex === indexes.length) {
				(strongElement as HTMLElement).appendChild(
					document.createTextNode(char)
				);
				element.appendChild(strongElement as HTMLElement);
				element.appendChild(
					document.createTextNode(target.substr(i + 1))
				);
				break;
			}
		} else {
			if (opened) {
				opened = false;
				element.appendChild(strongElement as HTMLElement);
				strongElement = undefined;
			}
		}
		// If strongElement is defined, we are still in a match
		if (strongElement) {
			strongElement.appendChild(document.createTextNode(char));
		} else {
			element.appendChild(document.createTextNode(char));
		}
	}
}

/**
 *
 * Displays a notice with the message prefixed with the app name
 *
 * @param message - The message to display in the error notice
 */
export function errorNotification(
	message: string,
	showDebugNotifications: boolean
): void {
	if (showDebugNotifications) {
		new Notice(`${APP_NAME} [Error]: ` + message, 5000);
	}
	console.log(`${APP_NAME} [Error]: ` + message);
}

export function infoNotification(
	message: string,
	showDebugNotifications: boolean
): void {
	if (showDebugNotifications) {
		new Notice(`${APP_NAME} [Info]: ` + message, 5000);
	}
	console.log(`${APP_NAME} [Info]: ` + message);
}
