import { business1Config } from './business_1.js';
import { business2Config } from './business_2.js';
import { BusinessConfig } from './types.js';

export function getActiveBusinessConfig(): BusinessConfig {
  const businessId = process.env.BUSINESS_ID;
  if (businessId === 'business_2') {
    return business2Config;
  }
  return business1Config;
}

import type { Service, Stylist } from './types.js';

const resolvedConfig = getActiveBusinessConfig();

export const ACTIVE_CONFIG: BusinessConfig = { ...resolvedConfig };
export const SERVICES: Service[] = [...resolvedConfig.services];
export const STYLISTS: Stylist[] = [...resolvedConfig.stylists];

export function setTestConfig(config: BusinessConfig) {
  Object.assign(ACTIVE_CONFIG, config);
  SERVICES.length = 0;
  SERVICES.push(...config.services);
  STYLISTS.length = 0;
  STYLISTS.push(...config.stylists);
}
