export interface Chat {
	id: string;
	title: string;
	type: string;
	photoUrl?: string;
}

export interface AuthResponse {
	userId?: string;
	telegramId?: string;
	username?: string;
	firstName?: string;
	sessionString?: string;
	phoneCodeHash?: string;
	error?: string;
}

export interface ApiError {
	error: string;
}

// Scenario types
export interface Scenario {
	id: number;
	name: string;
	description?: string;
	prompt: string;
	model: string;
	createdAt: string;
	updatedAt: string;
}

export interface ScenarioChatConfig {
	id: number;
	chatId: string;
	days: number;
	chat: Chat;
}

export interface ScenarioWithChats extends Scenario {
	chatConfigs: ScenarioChatConfig[];
}

export interface CreateScenarioData {
	name: string;
	description?: string;
	prompt: string;
	model: string;
	chatConfigs: Array<{
		chatId: string;
		days: number;
	}>;
}

export interface UpdateScenarioData {
	name?: string;
	description?: string;
	prompt?: string;
	model?: string;
	chatConfigs?: Array<{
		chatId: string;
		days: number;
	}>;
}