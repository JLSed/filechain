import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
	if (req.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { to, subject, html } = await req.json();

	if (!to || !subject || !html) {
		return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Send email via Resend (https://resend.com)
	// Set RESEND_API_KEY in your Supabase project secrets:
	//   supabase secrets set RESEND_API_KEY=re_xxxxx
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: 'Filechain <noreply@yourdomain.com>',
			to: [to],
			subject,
			html
		})
	});

	if (!res.ok) {
		const error = await res.text();
		return new Response(JSON.stringify({ error }), {
			status: res.status,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const data = await res.json();
	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
});
