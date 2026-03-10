<script lang="ts">
	import { BLANK } from '$lib/types/pixelart';
	import { hexToRgb, rgbToHex, rgbToHsl, formatColor } from '$lib/color';
	import {
		downloadSvg,
		downloadPng,
		downloadSave,
		loadSaveFromFile,
		sparseToCells
	} from '$lib/pixelart';

	async function handleLoad() {
		try {
			const data = await loadSaveFromFile();
			cols = data.cols;
			rows = data.rows;
			colsInput = data.cols;
			rowsInput = data.rows;
			cells = sparseToCells(data.cols, data.rows, data.pixels);
		} catch {
			// user cancelled or invalid file
		}
	}

	// grid state
	let cols = $state(32);
	let rows = $state(32);
	let colsInput = $state(32);
	let rowsInput = $state(32);
	let cells: string[] = $state(new Array(32 * 32).fill(BLANK));

	// color state
	let colorMode: 'rgb' | 'hsl' = $state('rgb');
	let r = $state(135),
		g = $state(206),
		b = $state(250);
	let h = $state(0),
		s = $state(100),
		l = $state(50);
	let alpha = $state(1);
	let pickerHex = $state('#87cefa');

	// zoom state
	const BASE_CELL = 16;
	const MIN_CELL = 4;
	const MAX_CELL = 80;
	let cellSize = $state(BASE_CELL);
	let zoomPercent = $derived(Math.round((cellSize / BASE_CELL) * 100));

	// paint state
	let painting = $state(false);
	let erasing = $state(false);

	// export
	let scale = $state(5);

	// --- computed ---
	let currentColor = $derived(formatColor(colorMode, { r, g, b }, { h, s, l }, alpha));

	// --- actions ---
	function applyGrid() {
		cols = Math.max(1, Math.min(128, colsInput || 32));
		rows = Math.max(1, Math.min(128, rowsInput || 32));
		colsInput = cols;
		rowsInput = rows;
		cells = new Array(cols * rows).fill(BLANK);
	}

	function clearGrid() {
		cells = new Array(cols * rows).fill(BLANK);
	}

	function syncFromPicker() {
		const rgb = hexToRgb(pickerHex);
		r = rgb.r;
		g = rgb.g;
		b = rgb.b;
		if (colorMode === 'hsl') {
			const hsl = rgbToHsl(r, g, b);
			h = hsl.h;
			s = hsl.s;
			l = hsl.l;
		}
	}

	function syncPickerFromRgb() {
		pickerHex = rgbToHex(r, g, b);
	}

	function switchMode() {
		if (colorMode === 'hsl') {
			const hsl = rgbToHsl(r, g, b);
			h = hsl.h;
			s = hsl.s;
			l = hsl.l;
		}
	}

	function paintCell(index: number, erase: boolean) {
		const color = erase ? BLANK : currentColor;
		cells[index] = color;
	}

	function zoomTo(size: number) {
		cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.round(size)));
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		zoomTo(cellSize + (e.deltaY < 0 ? 2 : -2));
	}

	function handlePointerDown(e: PointerEvent, index: number) {
		painting = true;
		erasing = e.button === 2;
		paintCell(index, erasing);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!painting) return;
		const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
		if (el?.dataset.i !== undefined) {
			paintCell(+el.dataset.i, erasing);
		}
	}

	function handleFit() {
		const container = document.getElementById('gridContainer');
		if (!container) return;
		const maxW = (container.clientWidth - 80) / cols;
		const maxH = (container.clientHeight - 60) / rows;
		zoomTo(Math.min(maxW, maxH));
	}

	// ruler helpers
	let rulerFontSize = $derived(Math.max(6, Math.min(11, cellSize * 0.4)));
	let rulerW = $derived(Math.max(16, cellSize * 0.8));
	let rulerH = $derived(Math.max(12, cellSize * 0.55));
</script>

<svelte:document oncontextmenu={(e) => e.preventDefault()} onpointerup={() => (painting = false)} />

<!-- Toolbar -->
<div
	class="relative flex shrink-0 items-center justify-center gap-1.5 rounded bg-gray-800 px-2 py-0.5 text-[11px] leading-tight shadow-lg"
