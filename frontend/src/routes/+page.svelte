<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let isAuthenticated = false;

	onMount(() => {
		const userId = localStorage.getItem('userId');
		isAuthenticated = !!userId;
	});

	function handleAuth() {
		goto('/auth');
	}

	function handleScenarios() {
		goto('/scenarios');
	}
</script>

<svelte:head>
	<title>Суммаризация постов Telegram</title>
	<link rel="stylesheet" href="/styles/app.css" />
</svelte:head>

<div class="container">
	<h1>📊 Суммаризация постов Telegram</h1>

	<div class="container-sm">
		<p>
			Создавайте краткие дайджесты из постов ваших Telegram-групп с помощью искусственного
			интеллекта.
		</p>

		{#if isAuthenticated}
			<button on:click={handleScenarios} class="btn btn-primary btn-block">
				Перейти к сценариям
			</button>
		{:else}
			<button on:click={handleAuth} class="btn btn-primary btn-block">
				Войти через Telegram
			</button>
		{/if}
	</div>
</div>