import { BLANK } from './types/pixelart';
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
