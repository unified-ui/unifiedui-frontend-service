import { ToolTypeEnum } from '../api/types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_MCP_TRANSPORTS = ['sse', 'stdio', 'streamable-http'];

function validateMCPServerConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.server_url || typeof config.server_url !== 'string') {
    errors.push('server_url is required and must be a string');
  } else {
    try {
      new URL(config.server_url as string);
    } catch {
      errors.push('server_url must be a valid URL');
    }
  }

  if (!config.transport || typeof config.transport !== 'string') {
    errors.push('transport is required and must be a string');
  } else if (!VALID_MCP_TRANSPORTS.includes(config.transport as string)) {
    errors.push(`transport must be one of: ${VALID_MCP_TRANSPORTS.join(', ')}`);
  }

  if (config.tools !== undefined) {
    if (!Array.isArray(config.tools)) {
      errors.push('tools must be an array if provided');
    } else {
      (config.tools as unknown[]).forEach((tool, i) => {
        const t = tool as Record<string, unknown>;
        if (!t.name || typeof t.name !== 'string') {
          errors.push(`tools[${i}].name is required and must be a string`);
        }
        if (!t.description || typeof t.description !== 'string') {
          errors.push(`tools[${i}].description is required and must be a string`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateOpenAPIConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const spec = (config.spec as Record<string, unknown>) || config;

  const openapi = spec.openapi as string | undefined;
  if (!openapi || typeof openapi !== 'string') {
    errors.push('OpenAPI spec must include an "openapi" version field (e.g. "3.0.0")');
  } else if (!openapi.startsWith('3.')) {
    errors.push(`Only OpenAPI 3.x is supported. Found version: "${openapi}"`);
  }

  if (!spec.info || typeof spec.info !== 'object') {
    errors.push('OpenAPI spec must include an "info" object');
  }

  const hasPaths = spec.paths && typeof spec.paths === 'object';
  const hasWebhooks = spec.webhooks && typeof spec.webhooks === 'object';
  if (!hasPaths && !hasWebhooks) {
    errors.push('OpenAPI spec must include a "paths" or "webhooks" object');
  }

  if (spec.components && typeof spec.components === 'object') {
    const components = spec.components as Record<string, unknown>;
    if (components.securitySchemes && typeof components.securitySchemes === 'object') {
      const schemes = components.securitySchemes as Record<string, Record<string, unknown>>;
      const unsupported = Object.entries(schemes)
        .filter(([, scheme]) => scheme.type !== 'apiKey')
        .map(([name]) => name);
      if (unsupported.length > 0) {
        warnings.push(`Security schemes other than apiKey are not yet supported: ${unsupported.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateToolConfig(type: ToolTypeEnum, jsonString: string): ValidationResult {
  if (!jsonString.trim()) {
    return { valid: true, errors: [], warnings: [] };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, errors: ['Invalid JSON format'], warnings: [] };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, errors: ['Configuration must be a JSON object'], warnings: [] };
  }

  switch (type) {
    case ToolTypeEnum.MCP_SERVER:
      return validateMCPServerConfig(parsed);
    case ToolTypeEnum.OPENAPI_DEFINITION:
      return validateOpenAPIConfig(parsed);
    default:
      return { valid: true, errors: [], warnings: [] };
  }
}
