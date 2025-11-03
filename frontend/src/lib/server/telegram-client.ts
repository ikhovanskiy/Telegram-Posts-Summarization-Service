import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import { computeCheck } from 'telegram/Password.js';
import { config } from './config';
import { PrismaClient } from '@prisma/client';
import { prisma } from '$lib/server/storage';


interface TelegramMessage {
	messageId: number;
	authorId?: string;
	authorName?: string;
	text: string;
	date: Date;
}

interface TelegramChat {
	id: string;
	title: string;
	type: string;
	photoUrl?: string;
}

// Глобальная Map для активных клиентов пользователей
const globalClients = new Map<number, TelegramClient>();

// Очистка устаревших pending auth из БД
setInterval(async () => {
	try {
		const result = await prisma.pendingAuth.deleteMany({
			where: {
				expiresAt: {
					lt: new Date()
				}
			}
		});
		if (result.count > 0) {
			console.log(`Cleaned up ${result.count} expired pending auth records`);
		}
	} catch (error) {
		console.error('Error cleaning up expired pending auths:', error);
	}
}, 60 * 1000);

export class TelegramService {
	private static instance: TelegramService;

	static getInstance(): TelegramService {
		if (!TelegramService.instance) {
			TelegramService.instance = new TelegramService();
		}
		return TelegramService.instance;
	}

	/**
	 * Шаг 1: Отправка кода авторизации
	 */
	async sendCode(phoneNumber: string) {

		// Удаляем старые попытки
		await prisma.pendingAuth.deleteMany({
			where: { phoneNumber }
		});

		// Создаем новый клиент
		const session = new StringSession('');
		const client = new TelegramClient(
			session,
			config.telegramApiId,
			config.telegramApiHash,
			{
				connectionRetries: 5
			}
		);

		await client.connect();

		// Отправляем код
		const result = await client.sendCode(
			{
				apiId: config.telegramApiId,
				apiHash: config.telegramApiHash
			},
			phoneNumber
		);


		// Сохраняем session в БД
		const sessionString = client.session.save() as unknown as string;
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

		await prisma.pendingAuth.create({
			data: {
				phoneNumber,
				phoneCodeHash: result.phoneCodeHash,
				sessionString,
				expiresAt
			}
		});


		return {
			phoneCodeHash: result.phoneCodeHash
		};
	}

	/**
	 * Шаг 2: Вход с кодом (и опционально с паролем 2FA)
	 */
	async signIn(phoneNumber: string, code: string, phoneCodeHash: string, password?: string) {

		// Получаем данные из БД
		const pendingAuth = await prisma.pendingAuth.findUnique({
			where: { phoneNumber }
		});

		if (!pendingAuth) {
			throw new Error('No pending authentication found. Please request code again.');
		}

		// Проверяем срок действия
		if (new Date() > pendingAuth.expiresAt) {
			await prisma.pendingAuth.deleteMany({
				where: { phoneNumber }
			});
			throw new Error('Authentication code expired. Please request a new code.');
		}

		// Восстанавливаем клиент
		const session = new StringSession(pendingAuth.sessionString);
		const client = new TelegramClient(
			session,
			config.telegramApiId,
			config.telegramApiHash,
			{
				connectionRetries: 5
			}
		);

		await client.connect();

		try {
			const result = await client.invoke(
				new Api.auth.SignIn({
					phoneNumber,
					phoneCodeHash,
					phoneCode: code
				})
			);


			if (!(result instanceof Api.auth.Authorization)) {
				throw new Error('Authorization failed');
			}

			const user = result.user;
			if (!(user instanceof Api.User)) {
				throw new Error('Invalid user type');
			}

			const sessionString = client.session.save() as unknown as string;

			return {
				userId: user.id.toString(),
				telegramId: user.id.toString(),
				username: user.username || undefined,
				firstName: user.firstName || undefined,
				sessionString
			};
		} catch (error: any) {

			// Проверяем, требуется ли пароль 2FA
			if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {

				if (!password) {
					throw new Error('PASSWORD_REQUIRED');
				}
				
				try {
					const passwordInfo = await client.invoke(new Api.account.GetPassword());

					const passwordResult = await client.invoke(
						new Api.auth.CheckPassword({
							password: await computeCheck(passwordInfo, password)
						})
					);

					if (!(passwordResult instanceof Api.auth.Authorization)) {
						throw new Error('Authorization with password failed');
					}

					const user = passwordResult.user;
					if (!(user instanceof Api.User)) {
						throw new Error('Invalid user type');
					}

					const sessionString = client.session.save() as unknown as string;

					return {
						userId: user.id.toString(),
						telegramId: user.id.toString(),
						username: user.username || undefined,
						firstName: user.firstName || undefined,
						sessionString
					};
				} catch (passwordError: any) {
					console.error(`[signIn] 2FA error:`, passwordError.errorMessage || passwordError.message);
					
					// Удаляем из БД при ошибке пароля
					await prisma.pendingAuth.deleteMany({
						where: { phoneNumber }
					});
				
					throw passwordError;
				}
			}

			// Другая ошибка - очищаем и пробрасываем
			await prisma.pendingAuth.deleteMany({
				where: { phoneNumber }
			});
			await client.disconnect();
			throw error;
		}
	}

