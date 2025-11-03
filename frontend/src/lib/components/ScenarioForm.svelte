<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Chat } from '$lib/types';

	export let name = '';
	export let description = '';
	export let model = 'yandexgpt';
	export let prompt = '';
	export let chats: Chat[] = [];
	export let selectedChats: Map<string, number> = new Map();
	export let loading = false;
	export let loadingChats = false;
	export let error = '';
	export let submitLabel = 'Создать сценарий';
	export let showDelete = false;
	export let deleting = false;

	const dispatch = createEventDispatcher();

	let showPromptEditor = false;

	function toggleChat(chatId: string) {
		if (selectedChats.has(chatId)) {
			selectedChats.delete(chatId);
		} else {
			selectedChats.set(chatId, 1);
		}
		selectedChats = selectedChats;
	}

	function updateDays(chatId: string, days: number) {
		selectedChats.set(chatId, days);
		selectedChats = selectedChats;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		dispatch('submit');
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function handleDelete() {
		dispatch('delete');
	}

	function handleLoadChats() {
		dispatch('loadchats');
	}
</script>

<form on:submit={handleSubmit}>
	<div class="form-group">
		<label for="name" class="form-label">Название сценария *</label>
		<input
			id="name"
			type="text"
			bind:value={name}
			class="form-input"
			placeholder="Например: Еженедельный дайджест"
			disabled={loading}
			required
		/>
	</div>

	<div class="form-group">
		<label class="form-label">Выберите чаты *</label>

		{#if loadingChats}
			<div class="loading">Загрузка чатов...</div>
		{:else if !Array.isArray(chats) || chats.length === 0}
			<div class="empty-state">
				<p>Нет доступных чатов</p>
				<p class="hint">Чаты загружаются автоматически при первом входе в систему</p>
				<button type="button" class="btn btn-primary" on:click={handleLoadChats}>
					Обновить список чатов
				</button>
			</div>
		{:else}
			<div class="chats-selector">
				{#each chats as chat}
					<div class="chat-selector-item" class:selected={selectedChats.has(chat.id)}>
						<label class="chat-checkbox">
							<input
								type="checkbox"
								checked={selectedChats.has(chat.id)}
								on:change={() => toggleChat(chat.id)}
								disabled={loading}
							/>
							{#if chat.photoUrl}
								<img src={chat.photoUrl} alt="" class="chat-icon-small" />
							{:else}
								<div class="chat-icon-small chat-icon-placeholder">
									{chat.title.charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="chat-title">{chat.title}</span>
							<span class="chat-type-small">{chat.type === 'channel' ? 'Канал' : 'Группа'}</span>
						</label>

						{#if selectedChats.has(chat.id)}
							<div class="days-input">
								<label for="days-{chat.id}">Дней:</label>
								<input
									id="days-{chat.id}"
									type="number"
									min="1"
									max="30"
									value={selectedChats.get(chat.id)}
									on:input={(e) => updateDays(chat.id, parseInt(e.currentTarget.value))}
									class="form-input"
									disabled={loading}
								/>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="selection-summary">
				Выбрано чатов: {selectedChats.size}
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="form-actions">
		<button type="submit" class="btn btn-primary" disabled={loading || selectedChats.size === 0}>
			{loading ? 'Сохранение...' : submitLabel}
		</button>
		<button type="button" class="btn" on:click={handleCancel} disabled={loading}>
			Отмена
		</button>
		{#if showDelete}
			<button
				type="button"
				class="btn btn-danger"
				on:click={handleDelete}
				disabled={loading || deleting}
			>
				{deleting ? 'Удаление...' : '🗑️ Удалить сценарий'}
			</button>
		{/if}
	</div>
</form>

<style>
	.chats-selector {
		border: 1px solid var(--border);
		border-radius: var(--border-radius);
		max-height: 400px;
		overflow-y: auto;
	}

	.chat-selector-item {
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--border);
		transition: background-color 0.2s ease;
	}

	.chat-selector-item:last-child {
		border-bottom: none;
	}

	.chat-selector-item:hover {
		background-color: var(--surface);
	}

	.chat-selector-item.selected {
		background-color: rgba(0, 136, 204, 0.05);
	}

	.chat-checkbox {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
		user-select: none;
	}

	.chat-checkbox input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chat-icon-small {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.chat-icon-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.chat-title {
		flex: 1;
		font-weight: 500;
	}

	.chat-type-small {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 2px 8px;
		background-color: var(--surface);
		border-radius: 4px;
	}

	.days-input {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
		margin-left: 26px;
	}

	.days-input label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.days-input input {
		width: 80px;
		padding: 6px 8px;
	}

	.selection-summary {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		background-color: var(--surface);
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
	}

	.form-actions {
		display: flex;
		gap: var(--spacing-md);
		margin-top: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.btn-danger {
		background-color: var(--error);
		color: white;
		margin-left: auto;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #c82333;
	}

	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-link {
		background: none;
		border: none;
		color: var(--primary-color);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0;
		text-decoration: underline;
	}

	.btn-link:hover {
		color: var(--primary-hover);
	}

	.prompt-editor {
		margin-top: var(--spacing-sm);
	}

	.prompt-editor textarea {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		resize: vertical;
	}

	.prompt-hint {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: var(--spacing-sm);
		font-style: italic;
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

	.empty-state .hint {
		font-size: 0.875rem;
		font-style: italic;
	}

	.loading {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--text-secondary);
	}
</style>