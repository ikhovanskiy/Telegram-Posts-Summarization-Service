<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { page } from '$app/stores';
	
	// Показываем header на всех страницах кроме главной и страницы авторизации
	$: showHeader = $page.url.pathname !== '/' && $page.url.pathname !== '/auth';
</script>

{#if showHeader}
	<Header />
{/if}

<slot />