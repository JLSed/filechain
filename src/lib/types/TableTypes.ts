import type { ClientProfile, IpApplication } from './DatabaseTypes';

export interface IpApplicationTableRow {
	application: IpApplication[];
	client_profile: ClientProfile;
}

export interface IpApplicationTable {
	row: IpApplicationTableRow[];
}
