import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response('pong', {
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
			Pragma: 'no-cache',
			Expires: '0'
		}
	});
};
