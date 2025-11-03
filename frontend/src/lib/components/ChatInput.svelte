<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let prompt: string = '';
	export let placeholder: string = 'Введите промпт для сценария...';
	export let fullPrompt: string = ''; // Полный промпт с сообщениями для копирования
	export let loadingMessages: boolean = false; // Флаг загрузки сообщений

	const dispatch = createEventDispatcher();

	let copySuccess = false;
	let copyTimeout: ReturnType<typeof setTimeout>;
	let copying = false;

	async function handleCopyPrompt() {
		if (copying || loadingMessages) return;
		
		copying = true;
		try {
			// Вызываем событие перед копированием (для сохранения промпта)
			dispatch('beforecopy');
			
			// Небольшая задержка, чтобы дать время на сохранение
			await new Promise(resolve => setTimeout(resolve, 100));
			
			const textToCopy = fullPrompt || prompt;
			await navigator.clipboard.writeText(textToCopy);
			copySuccess = true;
			window.open('https://alice.yandex.ru/')
			
			// Сбрасываем индикатор через 2 секунды
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		} finally {
			copying = false;
		}
	}
</script>

<div class="chat-input-section">
	<div class="chat-input-container">
		<div class="input-wrapper">
			<textarea
				class="chat-input"
				bind:value={prompt}
				{placeholder}
				rows="20"
			></textarea>
			<div class="button-group">
				<button
					class="copy-button"
					on:click={handleCopyPrompt}
					disabled={!prompt.trim() || copying || loadingMessages}
					title={loadingMessages ? 'Загрузка сообщений...' : 'Скопировать промпт'}
					class:copied={copySuccess}
					class:loading={loadingMessages}
				>
					{#if loadingMessages}
						<span class="copy-icon">⏳</span>
					{:else if copySuccess}
						<span class="copy-icon">✓</span>
					{:else}
						<span class="copy-icon">📋</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Chat Input Section */
	.chat-input-section {
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-top: none;
		border-radius: 0 0 var(--border-radius) var(--border-radius);
		padding: var(--spacing-md);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	.chat-input-container {
		max-width: 100%;
	}

	.input-wrapper {
		display: flex;
		gap: var(--spacing-sm);
		align-items: flex-end;
	}

	.chat-input {
		flex: 1;
		padding: var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--border-radius);
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		resize: vertical;
		min-height: 60px;
		height: auto;
		background-color: var(--background);
		color: var(--text-primary);
		transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
	}

	.chat-input:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(0, 136, 204, 0.1);
	}

	.chat-input::placeholder {
		color: var(--text-secondary);
	}

	.button-group {
		display: flex;
		gap: var(--spacing-xs);
		flex-shrink: 0;
	}

	.copy-button {
		width: 48px;
		height: 48px;
		border: 1px solid var(--border);
		border-radius: 50%;
		background-color: var(--surface);
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.copy-button:hover:not(:disabled) {
		background-color: var(--background);
		border-color: var(--primary-color);
		transform: scale(1.05);
	}

	.copy-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.copy-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.copy-button.copied {
		background: linear-gradient(135deg, #28a745, #20c997);
		color: white;
		border-color: #28a745;
	}

	.copy-button.loading {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.copy-icon {
		display: inline-block;
	}

	/* Mobile adaptivity */
	@media (max-width: 768px) {
		.chat-input-section {
			padding: var(--spacing-sm);
		}

		.chat-input {
			font-size: 0.8125rem;
			padding: var(--spacing-sm);
			min-height: 50px;
		}

		.copy-button {
			width: 44px;
			height: 44px;
			font-size: 1.125rem;
		}
	}

	@media (max-width: 480px) {
		.input-wrapper {
			gap: var(--spacing-xs);
		}

		.button-group {
			gap: 4px;
		}

		.copy-button {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}
	}
</style>