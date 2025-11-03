import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TelegramService } from '$lib/server/telegram-client';
import { PrismaClient } from '@prisma/client';
import { prisma } from '$lib/server/storage';


export const POST: RequestHandler = async ({ request }) => {
	try {
		const { phoneNumber, code, phoneCodeHash, password } = await request.json();
		
		const telegramService = TelegramService.getInstance();
		const result = await telegramService.signIn(phoneNumber, code, phoneCodeHash, password);
		
		// Создаем или обновляем пользователя в базе
		const user = await prisma.user.upsert({
			where: { telegramId: result.telegramId },
			update: {
				username: result.username,
				firstName: result.firstName,
				sessionString: result.sessionString,
				phoneNumber: phoneNumber
			},
			create: {
				telegramId: result.telegramId,
				username: result.username,
				firstName: result.firstName,
				sessionString: result.sessionString,
				phoneNumber: phoneNumber
			}
		});
		
		// Возвращаем внутренний ID пользователя
		return json({
			userId: user.id.toString(),
			telegramId: result.telegramId,
			username: result.username,
			firstName: result.firstName,
			sessionString: result.sessionString
		});
	} catch (error) {
		console.error('Error signing in:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to sign in' },
			{ status: 500 }
		);
	}
};