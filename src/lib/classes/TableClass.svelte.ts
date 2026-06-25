import { invalidate } from '$app/navigation';
import type { IpApplication } from '$lib/types/DatabaseTypes';
import type { ClientProfile } from '$lib/types/DatabaseTypes';
import type { UserProfile } from '$lib/types/DatabaseTypes';
import type { AuditLog } from '$lib/types/DatabaseTypes';

/**
 * Helper to resolve nested values using a dot-notated string path.
 * ponytail: simple recursive reducer to read properties like a.b.c. O(d) depth.
 */
function getNestedValue(obj: unknown, path: string): unknown {
	if (!obj || typeof obj !== 'object') return undefined;
	return path.split('.').reduce((acc: unknown, part: string) => {
		return acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)
			? (acc as Record<string, unknown>)[part]
			: undefined;
	}, obj);
}

export class TableState<T extends Record<string, unknown>> {
	private searchKeys: (keyof T | string)[];
	filterFn = $state<(row: T) => boolean>(() => true);

	constructor(rows: T[], searchKeys: (keyof T | string)[]) {
		this.rows = rows;
		this.searchKeys = searchKeys;
	}
	MAX_PAGE_SIZE = 10;

	isRefreshing = $state(false);
	searchValue = $state('');
	activeStatus = $state('all');
	sortColumn = $state('created_at');
	sortDirection = $state<'asc' | 'desc'>('desc');
	currentPage = $state(1);
	pageNumbers = $derived(this.getPageNumbers());
	rows: T[] = $state([]);

	processedRows: T[] = $derived.by(() => {
		let filtered = this.rows;

		// Apply custom filterFn if set
		filtered = filtered.filter(this.filterFn);

		const searchString = this.searchValue.trim().toLowerCase();
		if (searchString) {
			const words = searchString.split(/\s+/).filter(Boolean);
			filtered = filtered.filter((data) =>
				words.every((word) =>
					this.searchKeys.some((key) => {
						const val = typeof key === 'string' ? getNestedValue(data, key) : data[key as keyof T];
						return String(val ?? '')
							.toLowerCase()
							.includes(word);
					})
				)
			);
		}

		return [...filtered].sort((a, b) => {
			const aVal = String(getNestedValue(a, this.sortColumn) ?? '');
			const bVal = String(getNestedValue(b, this.sortColumn) ?? '');

			const aNum = Number(aVal);
			const bNum = Number(bVal);
			const cmp =
				!isNaN(aNum) && !isNaN(bNum) && aVal.trim() !== '' && bVal.trim() !== ''
					? aNum - bNum
					: aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
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

	toggleSort(column: string) {
		if (this.sortColumn === column) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortColumn = column;
			this.sortDirection = 'asc';
		}
		this.currentPage = 1;
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

	selectedStatus = $state('all');
	selectedType = $state('all');
	showOnlyMissingAppNum = $state(false);

	constructor(rows: IpApplication[]) {
		super(rows, [
			'title_of_invention',
			'application_number',
			'client_profiles.first_name',
			'client_profiles.last_name',
			'client_profiles.email',
			'type_of_invention.name'
		]);

		this.filterFn = (row: IpApplication): boolean => {
			if (this.selectedStatus !== 'all' && row.status !== this.selectedStatus) {
				return false;
			}
			if (this.selectedType !== 'all' && row.type_of_invention?.name !== this.selectedType) {
				return false;
			}
			if (
				this.showOnlyMissingAppNum &&
				row.application_number &&
				row.application_number.trim() !== ''
			) {
				return false;
			}
			return true;
		};
	}
}

export class ClientFolderState extends TableState<
	ClientProfile & { displayName: string; ip_applications?: { team_assigned: string | null }[] }
> {
	selectedType = $state<'all' | 'individual' | 'company'>('all');
	selectedTeam = $state<string>('all');

	constructor(
		rows: (ClientProfile & {
			displayName: string;
			ip_applications?: { team_assigned: string | null }[];
		})[]
	) {
		super(rows, ['displayName']);
		this.sortColumn = 'displayName';
		this.sortDirection = 'asc';
		this.MAX_PAGE_SIZE = 12;

		this.filterFn = (row) => {
			if (this.selectedType === 'individual' && !row.is_individual) {
				return false;
			}
			if (this.selectedType === 'company' && row.is_individual) {
				return false;
			}
			if (this.selectedTeam !== 'all') {
				const hasMatchingApp = row.ip_applications?.some(
					(app) => app.team_assigned === this.selectedTeam
				);
				if (!hasMatchingApp) {
					return false;
				}
			}
			return true;
		};
	}
}

export class UserTableState extends TableState<UserProfile> {
	sheetOpen = $state(false);
	editRoleOpen = $state(false);
	archiveOpen = $state(false);
	resetPasswordOpen = $state(false);
	selectedUser: UserProfile | null = $state(null);

	openDetails = (user: UserProfile) => {
		this.selectedUser = user;
		this.sheetOpen = true;
	};

	openEditRole = (user: UserProfile) => {
		this.selectedUser = user;
		this.editRoleOpen = true;
	};

	openArchive = (user: UserProfile) => {
		this.selectedUser = user;
		this.archiveOpen = true;
	};

	openResetPassword = (user: UserProfile) => {
		this.selectedUser = user;
		this.resetPasswordOpen = true;
	};

	constructor(rows: UserProfile[]) {
		super(rows, ['first_name', 'last_name', 'email', 'role']);
		this.sortColumn = 'first_name';
		this.sortDirection = 'asc';
	}
}

export class AuditLogTableState extends TableState<AuditLog> {
	sheetOpen = $state(false);
	selectedLog: AuditLog | null = $state(null);

	openDetails = (log: AuditLog) => {
		this.selectedLog = log;
		this.sheetOpen = true;
	};

	constructor(rows: AuditLog[]) {
		super(rows, ['details', 'event_type']);
		this.sortColumn = 'timestamp';
		this.sortDirection = 'desc';
		this.MAX_PAGE_SIZE = 10;
	}
}

export class ClientTableState extends TableState<ClientProfile> {
	selectedType = $state<'all' | 'individual' | 'company'>('all');

	constructor(rows: ClientProfile[]) {
		super(rows, ['first_name', 'last_name', 'company_name', 'email']);
		this.sortColumn = 'created_at';
		this.sortDirection = 'desc';
		this.MAX_PAGE_SIZE = 10;

		this.filterFn = (row: ClientProfile): boolean => {
			if (this.selectedType === 'individual' && !row.is_individual) {
				return false;
			}
			if (this.selectedType === 'company' && row.is_individual) {
				return false;
			}
			return true;
		};
	}
}
