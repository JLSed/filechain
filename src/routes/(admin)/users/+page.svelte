<script lang="ts">
	import { UserTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import UserTableRow from '$lib/components/admin/users/UserTableRow.svelte';
	import UserDetailsSheet from '$lib/components/admin/users/UserDetailsSheet.svelte';
	import EditRoleDialog from '$lib/components/admin/users/EditRoleDialog.svelte';
	import ArchiveUserDialog from '$lib/components/admin/users/ArchiveUserDialog.svelte';
	import AddUserForm from '$lib/components/admin/users/AddUserForm.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, RefreshCcw, Search, UserPlus, ArrowLeft } from '@lucide/svelte';
	import { untrack } from 'svelte';

	let { data }: PageProps = $props();

	const table = new UserTableState(untrack(() => data.users));

	$effect(() => {
		table.rows = data.users;
	});

	let activeTab = $state<'list' | 'form'>('list');

	function switchToForm() {
		activeTab = 'form';
	}

	function switchToList() {
		activeTab = 'list';
	}
</script>

{#if activeTab === 'list'}
	<main class="p-2">
		<h1>User Management</h1>
		<div class="flex gap-2">
			<Button
				variant="outline"
				size="icon"
				disabled={table.isRefreshing}
				onclick={() => table.handleRefresh('db:user-profiles')}
			>
				<RefreshCcw class="size-4 {table.isRefreshing ? 'animate-spin' : ''}" />
			</Button>
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					bind:value={table.searchValue}
					type="search"
					placeholder="Search for users"
					class="max-w-lg pl-9"
					oninput={() => {
						table.currentPage = 1;
					}}
				/>
			</div>
			<div class="flex-1"></div>
			<Button class="gap-2" onclick={switchToForm}>
				<UserPlus class="size-4" />
				Add User
			</Button>
		</div>
		<div class="my-4">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head>Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if data.error}
						<Table.Row>
							<Table.Cell colspan={4} class="py-12">
								<div class="flex flex-col items-center justify-center space-y-3 text-center">
									<AlertCircle class="size-8 text-primary/70" />
									<p class="text-sm font-medium text-primary/60">{data.error}</p>
									<Button
										variant="outline"
										size="sm"
										onclick={() => table.handleRefresh('db:user-profiles')}
									>
										Try Again
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{:else if table.isRefreshing}
						<Table.Row>
							<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
								Getting the latest user data...
							</Table.Cell>
						</Table.Row>
					{:else if table.totalRows === 0}
						<Table.Row>
							<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
								No users found.
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each table.paginatedRows as row (row.user_id)}
							<UserTableRow
								user={row}
								openDetails={table.openDetails}
								openEditRole={table.openEditRole}
								openArchive={table.openArchive}
							/>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
		<Pagination {table} />
	</main>

	<UserDetailsSheet data={table.selectedUser} bind:sheetOpen={table.sheetOpen} />
	<EditRoleDialog user={table.selectedUser} bind:open={table.editRoleOpen} />
	<ArchiveUserDialog user={table.selectedUser} bind:open={table.archiveOpen} />
{:else}
	<main class="flex h-full flex-col">
		<div class="flex items-center gap-3 border-b border-border p-4">
			<Button variant="ghost" size="icon" onclick={switchToList}>
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">Invite New User</h1>
				<p class="text-sm text-muted-foreground">Send an invitation email to a new user</p>
			</div>
		</div>
		<div class="flex-1">
			<AddUserForm {data} onCancel={switchToList} onSuccess={switchToList} />
		</div>
	</main>
{/if}
