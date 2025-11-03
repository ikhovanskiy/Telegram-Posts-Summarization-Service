import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TelegramService } from '$lib/server/telegram-client';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { phoneNumber } = await request.json();
		
		const telegramService = TelegramService.getInstance();
		const result = await telegramService.sendCode(phoneNumber);
		
		return json(result);
	} catch (error) {
		console.error('Error sending code:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to send code' },
			{ status: 500 }
		);
	}
};