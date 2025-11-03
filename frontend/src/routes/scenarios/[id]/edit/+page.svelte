<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { api } from '$lib/api';
	import { setHeaderActions, clearHeaderActions } from '$lib/stores/headerActions';
	import ScenarioForm from '$lib/components/ScenarioForm.svelte';
	import type { Chat, ScenarioWithChats } from '$lib/types';

	let scenario: ScenarioWithChats | null = null;
	let chats: Chat[] = [];
	let loading = false;
	let loadingData = true;
	let deleting = false;
	let error = '';

	// Форма
	let name = '';
	let description = '';
	let model = 'yandexgpt';
	let prompt = '';
	let selectedChats: Map<string, number> = new Map();

	$: scenarioId = parseInt($page.params.id || '0');

	onMount(async () => {
			updateHeaderActions();
		await loadData();
	
	});

	onDestroy(() => {
		clearHeaderActions();
	});

	function updateHeaderActions() {
		setHeaderActions([
			{
				label: '',
				icon: '←',
				onClick: () => goto(`/scenarios/${scenarioId}`)
			}
		]);
	}

	async function loadData() {
		loadingData = true;
		error = '';
		
		try {
			// Загружаем сценарий и чаты параллельно
			const [scenarioData, chatsData] = await Promise.all([
				api.getScenario(scenarioId),
				api.getChats()
			]);

			scenario = scenarioData;
			chats = Array.isArray(chatsData) ? chatsData : [];

			// Заполняем форму данными сценария
			name = scenario.name;
			description = scenario.description || '';
			model = scenario.model;
			prompt = scenario.prompt;

			// Заполняем выбранные чаты
			selectedChats = new Map(
				scenario.chatConfigs.map(config => [config.chatId, config.days])
			);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось загрузить данные';
			chats = [];
			console.error(e);
		} finally {
			loadingData = false;
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

			await api.updateScenario(scenarioId, {
				name: name.trim(),
				description: description.trim() || undefined,
				prompt: prompt.trim(),
				model,
				chatConfigs
			});

			goto(`/scenarios/${scenarioId}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось обновить сценарий';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!confirm('Вы уверены, что хотите удалить этот сценарий? Это действие нельзя отменить.')) {
			return;
		}

		deleting = true;
		error = '';

		try {
			await api.deleteScenario(scenarioId);
			goto('/scenarios');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось удалить сценарий';
			console.error(e);
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>Редактировать сценарий - Суммаризация постов Telegram</title>
	<link rel="stylesheet" href="/styles/app.css" />
</svelte:head>

<div class="container">
	{#if loadingData}
		<div class="loading">Загрузка данных...</div>
	{:else if error && !scenario}
		<div class="error">{error}</div>
	{:else}
		<ScenarioForm
			bind:name
			bind:description
			bind:model
			bind:prompt
			bind:chats
			bind:selectedChats
			bind:loading
			loadingChats={false}
			bind:error
			submitLabel="Сохранить изменения"
			showDelete={true}
			bind:deleting
			on:submit={handleSubmit}
			on:cancel={() => goto(`/scenarios/${scenarioId}`)}
			on:delete={handleDelete}
			on:loadchats={loadData}
		/>
	{/if}
</div>

<style>
	.loading {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--text-secondary);
	}
</style>