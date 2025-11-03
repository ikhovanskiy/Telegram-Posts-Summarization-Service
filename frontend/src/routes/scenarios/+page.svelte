<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import type { ScenarioWithChats } from '$lib/types';

	let scenarios: ScenarioWithChats[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadScenarios();
	});

	async function loadScenarios() {
		loading = true;
		error = '';
		try {
			scenarios = await api.getScenarios();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось загрузить сценарии';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Сценарии - Суммаризация постов Telegram</title>
	<link rel="stylesheet" href="/styles/app.css" />
</svelte:head>

<div class="container">
	<div class="page-header">
		<h1>Сценарии суммаризации</h1>
		<button class="btn btn-primary" on:click={() => goto('/scenarios/new')}>
			➕ Создать сценарий
		</button>
	</div>

	{#if loading}
		<div class="loading">Загрузка сценариев...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if scenarios.length === 0}
		<div class="empty-state">
			<p>У вас пока нет сценариев</p>
			<button class="btn btn-primary" on:click={() => goto('/scenarios/new')}>
				Создать первый сценарий
			</button>
		</div>
	{:else}
		<div class="scenarios-grid">
			{#each scenarios as scenario}
				<button class="scenario-card" on:click={() => goto(`/scenarios/${scenario.id}`)}>
					<div class="scenario-header">
						<h3>{scenario.name}</h3>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-lg);
	}

	.page-header h1 {
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: var(--spacing-xl);
		background-color: var(--surface);
		border-radius: var(--border-radius);
	}

	.empty-state p {
		color: var(--text-secondary);
		margin-bottom: var(--spacing-md);
	}

	.scenarios-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: var(--spacing-md);
	}

	.scenario-card {
		background-color: white;
		border: 1px solid var(--border);
		border-radius: var(--border-radius);
		padding: var(--spacing-lg);
		transition: all 0.2s ease;
	}

	.scenario-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: var(--primary-color);
	}

	.scenario-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-sm);
	}

	.scenario-header h3 {
		margin: 0;
		font-size: 1.25rem;
		flex: 1;
	}

	.scenario-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: var(--spacing-md);
		line-height: 1.5;
	}

	.scenario-meta {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--border);
	}

	.meta-item {
		display: flex;
		gap: var(--spacing-xs);
		font-size: 0.875rem;
	}

	.meta-label {
		color: var(--text-secondary);
	}

	.meta-value {
		font-weight: 500;
	}

	.last-execution {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.875rem;
		margin-bottom: var(--spacing-md);
		padding: var(--spacing-sm);
		background-color: var(--surface);
		border-radius: 4px;
	}

	.execution-label {
		color: var(--text-secondary);
	}

	.execution-date {
		flex: 1;
	}

	.execution-status {
		font-weight: 600;
	}

	.execution-status.success {
		color: var(--success);
	}

	.execution-status.error {
		color: var(--error);
	}

	.scenario-chats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.chat-badge {
		display: inline-block;
		padding: 4px 8px;
		font-size: 0.75rem;
		background-color: rgba(0, 136, 204, 0.1);
		color: var(--primary-color);
		border-radius: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.chat-badge.more {
		background-color: var(--surface);
		color: var(--text-secondary);
		font-weight: 500;
	}
</style>