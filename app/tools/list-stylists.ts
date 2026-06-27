import { FunctionTool } from '@google/adk';
import { STYLISTS } from '../scheduler.js';

export const listStylists = new FunctionTool({
  name: 'list_stylists',
  description: 'Returns the list of salon stylists and their specialties.',
  execute: () => {
    return { status: 'success', stylists: STYLISTS };
  },
});
