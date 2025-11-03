import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ScenarioService } from '$lib/server/scenario';

const scenarioService = new ScenarioService();

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const userId = request.headers.get('X-User-Id');
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const scenarioId = parseInt(params.id);
		if (isNaN(scenarioId)) {
			return json({ error: 'Invalid scenario ID' }, { status: 400 });
		}

		const scenario = await scenarioService.getById(scenarioId, parseInt(userId));
		return json(scenario);
	} catch (error) {
		console.error('Error getting scenario:', error);
		if (error instanceof Error && error.message === 'Scenario not found') {
			return json({ error: 'Scenario not found' }, { status: 404 });
		}
		return json({ error: 'Failed to get scenario' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const userId = request.headers.get('X-User-Id');
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const scenarioId = parseInt(params.id);
		if (isNaN(scenarioId)) {
			return json({ error: 'Invalid scenario ID' }, { status: 400 });
		}

		const body = await request.json();
		const { name, description, prompt, model, chatConfigs } = body;

		// Валидация
		if (name !== undefined && (name.length < 3 || name.length > 100)) {
			return json({ error: 'Name must be between 3 and 100 characters' }, { status: 400 });
		}

		if (prompt !== undefined && prompt.length < 10) {
			return json({ error: 'Prompt must be at least 10 characters' }, { status: 400 });
		}

		if (chatConfigs !== undefined) {
			if (chatConfigs.length === 0) {
				return json({ error: 'At least one chat must be selected' }, { status: 400 });
			}

			for (const config of chatConfigs) {
				if (config.days < 1 || config.days > 30) {
					return json({ error: 'Days must be between 1 and 30' }, { status: 400 });
				}
			}
		}

		const scenario = await scenarioService.update(scenarioId, parseInt(userId), body);
		return json(scenario);
	} catch (error) {
		console.error('Error updating scenario:', error);
		if (error instanceof Error && error.message === 'Scenario not found') {
			return json({ error: 'Scenario not found' }, { status: 404 });
		}
		return json({ error: 'Failed to update scenario' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const userId = request.headers.get('X-User-Id');
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const scenarioId = parseInt(params.id);
		if (isNaN(scenarioId)) {
			return json({ error: 'Invalid scenario ID' }, { status: 400 });
		}

		await scenarioService.delete(scenarioId, parseInt(userId));
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting scenario:', error);
		if (error instanceof Error && error.message === 'Scenario not found') {
			return json({ error: 'Scenario not found' }, { status: 404 });
		}
		return json({ error: 'Failed to delete scenario' }, { status: 500 });
	}
};