import type { PageServerLoad } from './$types';
import type { IpApplication } from '$lib/types/filing-forms/ip-application';

export interface ClientApplicationRow extends IpApplication {
	client_first_name: string | null;
	client_last_name: string | null;
	client_email: string | null;
	type_of_invention_name: string | null;
	pre_protection_status_name: string | null;
	type_of_office_action_name: string | null;
}

export interface ClientFolder {
	clientId: string;
	clientName: string;
	clientEmail: string | null;
	applications: ClientApplicationRow[];
}

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const search = url.searchParams.get('search') ?? '';

	let query = supabase
		.schema('api')
		.from('ip_applications')
		.select(
			`
			application_number,
			client_id,
			title_of_invention,
			type_of_invention_id,
			pre_protection_status_id,
			type_of_office_action_id,
			status,
			filling_date,
			paper_document_no,
			fees,
			deadline,
			mailing_date,
			publication_date,
			inventor_names,
			contact_details,
			link_to_folder,
			remarks,
			client_profiles!left (
				first_name,
				last_name,
				email
			),
			type_of_invention!left (
				name
			),
			pre_protection_status!left (
				name
			),
			type_of_office_action!left (
				name
			)
		`
		)
		.not('link_to_folder', 'is', null)
		.order('filling_date', { ascending: false });

	if (search) {
		query = query.or(`title_of_invention.ilike.%${search}%,application_number.ilike.%${search}%`);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error fetching ip_applications for files:', error);
		return { clientFolders: [] as ClientFolder[], search };
	}

	const applications: ClientApplicationRow[] = (data ?? []).map((row: Record<string, unknown>) => {
		const client = row.client_profiles as Record<string, unknown> | null;
		const invention = row.type_of_invention as Record<string, unknown> | null;
		const protection = row.pre_protection_status as Record<string, unknown> | null;
		const officeAction = row.type_of_office_action as Record<string, unknown> | null;

		return {
			application_number: row.application_number as string,
			client_id: row.client_id as string | null,
			title_of_invention: row.title_of_invention as string,
			type_of_invention_id: row.type_of_invention_id as number,
			pre_protection_status_id: row.pre_protection_status_id as number | null,
			type_of_office_action_id: row.type_of_office_action_id as number | null,
			status: row.status as ClientApplicationRow['status'],
			filling_date: row.filling_date as string | null,
			paper_document_no: row.paper_document_no as string | null,
			fees: row.fees as number | null,
			deadline: row.deadline as string | null,
			mailing_date: row.mailing_date as string | null,
			publication_date: row.publication_date as string | null,
			inventor_names: row.inventor_names as string[],
			contact_details: row.contact_details as string | null,
			link_to_folder: row.link_to_folder as string | null,
			remarks: row.remarks as string | null,
			client_first_name: client ? (client.first_name as string | null) : null,
			client_last_name: client ? (client.last_name as string | null) : null,
			client_email: client ? (client.email as string | null) : null,
			type_of_invention_name: invention ? (invention.name as string | null) : null,
			pre_protection_status_name: protection ? (protection.name as string | null) : null,
			type_of_office_action_name: officeAction ? (officeAction.name as string | null) : null
		};
	});

	// Group applications by client
	const clientMap = new Map<string, ClientFolder>();

	for (const app of applications) {
		const key = app.client_id ?? 'unknown';
		if (!clientMap.has(key)) {
			const parts = [app.client_first_name, app.client_last_name].filter(Boolean);
			clientMap.set(key, {
				clientId: key,
				clientName: parts.length > 0 ? parts.join(' ') : 'Unknown Client',
				clientEmail: app.client_email,
				applications: []
			});
		}
		clientMap.get(key)!.applications.push(app);
	}

	const clientFolders = Array.from(clientMap.values()).sort((a, b) =>
		a.clientName.localeCompare(b.clientName)
	);

	return { clientFolders, search };
};
