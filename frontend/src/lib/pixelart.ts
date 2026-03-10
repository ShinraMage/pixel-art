import { BLANK, type SaveData } from './types/pixelart';
import { colorToRgba } from './color';

export function buildSvgString(cols: number, rows: number, cells: string[], scale: number): string {
	const w = cols * scale;
	const h = rows * scale;

	let rects = '';
	for (let i = 0; i < cells.length; i++) {
		if (cells[i] === BLANK) continue;
		const x = (i % cols) * scale;
		const y = Math.floor(i / cols) * scale;
		const fill = colorToRgba(cells[i]);
		rects += `  <rect x="${x}" y="${y}" width="${scale}" height="${scale}" fill="${fill}"/>\n`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">\n${rects}</svg>`;
}

export function downloadSvg(cols: number, rows: number, cells: string[], scale: number): void {
	const svg = buildSvgString(cols, rows, cells, scale);
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `pixel-art-${cols}x${rows}.svg`;
	a.click();
	URL.revokeObjectURL(url);
}

export function downloadPng(cols: number, rows: number, cells: string[], scale: number): void {
	const w = cols * scale;
	const h = rows * scale;
	const svg = buildSvgString(cols, rows, cells, scale);
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const img = new Image();
	img.onload = () => {
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(img, 0, 0);
		URL.revokeObjectURL(url);
		canvas.toBlob((pngBlob) => {
			if (!pngBlob) return;
			const purl = URL.createObjectURL(pngBlob);
			const a = document.createElement('a');
			a.href = purl;
			a.download = `pixel-art-${cols}x${rows}.png`;
			a.click();
			URL.revokeObjectURL(purl);
		});
	};
	img.src = url;
}

/** Parse "rgba(r, g, b, a)" or "hsla(...)" to [r,g,b,a(0-255)] via DOM */
function colorToInts(color: string): [number, number, number, number] {
	const tmp = document.createElement('div');
	tmp.style.color = color;
	document.body.appendChild(tmp);
	const computed = getComputedStyle(tmp).color;
	document.body.removeChild(tmp);
	const m = computed.match(/[\d.]+/g);
	if (!m) return [0, 0, 0, 255];
	const a = m[3] !== undefined ? Math.round(parseFloat(m[3]) * 255) : 255;
	return [+m[0], +m[1], +m[2], a];
}

export function cellsToSparse(cols: number, cells: string[]): SaveData['pixels'] {
	const rows = cells.length / cols;
	const pixels: SaveData['pixels'] = [];

	// scan row by row for horizontal runs
	for (let y = 0; y < rows; y++) {
		let x = 0;
		while (x < cols) {
			const i = y * cols + x;
			if (cells[i] === BLANK) { x++; continue; }

			const [r, g, b, a] = colorToInts(cells[i]);
			let x2 = x + 1;
			while (x2 < cols) {
				const j = y * cols + x2;
				if (cells[j] === BLANK) break;
				const [r2, g2, b2, a2] = colorToInts(cells[j]);
				if (r !== r2 || g !== g2 || b !== b2 || a !== a2) break;
				x2++;
			}
			x2--;

			if (x2 > x) {
				pixels.push([r, g, b, a, y, x, x2]);
			} else {
				pixels.push([r, g, b, a, y, x]);
			}
			x = x2 + 1;
		}
	}
	return pixels;
}

function intToColor(r: number, g: number, b: number, a: number): string {
	return a < 255 ? `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
}

export function sparseToCells(cols: number, rows: number, pixels: SaveData['pixels']): string[] {
	const cells = new Array(cols * rows).fill(BLANK);
	for (const p of pixels) {
		const [r, g, b, a, y, x1] = p;
		const x2 = p.length === 7 ? p[6] : x1;
		const color = intToColor(r, g, b, a);
		for (let x = x1; x <= x2; x++) {
			const i = y * cols + x;
			if (i >= 0 && i < cells.length) {
				cells[i] = color;
			}
		}
	}
	return cells;
}

export function serializeSave(cols: number, rows: number, cells: string[]): string {
	const data: SaveData = { cols, rows, pixels: cellsToSparse(cols, cells) };
	return JSON.stringify(data, null, 2);
}

export function parseSave(json: string): SaveData {
	const data = JSON.parse(json) as SaveData;
	if (
		typeof data.cols !== 'number' ||
		typeof data.rows !== 'number' ||
		!Array.isArray(data.pixels)
	) {
		throw new Error('Invalid save file');
	}
	return data;
}

export function downloadSave(cols: number, rows: number, cells: string[]): void {
	const json = serializeSave(cols, rows, cells);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'save.json';
	a.click();
	URL.revokeObjectURL(url);
}

export function loadSaveFromFile(): Promise<SaveData> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return reject(new Error('No file selected'));
			const reader = new FileReader();
			reader.onload = () => {
				try {
					resolve(parseSave(reader.result as string));
				} catch (e) {
					reject(e);
				}
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsText(file);
		};
		input.click();
	});
}
