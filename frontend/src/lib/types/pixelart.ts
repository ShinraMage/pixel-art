export type ColorMode = 'rgb' | 'hsl';

export interface RgbColor {
	r: number;
	g: number;
	b: number;
}

export interface HslColor {
	h: number;
	s: number;
	l: number;
}

export interface PixelGrid {
	cols: number;
	rows: number;
	cells: string[]; // flat array of color strings, length = cols * rows
}

/** [r,g,b,a, y, x] single pixel or [r,g,b,a, y, x1, x2] horizontal span fill */
export type SparsePixel = [number, number, number, number, number, number]
	| [number, number, number, number, number, number, number];

export interface SaveData {
	cols: number;
	rows: number;
	pixels: SparsePixel[];
}

export const BLANK = 'rgba(0,0,0,0)';
