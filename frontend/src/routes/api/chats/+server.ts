import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TelegramService } from '$lib/server/telegram-client';
import { prisma } from '$lib/server/storage';


export const GET: RequestHandler = async ({ request }) => {
	try {
		const userId = request.headers.get('X-User-Id');
		
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем пользователя из базы
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) }
		});

		if (!user || !user.sessionString) {
			return json({ error: 'User not found or session expired' }, { status: 401 });
		}

		const telegramService = TelegramService.getInstance();
		
		// Создаем или получаем клиент с telegramId (число)
		const telegramId = parseInt(user.telegramId);
		await telegramService.getClient(telegramId, user.sessionString);
		
		const chats = await telegramService.getUserChats(telegramId);
		
		return json(chats);
	} catch (error) {
		console.error('Error getting chats:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to get chats' },
			{ status: 500 }
		);
	}
};