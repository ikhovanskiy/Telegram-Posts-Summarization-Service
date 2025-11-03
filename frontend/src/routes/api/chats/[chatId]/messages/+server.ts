import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TelegramService } from '$lib/server/telegram-client';
import { PrismaClient } from '@prisma/client';
import { prisma } from '$lib/server/storage';


export const GET: RequestHandler = async ({ params, url, request }) => {
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

		const { chatId } = params;
		const days = parseInt(url.searchParams.get('days') || '7');

		// Вычисляем диапазон дат
		const toDate = new Date();
		const fromDate = new Date();
		fromDate.setDate(fromDate.getDate() - days);

		const telegramService = TelegramService.getInstance();
		
		// Создаем или получаем клиент с telegramId (число)
		const telegramId = parseInt(user.telegramId);
		await telegramService.getClient(telegramId, user.sessionString);
		
		const messages = await telegramService.getMessages(
			telegramId,
			chatId,
			fromDate,
			toDate
		);
		
		return json(messages);
	} catch (error) {
		console.error('Error getting messages:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to get messages' },
			{ status: 500 }
		);
	}
};