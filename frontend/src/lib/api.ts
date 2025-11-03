import type {
	Chat,
	AuthResponse,
	ScenarioWithChats,
	CreateScenarioData,
	UpdateScenarioData
} from './types';

const API_URL = '/api';

function getHeaders(): HeadersInit {
	const userId = localStorage.getItem('userId');
	return {
		'Content-Type': 'application/json',
		'X-User-Id': userId || ''
	};
}

export const api = {
	async sendCode(phoneNumber: string): Promise<AuthResponse> {
		const res = await fetch(`${API_URL}/auth/send-code`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phoneNumber })
		});
		return res.json();
	},

	async signIn(phoneNumber: string, code: string, phoneCodeHash: string, password?: string): Promise<AuthResponse> {
		const res = await fetch(`${API_URL}/auth/sign-in`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phoneNumber, code, phoneCodeHash, password })
		});
		return res.json();
	},

	async getChats(): Promise<Chat[]> {
		const res = await fetch(`${API_URL}/chats`, {
			headers: getHeaders()
		});
		return res.json();
	},

	async getChat(chatId: string): Promise<Chat | null> {
		const chats = await this.getChats();
		return chats.find(chat => chat.id === chatId) || null;
	},

	async getChatMessages(chatId: string, days: number): Promise<Array<{ text: string; date: string }>> {
		const res = await fetch(`${API_URL}/chats/${chatId}/messages?days=${days}`, {
			headers: getHeaders()
		});
		return res.json();
	},

	// Scenarios
	async getScenarios(): Promise<ScenarioWithChats[]> {
		const res = await fetch(`${API_URL}/scenarios`, {
			headers: getHeaders()
		});
		return res.json();
	},

	async getScenario(id: number): Promise<ScenarioWithChats> {
		const res = await fetch(`${API_URL}/scenarios/${id}`, {
			headers: getHeaders()
		});
		return res.json();
	},

	async createScenario(data: CreateScenarioData): Promise<ScenarioWithChats> {
		const res = await fetch(`${API_URL}/scenarios`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify(data)
		});
		return res.json();
	},

	async updateScenario(id: number, data: UpdateScenarioData): Promise<ScenarioWithChats> {
		const res = await fetch(`${API_URL}/scenarios/${id}`, {
			method: 'PUT',
			headers: getHeaders(),
			body: JSON.stringify(data)
		});
		return res.json();
	},

	async deleteScenario(id: number): Promise<void> {
		await fetch(`${API_URL}/scenarios/${id}`, {
			method: 'DELETE',
			headers: getHeaders()
		});
	}
};