>
	<!-- Left: GitHub -->
	<a
		href="https://github.com/ShinraMage/pixel-art-svg"
		target="_blank"
		rel="noopener"
		class="absolute left-2 flex items-center gap-0.5 text-gray-400 hover:text-gray-200"
		title="GitHub"
	>
		<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 16 16"
			><path
				d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"
			/></svg
		>
		<span>Pixel Art SVG</span>
	</a>

	<!-- Center controls -->
	<span class="text-gray-600">|</span>

	<label class="flex items-center gap-0.5"
		>Cols(X)<input
			type="number"
			min="1"
			max="128"
			bind:value={colsInput}
			class="w-10 rounded bg-gray-700 px-0.5 text-center text-[11px]"
		/></label
	>
	<label class="flex items-center gap-0.5"
		>Rows(Y)<input
			type="number"
			min="1"
			max="128"
			bind:value={rowsInput}
			class="w-10 rounded bg-gray-700 px-0.5 text-center text-[11px]"
		/></label
	>
	<button onclick={applyGrid} class="rounded bg-blue-600 px-1.5 font-semibold hover:bg-blue-500"
		>Go</button
	>

	<span class="text-gray-600">|</span>

	<select
		bind:value={colorMode}
		onchange={switchMode}
		class="rounded bg-gray-700 px-0.5 text-[11px]"
	>
		<option value="rgb">RGB</option>
		<option value="hsl">HSL</option>
	</select>

	{#if colorMode === 'rgb'}
		<div class="flex items-center gap-0.5">
			<input
				type="number"
				min="0"
				max="255"
				bind:value={r}
				oninput={syncPickerFromRgb}
				class="w-9 rounded bg-gray-700 px-0.5 text-center text-[11px]"
				title="R"
			/>
			<input
				type="number"
				min="0"
				max="255"
				bind:value={g}
				oninput={syncPickerFromRgb}
				class="w-9 rounded bg-gray-700 px-0.5 text-center text-[11px]"
				title="G"
			/>
			<input
				type="number"
				min="0"
				max="255"
				bind:value={b}
				oninput={syncPickerFromRgb}
				class="w-9 rounded bg-gray-700 px-0.5 text-center text-[11px]"
				title="B"
			/>
		</div>
	{:else}
		<div class="flex items-center gap-0.5">
			<input
				type="number"
				min="0"
				max="360"
				bind:value={h}
				class="w-9 rounded bg-gray-700 px-0.5 text-center text-[11px]"
				title="H"
			/>
			<input
				type="number"
				min="0"
				max="100"
				bind:value={s}
				class="w-9 rounded bg-gray-700 px-0.5 text-center text-[11px]"
				title="S%"
			/>
			<input
				type="number"
				min="0"
				max="100"
				bind:value={l}
				class="w-9 rounded bg-gray-700 px-0.5 text-center text-[11px]"
				title="L%"
			/>
		</div>
	{/if}

	<input
		type="number"
		min="0"
		max="1"
		step="0.1"
		bind:value={alpha}
		class="w-8 rounded bg-gray-700 px-0.5 text-center text-[11px]"
		title="Alpha"
	/>

	<div class="relative h-5 w-5 shrink-0">
		<div
			class="h-5 w-5 cursor-pointer rounded border border-gray-600"
			style:background-color={currentColor}
			title="Click to pick color"
		></div>
		<input
			type="color"
			bind:value={pickerHex}
			oninput={syncFromPicker}
			class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
		/>
	</div>

	<span class="text-gray-600">|</span>

	<select bind:value={scale} class="rounded bg-gray-700 px-0.5 text-[11px]" title="Export Scale">
		<option value={1}>1x</option>
		<option value={2}>2x</option>
		<option value={3}>3x</option>
		<option value={5}>5x</option>
		<option value={8}>8x</option>
		<option value={10}>10x</option>
		<option value={16}>16x</option>
		<option value={32}>32x</option>
	</select>
	<button
		onclick={() => downloadSvg(cols, rows, cells, scale)}
		class="rounded bg-emerald-600 px-1.5 font-semibold hover:bg-emerald-500">SVG</button
	>
	<button
		onclick={() => downloadPng(cols, rows, cells, scale)}
		class="rounded bg-purple-600 px-1.5 font-semibold hover:bg-purple-500">PNG</button
	>
	<button onclick={clearGrid} class="rounded bg-red-600 px-1.5 font-semibold hover:bg-red-500"
		>Clear</button
	>
	<span class="text-gray-600">|</span>
	<button
		onclick={() => downloadSave(cols, rows, cells)}
		class="rounded bg-amber-600 px-1.5 font-semibold hover:bg-amber-500">Save</button
	>
	<button onclick={handleLoad} class="rounded bg-cyan-600 px-1.5 font-semibold hover:bg-cyan-500"
		>Load</button
	>

	<!-- Right: Shinra Mage -->
	<span class="absolute right-2 flex items-center gap-0.5 text-gray-400">
		<img src="https://posetmage.com/Images/Icon/ShinraMage.svg" alt="" class="h-3 w-3" />
		<span>Shinra Mage</span>
	</span>
</div>

<!-- Canvas -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	id="gridContainer"
	class="relative flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-gray-800 p-1 shadow-lg"
	onwheel={handleWheel}
	onpointermove={handlePointerMove}
>
	<!-- Zoom overlay -->
	<div
		class="absolute top-1 left-1 z-10 flex items-center gap-1 rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] backdrop-blur-sm"
	>
		<button
			onclick={() => zoomTo(cellSize - 4)}
			class="rounded bg-gray-700 px-1 font-bold hover:bg-gray-600">-</button
		>
		<span class="w-8 text-center tabular-nums">{zoomPercent}%</span>
		<button
			onclick={() => zoomTo(cellSize + 4)}
			class="rounded bg-gray-700 px-1 font-bold hover:bg-gray-600">+</button
		>
		<button onclick={handleFit} class="rounded bg-gray-700 px-1 hover:bg-gray-600">Fit</button>
	</div>

	<!-- Grid with rulers -->
	<div class="inline-grid" style="grid-template-columns: auto auto auto; gap: 0;">
		<!-- top-left corner -->
		<div></div>
		<!-- top ruler -->
		<div class="grid" style:grid-template-columns="repeat({cols}, {cellSize}px)" style="gap:0;">
			{#each Array(cols) as _, c}
				<div
					class="ruler-label"
					style:width="{cellSize}px"
					style:height="{rulerH}px"
					style:font-size="{rulerFontSize}px"
				>
					{c + 1}
				</div>
			{/each}
		</div>
		<!-- top-right corner -->
		<div></div>

		<!-- left ruler -->
		<div class="grid" style:grid-template-rows="repeat({rows}, {cellSize}px)" style="gap:0;">
			{#each Array(rows) as _, rv}
				<div
					class="ruler-label"
					style:width="{rulerW}px"
					style:height="{cellSize}px"
					style:font-size="{rulerFontSize}px"
				>
					{rv + 1}
				</div>
			{/each}
		</div>

		<!-- pixel grid -->
		<div
			class="grid select-none"
			style:grid-template-columns="repeat({cols}, {cellSize}px)"
			style:grid-template-rows="repeat({rows}, {cellSize}px)"
			style="gap:0; touch-action:none;"
		>
			{#each cells as color, i}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="cell"
					class:painted={color !== BLANK}
					style:width="{cellSize}px"
					style:height="{cellSize}px"
					style:background-color={color}
					data-i={i}
					onpointerdown={(e) => handlePointerDown(e, i)}
				></div>
			{/each}
		</div>

		<!-- right ruler -->
		<div class="grid" style:grid-template-rows="repeat({rows}, {cellSize}px)" style="gap:0;">
			{#each Array(rows) as _, rv}
				<div
					class="ruler-label"
					style:width="{rulerW}px"
					style:height="{cellSize}px"
					style:font-size="{rulerFontSize}px"
				>
					{rv + 1}
				</div>
			{/each}
		</div>

		<!-- bottom-left corner -->
		<div></div>
		<!-- bottom ruler -->
		<div class="grid" style:grid-template-columns="repeat({cols}, {cellSize}px)" style="gap:0;">
			{#each Array(cols) as _, c}
				<div
					class="ruler-label"
					style:width="{cellSize}px"
					style:height="{rulerH}px"
					style:font-size="{rulerFontSize}px"
				>
					{c + 1}
				</div>
			{/each}
		</div>
		<!-- bottom-right corner -->
		<div></div>
	</div>
</div>

<style>
	.cell {
		box-sizing: border-box;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background-image:
			linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
			linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%);
		background-size: 8px 8px;
		background-position:
			0 0,
			0 4px,
			4px -4px,
			-4px 0;
	}
	.cell.painted {
		background-image: none;
	}
	.cell:hover {
		outline: 2px solid rgba(59, 130, 246, 0.7);
		outline-offset: -2px;
		z-index: 1;
	}
	.ruler-label {
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.45);
		font-family: monospace;
		user-select: none;
	}
</style>
