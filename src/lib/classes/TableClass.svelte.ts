import type { IpApplication } from '$lib/types/DatabaseTypes';
import type { IpApplicationTableRow } from '$lib/types/TableTypes';

export class TableState {
	constructor(row_count: number) {
		this.totalRows = row_count;
	}
	MAX_PAGE_SIZE = 5;

	searchValue = $state('');
	activeStatus = $state('all');
	sortColumn = $state('filling_date');
	sortDirection = $state<'asc' | 'desc'>('desc');
	currentPage = $state(1);
	totalRows = $state(0);
	maxRowPerPage = $derived(Math.ceil(this.totalRows / this.MAX_PAGE_SIZE));
	pageNumbers = $derived(this.getPageNumbers());

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
}

export class ApplicationTableState extends TableState {
	readonly rows: IpApplication[] = $state([]);

	constructor(rows: IpApplication[]) {
		super(rows.length);
		this.rows = rows;
	}
}
