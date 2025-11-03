<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let userId = '';
	let loading = false;

	onMount(() => {
		userId = localStorage.getItem('userId') || '';
		if (!userId) {
			goto('/auth');
		}
	});

	function handleLogout() {
		localStorage.removeItem('userId');
		localStorage.removeItem('sessionString');
		goto('/auth');
	}
</script>

<svelte:head>
	<title>Личный кабинет - Суммаризация постов Telegram</title>
	<link rel="stylesheet" href="/styles/app.css" />
</svelte:head>

<div class="container-sm">
	<h1>Личный кабинет</h1>

	<div class="card">
		<h3>Информация о пользователе</h3>
		<div class="profile-info">
			<div class="info-row">
				<span class="info-label">User ID:</span>
				<span class="info-value">{userId || 'Не авторизован'}</span>
			</div>
		</div>
	</div>

	<div class="card">
		<h3>Действия</h3>
		<button class="btn btn-primary btn-block" on:click={handleLogout} disabled={loading}>
			Выйти из аккаунта
		</button>
	</div>
</div>

<style>
	.profile-info {
		margin-top: var(--spacing-md);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: var(--spacing-sm) 0;
		border-bottom: 1px solid var(--border);
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-weight: 500;
		color: var(--text-secondary);
	}

	.info-value {
		color: var(--text-primary);
		font-family: 'Monaco', 'Menlo', monospace;
	}
</style>