	/**
	 * Получение или создание клиента для пользователя
	 */
	async getClient(userId: number, sessionString: string) {
		const existingClient = globalClients.get(userId);
		if (existingClient) {
			try {
				if (existingClient.connected) {
					console.log(`Reusing existing client for user ${userId}`);
					return existingClient;
				}
			} catch (error) {
				console.error('Error checking existing client:', error);
				globalClients.delete(userId);
			}
		}

		console.log(`Creating new client for user ${userId}`);
		return this.createClient(userId, sessionString);
	}

	/**
	 * Создание нового клиента с retry логикой
	 */
	async createClient(userId: number, sessionString: string) {
		const maxRetries = 3;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			const session = new StringSession(sessionString);
			const client = new TelegramClient(
				session,
				config.telegramApiId,
				config.telegramApiHash,
				{
					connectionRetries: 5,
					timeout: 10000
				}
			);

			try {
				await client.connect();
				globalClients.set(userId, client);
				console.log(`Client connected successfully for user ${userId} (attempt ${attempt})`);
				return client;
			} catch (error: any) {
				if (
					error.errorMessage === 'AUTH_KEY_DUPLICATED' ||
					(error.message && error.message.includes('AUTH_KEY_DUPLICATED'))
				) {
					console.error(`AUTH_KEY_DUPLICATED error (attempt ${attempt}/${maxRetries})`);

					try {
						await client.disconnect();
					} catch (e) {
						console.error('Error disconnecting client:', e);
					}

					if (attempt < maxRetries) {
						const delay = 2000 * attempt;
						console.log(`Waiting ${delay}ms before retry...`);
						await new Promise((resolve) => setTimeout(resolve, delay));
						continue;
					}
				}

				console.error(`Failed to create client (attempt ${attempt}/${maxRetries}):`, error);

				try {
					await client.disconnect();
				} catch (e) {
					// Ignore
				}

				if (attempt === maxRetries) {
					throw error;
				}
			}
		}

		throw new Error(`Failed to create client after ${maxRetries} retries`);
	}

	/**
	 * Получение списка чатов пользователя
	 */
	async getUserChats(userId: number): Promise<TelegramChat[]> {
		const client = globalClients.get(userId);
		if (!client) {
			throw new Error('Client not found');
		}

		const dialogs = await client.getDialogs({ limit: 100 });

		const chats = await Promise.all(
			dialogs
				.filter((d) => d.isGroup || d.isChannel)
				.map(async (d) => {
					let photoUrl: string | undefined;

					if (d.entity && 'photo' in d.entity && d.entity.photo) {
						try {
							const photo = await client.downloadProfilePhoto(d.entity, {
								isBig: false
							});
							if (photo && Buffer.isBuffer(photo)) {
								photoUrl = `data:image/jpeg;base64,${photo.toString('base64')}`;
							}
						} catch (error) {
							console.error(`Failed to download photo for chat ${d.id}:`, error);
						}
					}

					return {
						id: d.id?.toString() || '',
						title: d.title || 'Unknown',
						type: d.isChannel ? 'channel' : 'group',
						photoUrl
					};
				})
		);

		return chats;
	}

	/**
	 * Получение сообщений из чата
	 */
	async getMessages(
		userId: number,
		chatId: string,
		fromDate: Date,
		toDate: Date
	): Promise<TelegramMessage[]> {
		const client = globalClients.get(userId);
		if (!client) {
			throw new Error('Client not found');
		}

		const messages: TelegramMessage[] = [];
		let offsetId = 0;
		const limit = 100;

		while (true) {
			const result = await client.getMessages(chatId, {
				limit,
				offsetId
			});

			if (result.length === 0) break;

			for (const msg of result) {
				const msgDate = new Date(msg.date * 1000);

				if (msgDate < fromDate) {
					return messages;
				}

				if (msgDate >= fromDate && msgDate <= toDate && msg.message) {
					messages.push({
						messageId: msg.id,
						authorId: msg.senderId?.toString(),
						authorName:
							msg.sender && 'firstName' in msg.sender
								? (msg.sender as any).firstName || 'Unknown'
								: 'Unknown',
						text: msg.message,
						date: msgDate
					});
				}
			}

			if (result.length < limit) break;
			offsetId = result[result.length - 1].id;
		}

		return messages;
	}

	/**
	 * Отключение клиента пользователя
	 */
	disconnectClient(userId: number) {
		const client = globalClients.get(userId);
		if (client) {
			client.disconnect();
			globalClients.delete(userId);
		}
	}
}