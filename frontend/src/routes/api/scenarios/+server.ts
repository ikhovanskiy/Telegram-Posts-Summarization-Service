import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ScenarioService } from '$lib/server/scenario';

const scenarioService = new ScenarioService();

export const GET: RequestHandler = async ({ request }) => {
	try {
		const userId = request.headers.get('X-User-Id');
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const scenarios = await scenarioService.getAll(parseInt(userId));
		return json(scenarios);
	} catch (error) {
		console.error('Error getting scenarios:', error);
		return json({ error: 'Failed to get scenarios' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const userId = request.headers.get('X-User-Id');
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { name, description, prompt, model, chatConfigs } = body;

		// Валидация
		if (!name || name.length < 3 || name.length > 100) {
			return json({ error: 'Name must be between 3 and 100 characters' }, { status: 400 });
		}

		if (!prompt || prompt.length < 10) {
			return json({ error: 'Prompt must be at least 10 characters' }, { status: 400 });
		}

		if (!chatConfigs || chatConfigs.length === 0) {
			return json({ error: 'At least one chat must be selected' }, { status: 400 });
		}

		for (const config of chatConfigs) {
			if (config.days < 1 || config.days > 30) {
				return json({ error: 'Days must be between 1 and 30' }, { status: 400 });
			}
		}

		const scenario = await scenarioService.create(parseInt(userId), body);
		return json(scenario, { status: 201 });
	} catch (error) {
		console.error('Error creating scenario:', error);
		return json({ error: 'Failed to create scenario' }, { status: 500 });
	}
};