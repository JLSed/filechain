import { jsPDF } from 'jspdf';

// ── Types ──────────────────────────────────────────────────────────────

/** Colors used throughout PDF generation. */
const PDF_COLORS = {
	primary: [30, 64, 175] as const, // blue-800
	text: [17, 24, 39] as const, // gray-900
	textMuted: [107, 114, 128] as const, // gray-500
	positive: [16, 185, 129] as const, // emerald-500
	negative: [239, 68, 68] as const, // red-500
	neutral: [59, 130, 246] as const, // blue-500
	headerBg: [239, 246, 255] as const, // blue-50
	rowAltBg: [249, 250, 251] as const, // gray-50
	border: [229, 231, 235] as const, // gray-200
	white: [255, 255, 255] as const
} as const;

/** Page layout constants (mm). */
const LAYOUT = {
	marginX: 14,
	marginTop: 14,
	marginBottom: 14,
	pageWidth: 210, // A4 width
	pageHeight: 297, // A4 height
	get contentWidth() {
		return this.pageWidth - this.marginX * 2;
	},
	get maxY() {
		return this.pageHeight - this.marginBottom;
	}
} as const;

export interface PdfSummaryCard {
	label: string;
	value: string;
	/** Optional subtitle below the value. */
	subtitle?: string;
}

export interface PdfTableColumn {
	header: string;
	/** Key or accessor to get the cell value from row data. */
	key: string;
	/** Alignment: 'left' (default) or 'right'. */
	align?: 'left' | 'right';
	/** Column width fraction (0-1). If omitted, columns share remaining space equally. */
	widthFraction?: number;
}

export interface PdfTableOptions {
	columns: PdfTableColumn[];
	rows: Record<string, string | number>[];
	/** Optional title rendered above the table. */
	title?: string;
}

export interface PdfHighlight {
	text: string;
	type: 'positive' | 'neutral' | 'negative';
}

export interface PdfHeaderOptions {
	companyName: string;
	subtitle: string;
	periodLabel: string;
	generatedAt: string;
}

export interface PdfFooterOptions {
	companyName: string;
	contactInfo?: string;
	registeredAddress?: string;
}

// ── SVG-to-Image Utility ───────────────────────────────────────────────

/**
 * Converts an SVG DOM element to a JPEG data URL suitable for embedding in a PDF.
 *
 * @param svgElement - The SVG element from the rendered DOM.
 * @param width - Target width in pixels.
 * @param height - Target height in pixels.
 * @returns A JPEG data URL.
 */
export async function svgToImageDataUrl(
	svgElement: SVGSVGElement,
	width: number,
	height: number
): Promise<string> {
	// Clone the SVG so we don't mutate the live DOM
	const clone = svgElement.cloneNode(true) as SVGSVGElement;
	clone.setAttribute('width', String(width));
	clone.setAttribute('height', String(height));

	// Inline any computed styles that matter for rendering
	inlineSvgStyles(clone);

	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(clone);
	const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(svgBlob);

	try {
		return await new Promise<string>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = width * 2; // 2x for sharpness
				canvas.height = height * 2;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL('image/jpeg', 0.92));
			};
			img.onerror = () => reject(new Error('Failed to load SVG as image'));
			img.src = url;
		});
	} finally {
		URL.revokeObjectURL(url);
	}
}

/**
 * Inlines computed styles on SVG elements that are often defined via CSS classes,
 * ensuring the serialised SVG renders correctly when loaded as an image.
 */
function inlineSvgStyles(svg: SVGSVGElement): void {
	const elements = svg.querySelectorAll('*');
	const computed = new Map<Element, CSSStyleDeclaration>();

	// Pre-compute styles – we need the originals before mutations
	elements.forEach((el) => computed.set(el, window.getComputedStyle(el)));

	elements.forEach((el) => {
		const style = computed.get(el);
		if (!style) return;
		const inline = (el as SVGElement).style;

		// Copy critical rendering properties
		const props = [
			'fill',
			'stroke',
			'stroke-width',
			'opacity',
			'font-family',
			'font-size',
			'font-weight',
			'text-anchor',
			'dominant-baseline',
			'transform',
			'visibility',
			'display'
		];
		for (const prop of props) {
			const val = style.getPropertyValue(prop);
			if (val && !inline.getPropertyValue(prop)) {
				inline.setProperty(prop, val);
			}
		}
	});
}

