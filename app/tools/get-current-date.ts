import { FunctionTool } from '@google/adk';

export const getCurrentDate = new FunctionTool({
  name: 'get_current_date',
  description: 'Returns the current date, time, and day of the week.',
  execute: () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    const time = `${hh}:${min}`;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[today.getDay()];
    return { status: 'success', date, time, dayOfWeek };
  },
});
