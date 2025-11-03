<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { api } from '$lib/api';
	import { setHeaderActions, clearHeaderActions } from '$lib/stores/headerActions';
	import ScenarioForm from '$lib/components/ScenarioForm.svelte';
	import type { Chat } from '$lib/types';

	let chats: Chat[] = [];
	let loading = false;
	let loadingChats = true;
	let error = '';

	// Форма
	let name = '';
	let description = '';
	let model = 'yandexgpt';

	const defaultPrompt = `Ты - ассистент для суммаризации сообщений из Telegram-чатов.
Проанализируй следующие сообщения из нескольких чатов и создай структурированный дайджест.

Формат ответа:
📊 **Краткое резюме** (2-3 предложения о главном)

**Основные темы:**
- Тема 1
- Тема 2
- Тема 3

**Ключевые моменты:**
- Важный момент 1
- Важный момент 2
- Важный момент 3

**Выводы:**
Общий вывод о содержании обсуждения.`;

	let prompt = defaultPrompt;
	let selectedChats: Map<string, number> = new Map();

	onMount(async () => {
		updateHeaderActions();
		await loadChats();
	});

	onDestroy(() => {
		clearHeaderActions();
	});

	function updateHeaderActions() {
		setHeaderActions([
			{
				label: '',
				icon: '←',
				onClick: () => goto('/scenarios')
			}
		]);
	}

	async function loadChats() {
		loadingChats = true;
		error = '';
		try {
			chats = await api.getChats();
		} catch (e) {
			error = 'Не удалось загрузить список чатов';
			console.error(e);
		} finally {
			loadingChats = false;
		}
	}

	async function handleSubmit() {
		error = '';

		// Валидация
		if (!name.trim()) {
			error = 'Введите название сценария';
			return;
		}

		if (name.length < 3 || name.length > 100) {
			error = 'Название должно быть от 3 до 100 символов';
			return;
		}

		if (!prompt.trim() || prompt.length < 10) {
			error = 'Промпт должен содержать минимум 10 символов';
			return;
		}

		if (selectedChats.size === 0) {
			error = 'Выберите хотя бы один чат';
			return;
		}

		// Проверка дней
		for (const [_, days] of selectedChats) {
			if (days < 1 || days > 30) {
				error = 'Количество дней должно быть от 1 до 30';
				return;
			}
		}

		loading = true;

		try {
			const chatConfigs = Array.from(selectedChats.entries()).map(([chatId, days]) => ({
				chatId,
				days
			}));

			const scenario = await api.createScenario({
				name: name.trim(),
				description: description.trim() || undefined,
				prompt: prompt.trim(),
				model,
				chatConfigs
			});

			goto(`/scenarios/${scenario.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось создать сценарий';
			console.error(e);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Создать сценарий - Суммаризация постов Telegram</title>
	<link rel="stylesheet" href="/styles/app.css" />
</svelte:head>

<div class="container">
	<ScenarioForm
		bind:name
		bind:description
		bind:model
		bind:prompt
		bind:chats
		bind:selectedChats
		bind:loading
		bind:loadingChats
		bind:error
		submitLabel="Создать сценарий"
		on:submit={handleSubmit}
		on:cancel={() => goto('/scenarios')}
		on:loadchats={loadChats}
	/>
</div>

<style>
</style>