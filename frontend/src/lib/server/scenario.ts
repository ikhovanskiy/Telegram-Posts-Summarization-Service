import { PrismaClient } from '@prisma/client';
import type {
	CreateScenarioBody,
	UpdateScenarioBody,
	ScenarioWithChats
} from './types';
import { TelegramService } from './telegram-client';
import { prisma } from '$lib/server/storage';


export class ScenarioService {
	private telegramService: TelegramService;

	constructor() {
		this.telegramService = TelegramService.getInstance();
	}

	async create(userId: number, data: CreateScenarioBody) {
		// Получаем пользователя для доступа к Telegram
		const user = await prisma.user.findUnique({
			where: { id: userId }
		});

		if (!user || !user.sessionString) {
			throw new Error('User not found or session expired');
		}

		// Создаем клиент и получаем чаты
		const telegramId = parseInt(user.telegramId);
		await this.telegramService.getClient(telegramId, user.sessionString);
		const telegramChats = await this.telegramService.getUserChats(telegramId);

		// Создаем или обновляем записи чатов в БД
		for (const config of data.chatConfigs) {
			const telegramChat = telegramChats.find(c => c.id === config.chatId);
			if (telegramChat) {
				await prisma.chat.upsert({
					where: { chatId: config.chatId },
					update: {
						title: telegramChat.title,
						type: telegramChat.type,
						photoUrl: telegramChat.photoUrl
					},
					create: {
						chatId: config.chatId,
						title: telegramChat.title,
						type: telegramChat.type,
						photoUrl: telegramChat.photoUrl
					}
				});
			}
		}

		const scenario = await prisma.scenario.create({
			data: {
				userId,
				name: data.name,
				description: data.description,
				prompt: data.prompt,
				model: data.model,
				chatConfigs: {
					create: data.chatConfigs.map((config) => ({
						chatId: config.chatId,
						days: config.days
					}))
				}
			},
			include: {
				chatConfigs: {
					include: {
						chat: {
							select: {
								chatId: true,
								title: true,
								type: true,
								photoUrl: true
							}
						}
					}
				}
			}
		});

		return scenario;
	}

	async update(scenarioId: number, userId: number, data: UpdateScenarioBody) {
		// Проверяем, что сценарий принадлежит пользователю
		const existing = await prisma.scenario.findFirst({
			where: { id: scenarioId, userId }
		});

		if (!existing) {
			throw new Error('Scenario not found');
		}

		// Если обновляются конфигурации чатов
		if (data.chatConfigs) {
			// Получаем пользователя для доступа к Telegram
			const user = await prisma.user.findUnique({
				where: { id: userId }
			});

			if (!user || !user.sessionString) {
				throw new Error('User not found or session expired');
			}

			// Создаем клиент и получаем чаты
			const telegramId = parseInt(user.telegramId);
			await this.telegramService.getClient(telegramId, user.sessionString);
			const telegramChats = await this.telegramService.getUserChats(telegramId);

			// Создаем или обновляем записи чатов в БД
			for (const config of data.chatConfigs) {
				const telegramChat = telegramChats.find(c => c.id === config.chatId);
				if (telegramChat) {
					await prisma.chat.upsert({
						where: { chatId: config.chatId },
						update: {
							title: telegramChat.title,
							type: telegramChat.type,
							photoUrl: telegramChat.photoUrl
						},
						create: {
							chatId: config.chatId,
							title: telegramChat.title,
							type: telegramChat.type,
							photoUrl: telegramChat.photoUrl
						}
					});
				}
			}

			// Удаляем старые конфигурации
			await prisma.scenarioChatConfig.deleteMany({
				where: { scenarioId }
			});
		}

		const scenario = await prisma.scenario.update({
			where: { id: scenarioId },
			data: {
				name: data.name,
				description: data.description,
				prompt: data.prompt,
				model: data.model,
				...(data.chatConfigs && {
					chatConfigs: {
						create: data.chatConfigs.map((config) => ({
							chatId: config.chatId,
							days: config.days
						}))
					}
				})
			},
			include: {
				chatConfigs: {
					include: {
						chat: {
							select: {
								chatId: true,
								title: true,
								type: true,
								photoUrl: true
							}
						}
					}
				}
			}
		});

		return scenario;
	}

	async delete(scenarioId: number, userId: number) {
		// Проверяем, что сценарий принадлежит пользователю
		const existing = await prisma.scenario.findFirst({
			where: { id: scenarioId, userId }
		});

		if (!existing) {
			throw new Error('Scenario not found');
		}

		await prisma.scenario.delete({
			where: { id: scenarioId }
		});
	}

	async getById(scenarioId: number, userId: number): Promise<ScenarioWithChats> {
		const scenario = await prisma.scenario.findFirst({
			where: { id: scenarioId, userId },
			include: {
				chatConfigs: {
					include: {
						chat: {
							select: {
								chatId: true,
								title: true,
								type: true,
								photoUrl: true
							}
						}
					}
				}
			}
		});

		if (!scenario) {
			throw new Error('Scenario not found');
		}

		return scenario as ScenarioWithChats;
	}

	async getAll(userId: number) {
		const scenarios = await prisma.scenario.findMany({
			where: { userId },
			include: {
				chatConfigs: {
					include: {
						chat: {
							select: {
								chatId: true,
								title: true,
								type: true,
								photoUrl: true
							}
						}
					}
				}
			},
			orderBy: { updatedAt: 'desc' }
		});

		return scenarios;
	}

}