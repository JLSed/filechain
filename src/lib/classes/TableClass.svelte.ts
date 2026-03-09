import { invalidate } from '$app/navigation';
import type { IpApplication } from '$lib/types/DatabaseTypes';

export class TableState<T extends Record<string, unknown>> {
	private searchKeys: (keyof T)[];

	constructor(rows: T[], searchKeys: (keyof T)[]) {
		this.rows = rows;
		this.searchKeys = searchKeys;
	}
	MAX_PAGE_SIZE = 6;

	isRefreshing = $state(false);
	searchValue = $state('');
	activeStatus = $state('all');
	sortColumn = $state('filling_date');
	sortDirection = $state<'asc' | 'desc'>('desc');
	currentPage = $state(1);
	pageNumbers = $derived(this.getPageNumbers());
	rows: T[] = $state([]);

	processedRows: T[] = $derived.by(() => {
		let filtered = this.rows;
		const searchString = this.searchValue.trim().toLowerCase();
		if (searchString) {
			filtered = filtered.filter((data) =>
				this.searchKeys.some((key) =>
					String(data[key] ?? '')
						.toLowerCase()
						.includes(searchString)
				)
			);
		}
		return [...filtered].sort((a, b) => {
			const aVal = String(a[this.sortColumn as keyof T] ?? '');
			const bVal = String(b[this.sortColumn as keyof T] ?? '');
			const cmp = aVal.localeCompare(bVal);
			return this.sortDirection === 'asc' ? cmp : -cmp;
		});
	});
	totalRows = $derived(this.processedRows.length);
	maxRowPerPage = $derived(Math.ceil(this.totalRows / this.MAX_PAGE_SIZE));
	paginatedRows: T[] = $derived(
		this.processedRows.slice(
			(this.currentPage - 1) * this.MAX_PAGE_SIZE,
			this.currentPage * this.MAX_PAGE_SIZE
		)
	);
	getPageNumbers(): (number | '...')[] {
		const current = this.currentPage;
		const total = this.maxRowPerPage;
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const pages: (number | '...')[] = [];
		if (current <= 4) {
			pages.push(1, 2, 3, 4, '...', total - 2, total - 1, total);
		} else if (current >= total - 3) {
			pages.push(1, 2, 3, '...', total - 3, total - 2, total - 1, total);
		} else {
			pages.push(1, '...', current - 1, current, current + 1, '...', total);
		}
		return pages;
	}

	goToPage(p: number) {
		if (p < 1 || p > this.maxRowPerPage) return;
		this.currentPage = p;
	}

	handleRefresh = async (depends_value: string) => {
		this.isRefreshing = true;
		await invalidate(depends_value);
		this.isRefreshing = false;
	};
}

export class ApplicationTableState extends TableState<IpApplication> {
	sheetOpen = $state(false);
	seletecApplication: IpApplication | null = $state(null);
	openDetails = (selected_data: IpApplication) => {
		this.sheetOpen = true;
		this.seletecApplication = selected_data;
	};

	constructor(rows: IpApplication[]) {
		super(rows, ['title_of_invention', 'application_number']);
	}
}
