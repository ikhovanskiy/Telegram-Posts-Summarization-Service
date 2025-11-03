<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';

	let phoneNumber = '';
	let code = '';
	let password = '';
	let phoneCodeHash = '';
	let step: 'phone' | 'code' | 'password' = 'phone';
	let loading = false;
	let error = '';

	async function sendCode() {
		loading = true;
		error = '';

		try {
			const result = await api.sendCode(phoneNumber);
			if (result.error) {
				error = result.error;
				return;
			}
			phoneCodeHash = result.phoneCodeHash || '';
			step = 'code';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Произошла ошибка';
		} finally {
			loading = false;
		}
	}

	async function signIn() {
		loading = true;
		error = '';

		try {
			const result = await api.signIn(phoneNumber, code, phoneCodeHash, password || undefined);
			if (result.error) {
				// Проверяем, требуется ли пароль
				if (result.error === 'PASSWORD_REQUIRED') {
					step = 'password';
					error = '';
					return;
				}
				error = result.error;
				return;
			}
			if (result.userId && result.sessionString) {
				localStorage.setItem('userId', result.userId);
				localStorage.setItem('sessionString', result.sessionString);
				goto('/scenarios');
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Произошла ошибка';
		} finally {
			loading = false;
		}
	}

	function handlePhoneSubmit(e: Event) {
		e.preventDefault();
		sendCode();
	}

	function handleCodeSubmit(e: Event) {
		e.preventDefault();
		signIn();
	}

	function handlePasswordSubmit(e: Event) {
		e.preventDefault();
		signIn();
	}
</script>

<svelte:head>
	<title>Авторизация - Суммаризация постов Telegram</title>
	<link rel="stylesheet" href="/styles/app.css" />
</svelte:head>

<div class="container-sm">
	<h1>Авторизация</h1>

	{#if step === 'phone'}
		<form on:submit={handlePhoneSubmit}>
			<div class="form-group">
				<label for="phone" class="form-label">Номер телефона</label>
				<input
					id="phone"
					type="tel"
					bind:value={phoneNumber}
					placeholder="+7 XXX XXX XX XX"
					class="form-input"
					required
					disabled={loading}
				/>
			</div>
			<button type="submit" disabled={loading} class="btn btn-primary btn-block">
				{loading ? 'Отправка...' : 'Отправить код'}
			</button>
		</form>
	{:else if step === 'code'}
		<form on:submit={handleCodeSubmit}>
			<p class="text-secondary mb-md">Код отправлен на {phoneNumber}</p>
			<div class="form-group">
				<label for="code" class="form-label">Код из Telegram</label>
				<input
					id="code"
					type="text"
					bind:value={code}
					placeholder="12345"
					class="form-input"
					required
					disabled={loading}
				/>
			</div>
			<button type="submit" disabled={loading} class="btn btn-primary btn-block">
				{loading ? 'Вход...' : 'Войти'}
			</button>
		</form>
	{:else if step === 'password'}
		<form on:submit={handlePasswordSubmit}>
			<p class="text-secondary mb-md">Требуется пароль двухфакторной аутентификации</p>
			<div class="form-group">
				<label for="password" class="form-label">Пароль 2FA</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Введите пароль"
					class="form-input"
					required
					disabled={loading}
				/>
			</div>
			<button type="submit" disabled={loading} class="btn btn-primary btn-block">
				{loading ? 'Вход...' : 'Войти'}
			</button>
		</form>
	{/if}

	{#if error}
		<div class="error">{error}</div>
	{/if}
</div>