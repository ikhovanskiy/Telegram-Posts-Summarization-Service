import { writable } from 'svelte/store';

export interface HeaderAction {
	label: string;
	icon?: string;
	onClick: () => void;
}

export const headerActions = writable<HeaderAction[]>([]);

export function setHeaderActions(actions: HeaderAction[]) {
	headerActions.set(actions);
}

export function clearHeaderActions() {
	headerActions.set([]);
}