// ── PdfReportBuilder ───────────────────────────────────────────────────

/**
 * A fluent, data-driven builder for generating PDF reports using jsPDF.
 *
 * @example
 * ```ts
 * const builder = new PdfReportBuilder();
 * builder
 *   .addHeader({ companyName: 'ACME', subtitle: 'Monthly Report', periodLabel: 'Jan 2026', generatedAt: '...' })
 *   .addSummaryCards([{ label: 'Total', value: '42' }])
 *   .addTable({ columns: [...], rows: [...] })
 *   .addHighlights([{ text: 'Revenue grew', type: 'positive' }])
 *   .addFooter({ companyName: 'ACME' });
 * await builder.save('report');
 * ```
 */
export class PdfReportBuilder {
	private readonly doc: jsPDF;
	private y: number;

	constructor() {
		this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
		this.doc.setFont('helvetica');
		this.y = LAYOUT.marginTop;
	}

	// ── Internal helpers ─────────────────────────────────────────────

	/** Ensures there is enough room for `requiredMm`; adds a new page if not. */
	private ensureSpace(requiredMm: number): void {
		if (this.y + requiredMm > LAYOUT.maxY) {
			this.doc.addPage();
			this.y = LAYOUT.marginTop;
		}
	}

	/** Draws a horizontal rule at the current Y position. */
	private drawRule(color: readonly [number, number, number] = PDF_COLORS.border): void {
		this.doc.setDrawColor(...color);
		this.doc.setLineWidth(0.3);
		this.doc.line(LAYOUT.marginX, this.y, LAYOUT.marginX + LAYOUT.contentWidth, this.y);
		this.y += 3;
	}

	/** Draws a section title. */
	private drawSectionTitle(title: string): void {
		this.ensureSpace(12);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(11);
		this.doc.setTextColor(...PDF_COLORS.text);
		this.doc.text(title, LAYOUT.marginX, this.y);
		this.y += 6;
	}

	// ── Public API ──────────────────────────────────────────────────

	/**
	 * Adds a report header with company name, report title, period, and generation date.
	 */
	addHeader(opts: PdfHeaderOptions): this {
		const { companyName, subtitle, periodLabel, generatedAt } = opts;

		// Company name
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(16);
		this.doc.setTextColor(...PDF_COLORS.primary);
		this.doc.text(companyName, LAYOUT.marginX, this.y);
		this.y += 5;

		// Subtitle
		this.doc.setFont('helvetica', 'normal');
		this.doc.setFontSize(10);
		this.doc.setTextColor(...PDF_COLORS.textMuted);
		this.doc.text(subtitle, LAYOUT.marginX, this.y);
		this.y += 6;

		// Period and generated date — right-aligned
		const rightX = LAYOUT.marginX + LAYOUT.contentWidth;
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(11);
		this.doc.setTextColor(...PDF_COLORS.text);
		this.doc.text(periodLabel, rightX, this.y - 11, { align: 'right' });

		this.doc.setFont('helvetica', 'normal');
		this.doc.setFontSize(8);
		this.doc.setTextColor(...PDF_COLORS.textMuted);
		this.doc.text(`Generated: ${generatedAt}`, rightX, this.y - 6, { align: 'right' });

		this.drawRule(PDF_COLORS.primary);
		this.y += 2;
		return this;
	}

