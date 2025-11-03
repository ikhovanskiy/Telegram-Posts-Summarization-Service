<script lang="ts">
	import { page } from '$app/stores';
	import { headerActions } from '$lib/stores/headerActions';
	
	$: currentPath = $page.url.pathname;
	
	let mobileMenuOpen = false;
	
	// Закрываем меню при смене маршрута
	$: if (currentPath) {
		mobileMenuOpen = false;
	}
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header class="header">
	<div class="header-container">
		<div class="header-left">
			{#if $headerActions.length > 0}
				<!-- Показываем последнюю кнопку (обычно "назад") вместо логотипа -->
				{@const backAction = $headerActions[$headerActions.length - 1]}
				<button class="back-button" on:click={backAction.onClick}>
					{#if backAction.icon}{backAction.icon}{/if} Назад
				</button>
			{:else}
				<div class="header-brand">
					<a href="/scenarios" class="brand-link">
						📊 Telegram Digest
					</a>
				</div>
				<nav class="header-nav desktop-nav">
					<a
						href="/profile"
						class="nav-link"
						class:active={currentPath.startsWith('/profile')}
					>
						👤 Профиль
					</a>
				</nav>
			{/if}
		</div>
		
		<div class="header-right">
			{#if $headerActions.length > 1}
				<!-- Показываем остальные кнопки действий (кроме последней) -->
				<div class="header-actions desktop-actions">
					{#each $headerActions.slice(0, -1) as action}
						<button class="btn action-btn" on:click={action.onClick}>
							{#if action.icon}{action.icon}{/if}
							{#if action.label}{action.label}{/if}
						</button>
					{/each}
				</div>
			{/if}
			
			<!-- Burger menu button -->
			<button
				class="burger-button"
				on:click={toggleMobileMenu}
				aria-label="Меню"
			>
				<span class="burger-line" class:open={mobileMenuOpen}></span>
				<span class="burger-line" class:open={mobileMenuOpen}></span>
				<span class="burger-line" class:open={mobileMenuOpen}></span>
			</button>
		</div>
	</div>
	
	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="mobile-menu" on:click={closeMobileMenu}>
			<nav class="mobile-nav">
				<a
					href="/profile"
					class="mobile-nav-link"
					class:active={currentPath.startsWith('/profile')}
				>
					👤 Профиль
				</a>
			</nav>
			
			{#if $headerActions.length > 1}
				<div class="mobile-actions">
					{#each $headerActions.slice(0, -1) as action}
						<button class="btn mobile-action-btn" on:click={action.onClick}>
							{#if action.icon}{action.icon}{/if}
							{#if action.label}{action.label}{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</header>

<style>
	.header {
		background-color: var(--surface);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--spacing-lg);
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
		gap: var(--spacing-lg);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-xl);
		flex: 1;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.header-brand {
		font-size: 1.25rem;
		font-weight: 700;
	}

	.brand-link {
		color: var(--text-primary);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.brand-link:hover {
		color: var(--primary-color);
	}

	.back-button {
		background: none;
		border: none;
		color: var(--text-primary);
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		padding: 8px 16px;
		border-radius: var(--border-radius);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.back-button:hover {
		color: var(--primary-color);
		background-color: rgba(0, 136, 204, 0.05);
	}

	.action-btn {
		min-width: 44px;
		height: 44px;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
	}

	.header-nav {
		display: flex;
		gap: var(--spacing-md);
	}

	.nav-link {
		padding: 8px 16px;
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		border-radius: var(--border-radius);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.nav-link:hover {
		color: var(--primary-color);
		background-color: rgba(0, 136, 204, 0.05);
	}

	.nav-link.active {
		color: var(--primary-color);
		background-color: rgba(0, 136, 204, 0.1);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	/* Burger button */
	.burger-button {
		display: none;
		flex-direction: column;
		justify-content: space-around;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 4px;
		z-index: 101;
	}

	.burger-line {
		width: 100%;
		height: 3px;
		background-color: var(--text-primary);
		border-radius: 2px;
		transition: all 0.3s ease;
		transform-origin: center;
	}

	.burger-line.open:nth-child(1) {
		transform: translateY(9px) rotate(45deg);
	}

	.burger-line.open:nth-child(2) {
		opacity: 0;
	}

	.burger-line.open:nth-child(3) {
		transform: translateY(-9px) rotate(-45deg);
	}

	/* Mobile menu */
	.mobile-menu {
		display: none;
		position: absolute;
		top: 64px;
		left: 0;
		right: 0;
		background-color: var(--surface);
		border-bottom: 1px solid var(--border);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
		padding: var(--spacing-md);
		animation: slideDown 0.3s ease;
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.mobile-nav {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-md);
	}

	.mobile-nav-link {
		padding: 12px 16px;
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		border-radius: var(--border-radius);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.mobile-nav-link:hover {
		color: var(--primary-color);
		background-color: rgba(0, 136, 204, 0.05);
	}

	.mobile-nav-link.active {
		color: var(--primary-color);
		background-color: rgba(0, 136, 204, 0.1);
	}

	.mobile-actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--border);
	}

	.mobile-action-btn {
		width: 100%;
		justify-content: center;
	}

	/* Tablet and mobile */
	@media (max-width: 768px) {
		.desktop-nav {
			display: none;
		}

		.desktop-actions {
			display: none;
		}

		.burger-button {
			display: flex;
		}

		.mobile-menu {
			display: block;
		}
	}

	@media (max-width: 640px) {
		.header-container {
			padding: 0 var(--spacing-md);
			height: 56px;
		}

		.header-brand {
			font-size: 1rem;
		}

		.back-button {
			font-size: 1rem;
			padding: 6px 12px;
		}

		.mobile-menu {
			top: 56px;
		}
	}
</style>
