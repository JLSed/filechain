import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PermissionSchema, RoleSchema } from '$lib/types/DatabaseTypes';
import { hasPermission } from '$lib/services/permissions';
import { createAdminClient } from '$lib/services/supabase/admin';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';
import z from 'zod';

export const load = (async ({ locals: { supabase }, parent, depends }) => {
	depends('db:role-permissions');
	const { profile, permissions } = await parent();

	// Only System Admin or users with permissions.manage can access
	if (profile.role !== 'System Admin' && !hasPermission(permissions, 'permissions.manage')) {
		throw error(403, 'You do not have permission to manage role permissions.');
	}

	// Fetch all roles
	const { data: rolesData, error: rolesError } = await supabase
		.schema('api')
		.from('roles')
		.select('*')
		.order('is_system', { ascending: false })
		.order('name');

	if (rolesError) {
		console.error('Failed to fetch roles:', rolesError);
		throw error(500, 'Failed to load roles.');
	}

	const roles = z.array(RoleSchema).parse(rolesData);

	// Fetch all permissions
	const { data: permissionsData, error: permissionsError } = await supabase
		.schema('api')
		.from('permissions')
		.select('*')
		.order('sort_order');

	if (permissionsError) {
		console.error('Failed to fetch permissions:', permissionsError);
		throw error(500, 'Failed to load permissions.');
	}

	const allPermissions = z.array(PermissionSchema).parse(permissionsData);

	// Fetch all role_permissions
	const { data: rolePermsData, error: rolePermsError } = await supabase
		.schema('api')
		.from('role_permissions')
		.select('role, permission_id');

	if (rolePermsError) {
		console.error('Failed to fetch role_permissions:', rolePermsError);
		throw error(500, 'Failed to load role permissions.');
	}

	// Build a map: role → Set<permission_id>
	const rolePermissionMap: Record<string, string[]> = {};
	for (const rp of rolePermsData ?? []) {
		const rpTyped = rp as { role: string; permission_id: string };
		if (!rolePermissionMap[rpTyped.role]) {
			rolePermissionMap[rpTyped.role] = [];
		}
		rolePermissionMap[rpTyped.role].push(rpTyped.permission_id);
	}

	return {
		roles,
		allPermissions,
		rolePermissionMap
	};
}) satisfies PageServerLoad;

export const actions = {
	updatePermissions: async ({
		request,
		locals: { supabase, safeGetSession },
		getClientAddress
	}) => {
		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const formData = await request.formData();
		const targetRole = formData.get('role')?.toString();
		const permissionIdsJson = formData.get('permission_ids')?.toString();

		if (!targetRole || !permissionIdsJson) {
			return fail(400, { error: 'Role and permissions are required.' });
		}

		// Prevent modifying System Admin permissions
		if (targetRole === 'System Admin') {
			return fail(403, { error: 'System Admin permissions cannot be modified.' });
		}

		let permissionIds: string[];
		try {
			permissionIds = JSON.parse(permissionIdsJson);
		} catch {
			return fail(400, { error: 'Invalid permission data.' });
		}

		// Use admin client to bypass RLS for writes
		const admin = createAdminClient();
		if (!admin) {
			return fail(500, { error: 'Server configuration error.' });
		}

		// Delete existing permissions for this role
		const { error: deleteError } = await admin
			.schema('api')
			.from('role_permissions')
			.delete()
			.eq('role', targetRole);

		if (deleteError) {
			console.error('Failed to delete role permissions:', deleteError);
			return fail(500, { error: 'Failed to update permissions.' });
		}

		// Insert new permissions
		if (permissionIds.length > 0) {
			const inserts = permissionIds.map((pid) => ({
				role: targetRole,
				permission_id: pid,
				granted_by: session.user.id
			}));

			const { error: insertError } = await admin
				.schema('api')
				.from('role_permissions')
				.insert(inserts);

			if (insertError) {
				console.error('Failed to insert role permissions:', insertError);
				return fail(500, { error: 'Failed to save permissions.' });
			}
		}

		// Audit log
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const { data: actorProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const actorName = actorProfile
			? formatName(
					actorProfile.first_name ?? '',
					actorProfile.middle_name,
					actorProfile.last_name ?? ''
				)
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} updated permissions for role "${targetRole}" (${permissionIds.length} permissions)`,
			severityLevel: 'warning',
			ipAddress,
			eventType: 'Edited Account'
		});

		return { success: true };
	},

	createRole: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const formData = await request.formData();
		const name = formData.get('name')?.toString()?.trim();
		const description = formData.get('description')?.toString()?.trim() || null;

		if (!name) {
			return fail(400, { error: 'Role name is required.' });
		}

		const admin = createAdminClient();
		if (!admin) {
			return fail(500, { error: 'Server configuration error.' });
		}

		const { error: insertError } = await admin
			.schema('api')
			.from('roles')
			.insert({ name, description, is_system: false });

		if (insertError) {
			console.error('Failed to create role:', insertError);
			if (insertError.code === '23505') {
				return fail(400, { error: 'A role with this name already exists.' });
			}
			return fail(500, { error: 'Failed to create role.' });
		}

		// Audit log
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const { data: actorProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const actorName = actorProfile
			? formatName(
					actorProfile.first_name ?? '',
					actorProfile.middle_name,
					actorProfile.last_name ?? ''
				)
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} created new role "${name}"`,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Edited Account'
		});

		return { success: true };
	},

	deleteRole: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const formData = await request.formData();
		const roleId = formData.get('role_id')?.toString();
		const roleName = formData.get('role_name')?.toString();

		if (!roleId) {
			return fail(400, { error: 'Role ID is required.' });
		}

		const admin = createAdminClient();
		if (!admin) {
			return fail(500, { error: 'Server configuration error.' });
		}

		// Check role is not system
		const { data: roleData } = await admin
			.schema('api')
			.from('roles')
			.select('is_system, name')
			.eq('role_id', roleId)
			.single();

		if (roleData?.is_system) {
			return fail(403, { error: 'System roles cannot be deleted.' });
		}

		// Check no users are assigned to this role
		const { count } = await admin
			.schema('api')
			.from('user_profiles')
			.select('user_id', { count: 'exact', head: true })
			.eq('role', roleData?.name ?? roleName);

		if (count && count > 0) {
			return fail(400, {
				error: `Cannot delete role "${roleData?.name}": ${count} user(s) are assigned to it.`
			});
		}

		// Delete role permissions first
		await admin
			.schema('api')
			.from('role_permissions')
			.delete()
			.eq('role', roleData?.name ?? roleName);

		// Delete the role
		const { error: deleteError } = await admin
			.schema('api')
			.from('roles')
			.delete()
			.eq('role_id', roleId);

		if (deleteError) {
			console.error('Failed to delete role:', deleteError);
			return fail(500, { error: 'Failed to delete role.' });
		}

		// Audit log
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const { data: actorProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const actorName = actorProfile
			? formatName(
					actorProfile.first_name ?? '',
					actorProfile.middle_name,
					actorProfile.last_name ?? ''
				)
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} deleted role "${roleData?.name ?? roleName}"`,
			severityLevel: 'warning',
			ipAddress,
			eventType: 'Edited Account'
		});

		return { success: true };
	}
} satisfies Actions;