	/**
	 * Adds summary metric cards displayed horizontally.
	 */
	addSummaryCards(cards: PdfSummaryCard[]): this {
		if (cards.length === 0) return this;

		this.ensureSpace(22);

		const cardWidth = LAYOUT.contentWidth / cards.length;
		const cardHeight = 18;
		const padding = 3;

		cards.forEach((card, i) => {
			const x = LAYOUT.marginX + i * cardWidth;

			// Card background
			this.doc.setFillColor(...PDF_COLORS.headerBg);
			this.doc.roundedRect(
				x + (i > 0 ? 1 : 0),
				this.y,
				cardWidth - (i > 0 ? 1 : 0) - (i < cards.length - 1 ? 1 : 0),
				cardHeight,
				2,
				2,
				'F'
			);

			// Label
			this.doc.setFont('helvetica', 'normal');
			this.doc.setFontSize(7);
			this.doc.setTextColor(...PDF_COLORS.textMuted);
			this.doc.text(card.label, x + padding + (i > 0 ? 1 : 0), this.y + 5);

			// Value
			this.doc.setFont('helvetica', 'bold');
			this.doc.setFontSize(13);
			this.doc.setTextColor(...PDF_COLORS.text);
			this.doc.text(card.value, x + padding + (i > 0 ? 1 : 0), this.y + 12);

			// Subtitle
			if (card.subtitle) {
				this.doc.setFont('helvetica', 'normal');
				this.doc.setFontSize(6.5);
				this.doc.setTextColor(...PDF_COLORS.textMuted);
				this.doc.text(card.subtitle, x + padding + (i > 0 ? 1 : 0), this.y + 16);
			}
		});

		this.y += cardHeight + 6;
		return this;
	}

	/**
	 * Adds a data table with headers, rows, and optional title.
	 * Automatically paginates rows that overflow the page.
	 */
	addTable(opts: PdfTableOptions): this {
		const { columns, rows, title } = opts;
		if (columns.length === 0) return this;

		if (title) {
			this.drawSectionTitle(title);
		}

		// Compute column widths
		const explicitWidth = columns.reduce((sum, c) => sum + (c.widthFraction ?? 0), 0);
		const autoCount = columns.filter((c) => !c.widthFraction).length;
		const autoFraction = autoCount > 0 ? (1 - explicitWidth) / autoCount : 0;
		const colWidths = columns.map((c) => (c.widthFraction ?? autoFraction) * LAYOUT.contentWidth);

		const rowHeight = 6;
		const headerHeight = 7;

		const drawHeader = () => {
			this.ensureSpace(headerHeight + rowHeight);

			// Header background
			this.doc.setFillColor(...PDF_COLORS.headerBg);
			this.doc.rect(LAYOUT.marginX, this.y - 0.5, LAYOUT.contentWidth, headerHeight, 'F');

			this.doc.setFont('helvetica', 'bold');
			this.doc.setFontSize(7);
			this.doc.setTextColor(...PDF_COLORS.textMuted);

			let cx = LAYOUT.marginX;
			columns.forEach((col, i) => {
				const textX = col.align === 'right' ? cx + colWidths[i] - 2 : cx + 2;
				this.doc.text(col.header, textX, this.y + 4, {
					align: col.align === 'right' ? 'right' : 'left'
				});
				cx += colWidths[i];
			});

			this.y += headerHeight;
		};

		drawHeader();

		// Rows
		rows.forEach((row, rowIdx) => {
			if (this.y + rowHeight > LAYOUT.maxY) {
				this.doc.addPage();
				this.y = LAYOUT.marginTop;
				drawHeader();
			}

			// Alternate row background
			if (rowIdx % 2 === 1) {
				this.doc.setFillColor(...PDF_COLORS.rowAltBg);
				this.doc.rect(LAYOUT.marginX, this.y - 0.5, LAYOUT.contentWidth, rowHeight, 'F');
			}

			this.doc.setFont('helvetica', 'normal');
			this.doc.setFontSize(7);
			this.doc.setTextColor(...PDF_COLORS.text);

			let cx = LAYOUT.marginX;
			columns.forEach((col, i) => {
				const val = String(row[col.key] ?? '');
				const textX = col.align === 'right' ? cx + colWidths[i] - 2 : cx + 2;
				// Truncate if too wide
				const maxChars = Math.floor(colWidths[i] / 1.6);
				const truncated = val.length > maxChars ? val.slice(0, maxChars - 1) + '…' : val;
				this.doc.text(truncated, textX, this.y + 3.5, {
					align: col.align === 'right' ? 'right' : 'left'
				});
				cx += colWidths[i];
			});

			// Row border
			this.doc.setDrawColor(...PDF_COLORS.border);
			this.doc.setLineWidth(0.15);
			this.doc.line(
				LAYOUT.marginX,
				this.y + rowHeight - 0.5,
				LAYOUT.marginX + LAYOUT.contentWidth,
				this.y + rowHeight - 0.5
			);

			this.y += rowHeight;
		});

		this.y += 6;
		return this;
	}

