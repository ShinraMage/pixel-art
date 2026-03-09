<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Pixel Art Editor</title>
</svelte:head>

<div class="flex h-screen flex-col bg-gray-900 text-gray-100">
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
	}
</style>
