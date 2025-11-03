export interface SendCodeBody {
	phoneNumber: string;
}

export interface SignInBody {
	phoneNumber: string;
	code: string;
	phoneCodeHash: string;
	password?: string;
}

// Scenario types
export interface CreateScenarioBody {
	name: string;
	description?: string;
	prompt: string;
	model: string;
	chatConfigs: Array<{
		chatId: string;
		days: number;
	}>;
}

export interface UpdateScenarioBody {
	name?: string;
	description?: string;
	prompt?: string;
	model?: string;
	chatConfigs?: Array<{
		chatId: string;
		days: number;
	}>;
}

export interface ScenarioWithChats {
	id: number;
	userId: number;
	name: string;
	description: string | null;
	prompt: string;
	model: string;
	createdAt: Date;
	updatedAt: Date;
	chatConfigs: Array<{
		id: number;
		chatId: string;
		days: number;
		chat: {
			chatId: string;
			title: string;
			type: string;
			photoUrl: string | null;
		};
	}>;
}