	/**
	 * Embeds a JPEG data URL (e.g. from `svgToImageDataUrl()`) as an image in the PDF.
	 *
	 * @param dataUrl - A JPEG data URL.
	 * @param options - Optional title and desired height in mm.
	 */
	addChartImage(
		dataUrl: string,
		options?: { title?: string; heightMm?: number; widthMm?: number }
	): this {
		const { title, heightMm = 55, widthMm = LAYOUT.contentWidth } = options ?? {};

		if (title) {
			this.drawSectionTitle(title);
		}

		this.ensureSpace(heightMm + 4);

		const x = LAYOUT.marginX + (LAYOUT.contentWidth - widthMm) / 2;
		this.doc.addImage(dataUrl, 'JPEG', x, this.y, widthMm, heightMm);
		this.y += heightMm + 6;

		return this;
	}

	/**
	 * Adds key highlights with coloured indicator dots.
	 */
	addHighlights(highlights: PdfHighlight[], title = 'Key Highlights'): this {
		if (highlights.length === 0) return this;

		this.drawSectionTitle(title);

		highlights.forEach((h) => {
			this.ensureSpace(6);

			const dotColor =
				h.type === 'positive'
					? PDF_COLORS.positive
					: h.type === 'negative'
						? PDF_COLORS.negative
						: PDF_COLORS.neutral;

			// Dot
			this.doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
			this.doc.circle(LAYOUT.marginX + 2, this.y - 0.5, 1, 'F');

			// Text
			this.doc.setFont('helvetica', 'normal');
			this.doc.setFontSize(7.5);
			this.doc.setTextColor(...PDF_COLORS.text);
			this.doc.text(h.text, LAYOUT.marginX + 6, this.y);

			this.y += 5;
		});

		this.y += 2;
		return this;
	}

	/**
	 * Adds a section title without content (useful for separating sections).
	 */
	addSectionTitle(title: string): this {
		this.drawSectionTitle(title);
		return this;
	}

	/**
	 * Adds arbitrary text. Supports auto-wrapping.
	 */
	addText(
		text: string,
		options?: { bold?: boolean; fontSize?: number; color?: readonly [number, number, number] }
	): this {
		const { bold = false, fontSize = 8, color = PDF_COLORS.text } = options ?? {};

		this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
		this.doc.setFontSize(fontSize);
		this.doc.setTextColor(...color);

		const lines = this.doc.splitTextToSize(text, LAYOUT.contentWidth);
		const lineHeight = fontSize * 0.45;

		for (const line of lines) {
			this.ensureSpace(lineHeight + 1);
			this.doc.text(line, LAYOUT.marginX, this.y);
			this.y += lineHeight;
		}

		this.y += 2;
		return this;
	}

	/**
	 * Adds vertical spacing.
	 */
	addSpacing(mm: number): this {
		this.y += mm;
		return this;
	}

	/**
	 * Adds report footer with company contact information.
	 */
	addFooter(opts: PdfFooterOptions): this {
		this.ensureSpace(16);
		this.drawRule();
		this.y += 1;

		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(7);
		this.doc.setTextColor(...PDF_COLORS.text);
		this.doc.text(opts.companyName, LAYOUT.marginX, this.y);
		this.y += 3.5;

		this.doc.setFont('helvetica', 'normal');
		this.doc.setFontSize(6.5);
		this.doc.setTextColor(...PDF_COLORS.textMuted);

		if (opts.registeredAddress) {
			this.doc.text(opts.registeredAddress, LAYOUT.marginX, this.y);
			this.y += 3;
		}

		if (opts.contactInfo) {
			this.doc.text(opts.contactInfo, LAYOUT.marginX, this.y);
			this.y += 3;
		}

		return this;
	}

	/**
	 * Generates and triggers download of the PDF.
	 *
	 * @param filename - The filename without extension.
	 */
	async save(filename: string): Promise<void> {
		this.doc.save(`${filename}.pdf`);
	}
}
