import { FunctionTool } from '@google/adk';
import { SERVICES } from '../scheduler.js';

export const listServices = new FunctionTool({
  name: 'list_services',
  description: 'Returns the list of salon services, prices, and their durations.',
  execute: () => {
    return { status: 'success', services: SERVICES };
  },
});
