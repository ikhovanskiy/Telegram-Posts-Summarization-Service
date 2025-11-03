<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { setHeaderActions, clearHeaderActions } from '$lib/stores/headerActions';
	import ChatInput from '$lib/components/ChatInput.svelte';
	import type { ScenarioWithChats, ScenarioChatConfig } from '$lib/types';

	let scenario: ScenarioWithChats | null = null;

	let loading = true;
	let error = '';
	
	// Редактируемый промпт
	let currentPrompt = '';
	let promptChanged = false;
	let fullPromptForCopy = ''; // Полный промпт с сообщениями для копирования
	let loadingMessages = false;
	let saving = false;

	$: scenarioId = parseInt($page.params.id || '0');

	onMount(async () => {
		await loadScenario();
		updateHeaderActions();
	});

	onDestroy(() => {
		clearHeaderActions();
	});

	function updateHeaderActions() {
		setHeaderActions([
			{
				label: '',
				icon: '✏️',
				onClick: () => goto(`/scenarios/${scenarioId}/edit`)
			},
			{
				label: '',
				icon: '←',
				onClick: () => goto('/scenarios')
			}
		]);
	}

	async function loadScenario() {
		loading = true;
		error = '';
		try {
			scenario = await api.getScenario(scenarioId);
			currentPrompt = scenario.prompt;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось загрузить сценарий';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	// Отслеживаем изменения промпта
	$: if (scenario && currentPrompt !== scenario.prompt) {
		promptChanged = true;
	} else {
		promptChanged = false;
	}

	// Загружаем сообщения из чатов для формирования полного промпта
	async function loadMessagesForPrompt() {
		if (!scenario) return;
		
		loadingMessages = true;
		try {
			const systemPrompt = 'Ты - информационный аналитик. Создавай объективные дайджесты на основе предоставленных текстов. Излагай только факты из сообщений без добавления собственных оценок. Структурируй информацию по темам и ключевым событиям.';
			
			let messagesText = '';
			
			// Загружаем сообщения из каждого чата
			for (const chatConfig of scenario.chatConfigs) {
				const messages = await api.getChatMessages(chatConfig.chatId, chatConfig.days);
				
				const chatMessages = messages
					.map((msg: { text: string; date: string }) => {
						const date = new Date(msg.date).toLocaleString('ru-RU', {
							day: '2-digit',
							month: '2-digit',
							hour: '2-digit',
							minute: '2-digit'
						});
						return `[${date}] ${msg.text}`;
					})
					.join('\n\n');
				
				messagesText += `\n\n=== Чат: "${chatConfig.chat.title}" ===\n\n${chatMessages}`;
			}
			
			fullPromptForCopy = `SYSTEM PROMPT:
${systemPrompt}

USER PROMPT:
${currentPrompt}

СООБЩЕНИЯ ДЛЯ АНАЛИЗА:
${messagesText}`;
		} catch (e) {
			console.error('Failed to load messages for prompt:', e);
			// Если не удалось загрузить сообщения, показываем промпт без них
			const systemPrompt = 'Ты - информационный аналитик. Создавай объективные дайджесты на основе предоставленных текстов. Излагай только факты из сообщений без добавления собственных оценок. Структурируй информацию по темам и ключевым событиям.';
			
			const chatsInfo = scenario.chatConfigs
				.map((chat: ScenarioChatConfig) => `Чат: "${chat.chat.title}" (последние ${chat.days} дней)`)
				.join('\n');
			
			fullPromptForCopy = `SYSTEM PROMPT:
${systemPrompt}

USER PROMPT:
${currentPrompt}

ЧАТЫ ДЛЯ АНАЛИЗА:
${chatsInfo}

Примечание: Не удалось загрузить сообщения. Они будут добавлены при выполнении сценария.`;
		} finally {
			loadingMessages = false;
		}
	}

	// Сохраняем промпт перед копированием
	async function handleBeforeCopy() {
		if (promptChanged && currentPrompt.trim()) {
			saving = true;
			try {
				await api.updateScenario(scenarioId, {
					prompt: currentPrompt.trim()
				});
				// Обновляем локальный сценарий
				if (scenario) {
					scenario.prompt = currentPrompt.trim();
				}
				promptChanged = false;
			} catch (e) {
				console.error('Failed to save prompt:', e);
				// Продолжаем копирование даже если сохранение не удалось
			} finally {
				saving = false;
			}
		}
	}

	// Обновляем полный промпт при изменении currentPrompt или scenario
	$: if (scenario && currentPrompt) {
		loadMessagesForPrompt();
	}
</script>

<svelte:head>
	<title>{scenario?.name || 'Сценарий'} - Суммаризация постов Telegram</title>
	<link rel="stylesheet" href="/styles/app.css" />
</svelte:head>

<div class="container">
	{#if loading}
		<div class="loading">Загрузка сценария...</div>
	{:else if error}
		<div class="error">{error}</div>
		<button class="btn" on:click={() => goto('/scenarios')}>← Назад к списку</button>
	{:else if scenario}
		<div class="page-header">
			<h1>{scenario.name}</h1>
		</div>

		{#if scenario.description}
			<p class="scenario-description">{scenario.description}</p>
		{/if}



		<!-- Chat Container: Input only -->
		<div class="chat-container">
			<ChatInput
				bind:prompt={currentPrompt}
				fullPrompt={fullPromptForCopy}
				loadingMessages={loadingMessages}
				on:beforecopy={handleBeforeCopy}
			/>
		</div>
	{/if}
</div>

<style>
	.page-header {
		margin-bottom: var(--spacing-lg);
	}

	.page-header h1 {
		margin: 0;
	}

	.scenario-description {
		color: var(--text-secondary);
		font-size: 1.125rem;
		margin-bottom: var(--spacing-lg);
		line-height: 1.6;
	}

	.scenario-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
	}

	.detail-card {
		background-color: white;
		border: 1px solid var(--border);
		border-radius: var(--border-radius);
		padding: var(--spacing-lg);
	}

	.detail-card.full-width {
		grid-column: 1 / -1;
	}

	.detail-card h3 {
		margin-top: 0;
		margin-bottom: var(--spacing-md);
		font-size: 1.125rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: var(--spacing-sm) 0;
		border-bottom: 1px solid var(--border);
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.detail-value {
		color: var(--text-primary);
	}

	.chats-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.chat-item-small {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-sm);
		background-color: var(--surface);
		border-radius: 4px;
	}

	.chat-name {
		font-weight: 500;
	}

	.chat-days {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.prompt-display {
		background-color: var(--surface);
		padding: var(--spacing-md);
		border-radius: 4px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-x: auto;
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin-top: var(--spacing-lg);
		position: sticky;
		bottom: 0;
		max-height: calc(100vh - 140px);
		min-height: 200px;
	}

	/* Mobile adaptivity */
	@media (max-width: 768px) {
		.page-header h1 {
			font-size: 1.5rem;
		}

		.scenario-description {
			font-size: 1rem;
			margin-bottom: var(--spacing-md);
		}

		.scenario-details {
			grid-template-columns: 1fr;
			gap: var(--spacing-sm);
		}

		.detail-card {
			padding: var(--spacing-md);
		}

		.detail-card h3 {
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.page-header {
			margin-bottom: var(--spacing-md);
		}

		.page-header h1 {
			font-size: 1.25rem;
		}

		.scenario-description {
			font-size: 0.9375rem;
		}

		.detail-card {
			padding: var(--spacing-sm);
		}


	}
</style>