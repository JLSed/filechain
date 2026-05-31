<script lang="ts">
	import { goto } from '$app/navigation';
	import { Bell } from '@lucide/svelte';
	import * as Popover from '$lib/shadcn/components/ui/popover/index.js';
	import * as Tabs from '$lib/shadcn/components/ui/tabs/index.js';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import type { Notification } from '$lib/types/NotificationTypes';
	import { untrack } from 'svelte';

	interface Props {
		userId: string;
	}

	const { userId }: Props = $props();

	let notifications = $state<Notification[]>([]);
	let loading = $state(true);
	let open = $state(false);

	const unreadNotifications = $derived(notifications.filter((n) => !n.is_read));
	const unreadCount = $derived(unreadNotifications.length);

	async function fetchNotifications() {
		loading = true;
		try {
			const supabase = createBrowserClient();
			const { data, error } = await supabase
				.schema('api')
				.from('notifications')
				.select('*')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(50);

			if (error) {
				console.error('Failed to fetch notifications:', error);
				return;
			}

			notifications = data ?? [];
		} finally {
			loading = false;
		}
	}

	async function markAsRead(notification: Notification): Promise<void> {
		if (!notification.is_read) {
			const supabase = createBrowserClient();
			await supabase
				.schema('api')
				.from('notifications')
				.update({ is_read: true })
				.eq('id', notification.id);

			// Optimistic update
			notifications = notifications.map((n) =>
				n.id === notification.id ? { ...n, is_read: true } : n
			);
		}

		if (notification.link) {
			open = false;
			let targetLink = notification.link;

			// Handle legacy links using application_number instead of application_id
			const match = targetLink.match(/^\/application\/([^/]+)$/);
			if (match) {
				const identifier = match[1];
				const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
				if (
					identifier &&
					identifier !== 'timeline' &&
					identifier !== 'no-app-num' &&
					identifier !== 'null' &&
					!uuidRegex.test(identifier)
				) {
					try {
						const supabase = createBrowserClient();
						const { data, error } = await supabase
							.schema('api')
							.from('ip_applications')
							.select('application_id')
							.eq('application_number', identifier)
							.maybeSingle();

						if (!error && data?.application_id) {
							targetLink = `/application/${data.application_id}`;
						}
					} catch (e) {
						console.error('Failed to resolve application_number to application_id:', e);
					}
				}
			}

			goto(targetLink);
		}
	}

	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60_000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		const diffDays = Math.floor(diffHours / 24);
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays}d ago`;

		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Fetch notifications immediately on mount so the badge count is visible
	$effect(() => {
		untrack(() => fetchNotifications());
	});

	// Refetch when the popover is reopened to get the latest notifications
	$effect(() => {
		if (open) {
			fetchNotifications();
		}
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} class="notification-bell" aria-label="Notifications">
				<Bell size={20} />
				{#if unreadCount > 0}
					<span class="notification-badge">
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				{/if}
			</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content align="end" sideOffset={8} class="notification-panel">
		<div class="notification-header">
			<h3>Notifications</h3>
		</div>

		<Tabs.Root value="all" class="notification-tabs">
			<Tabs.List class="notification-tabs-list">
				<Tabs.Trigger value="all" class="notification-tab-trigger">All Notifications</Tabs.Trigger>
				<Tabs.Trigger value="unread" class="notification-tab-trigger">
					Unread{#if unreadCount > 0}&nbsp;({unreadCount}){/if}
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="all" class="notification-tab-content">
				{#if loading}
					<div class="notification-empty">
						<span class="notification-spinner"></span>
					</div>
				{:else if notifications.length === 0}
					<div class="notification-empty">
						<p>No notifications yet</p>
					</div>
				{:else}
					<div class="notification-list">
						{#each notifications as notification (notification.id)}
							<button
								class="notification-item"
								class:unread={!notification.is_read}
								onclick={() => markAsRead(notification)}
							>
								<div class="notification-item-content">
									<span class="notification-title">{notification.title}</span>
									<span class="notification-message">{notification.message}</span>
								</div>
								<div class="notification-meta">
									<span class="notification-time">
										{formatRelativeTime(notification.created_at)}
									</span>
									{#if !notification.is_read}
										<span class="notification-dot"></span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="unread" class="notification-tab-content">
				{#if loading}
					<div class="notification-empty">
						<span class="notification-spinner"></span>
					</div>
				{:else if unreadNotifications.length === 0}
					<div class="notification-empty">
						<p>All caught up!</p>
					</div>
				{:else}
					<div class="notification-list">
						{#each unreadNotifications as notification (notification.id)}
							<button class="notification-item unread" onclick={() => markAsRead(notification)}>
								<div class="notification-item-content">
									<span class="notification-title">{notification.title}</span>
									<span class="notification-message">{notification.message}</span>
								</div>
								<div class="notification-meta">
									<span class="notification-time">
										{formatRelativeTime(notification.created_at)}
									</span>
									<span class="notification-dot"></span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</Popover.Content>
</Popover.Root>

<style>
	/* Bell button */
	.notification-bell {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border-radius: 0.5rem;
		border: none;
		background: transparent;
		color: var(--foreground);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.notification-bell:hover {
		background-color: hsl(var(--muted));
	}

	/* Badge */
	.notification-badge {
		position: absolute;
		top: -2px;
		right: -4px;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		border-radius: 9999px;
		background: hsl(0 84% 60%);
		color: white;
		font-size: 0.65rem;
		font-weight: 700;
		line-height: 1;
		pointer-events: none;
		box-shadow: 0 0 0 2px hsl(var(--background));
	}

	/* Panel */
	:global(.notification-panel) {
		width: 380px !important;
		max-height: 480px;
		padding: 0 !important;
		overflow: hidden;
		border-radius: 0.75rem !important;
		border: 1px solid hsl(var(--border)) !important;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.08) !important;
	}

	/* Header */
	.notification-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1rem 0.5rem;
	}

	.notification-header h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--foreground);
		margin: 0;
	}

	/* Tabs */
	:global(.notification-tabs) {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	:global(.notification-tabs-list) {
		width: 100% !important;
		background: transparent !important;
		border-bottom: 1px solid hsl(var(--border));
		border-radius: 0 !important;
		padding: 0 1rem !important;
		height: auto !important;
		gap: 0 !important;
	}

	:global(.notification-tab-trigger) {
		border-radius: 0 !important;
		background: transparent !important;
		color: hsl(var(--muted-foreground)) !important;
		font-size: 0.8125rem !important;
		font-weight: 500 !important;
		padding: 0.5rem 0.25rem !important;
		margin-right: 1rem !important;
		border-bottom: 2px solid transparent !important;
		transition: all 0.15s ease !important;
	}

	:global(.notification-tab-trigger[data-state='active']) {
		color: var(--foreground) !important;
		border-bottom-color: hsl(var(--primary)) !important;
		box-shadow: none !important;
		background: transparent !important;
	}

	:global(.notification-tab-content) {
		overflow-y: auto;
		max-height: 360px;
	}

	/* Notification list */
	.notification-list {
		display: flex;
		flex-direction: column;
	}

	/* Notification item */
	.notification-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: none;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
		background: transparent;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background-color 0.15s ease;
	}

	.notification-item:last-child {
		border-bottom: none;
	}

	.notification-item:hover {
		background-color: hsl(var(--muted) / 0.5);
	}

	.notification-item.unread {
		background-color: hsl(var(--primary) / 0.04);
	}

	.notification-item.unread:hover {
		background-color: hsl(var(--primary) / 0.08);
	}

	/* Item content */
	.notification-item-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.notification-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--foreground);
		line-height: 1.3;
	}

	.notification-message {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Meta (time + dot) */
	.notification-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.375rem;
		flex-shrink: 0;
		padding-top: 0.125rem;
	}

	.notification-time {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	.notification-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		background: hsl(217 91% 60%);
		flex-shrink: 0;
	}

	/* Empty state */
	.notification-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2.5rem 1rem;
	}

	.notification-empty p {
		color: hsl(var(--muted-foreground));
		font-size: 0.8125rem;
	}

	/* Loading spinner */
	.notification-spinner {
		width: 24px;
		height: 24px;
		border: 2.5px solid hsl(var(--border));
		border-top-color: hsl(var(--primary));
		border-radius: 9999px;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
