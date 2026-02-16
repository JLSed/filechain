import type { Session, SupabaseClient, User as UserMetadata } from '@supabase/supabase-js';
import type { LucideIcon } from '@lucide/svelte';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{
				session: Session | null;
				user_metadata: Metadata | null;
			}>;
			session: Session | null;
			profile: User.Profile | null;
		}
		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
	namespace User {
		type Metadata = UserMetadata;
		type Profile = {
			user_id: string;
			role: string;
			first_name: string;
			last_name: string;
			middle_name?: string;
			is_active: boolean;
		};
	}
	namespace Sidebar {
		interface Item {
			title: string;
			url: string;
			icon: LucideIcon;
		}

		/** Represents a group of sidebar items */
		interface Group {
			label: string;
			items: Item[];
		}

		/** Represents a sub-item within a navigation item */
		interface NavSubItem {
			label: string;
			href: string;
		}
		/** Represents a navigation item with optional children */
		interface NavItem {
			label: string;
			href: string;
			icon: LucideIcon;
			children?: NavSubItem[];
		}

		/** Represents a group of navigation items with a label */
		interface NavGroup {
			label: string;
			items: NavItem[];
		}
	}
}

export {};
