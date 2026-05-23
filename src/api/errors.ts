export class PermissionError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly requiredRoles: string[];
  readonly userRoles: string[];
  readonly silent: boolean;

  constructor(
    message: string,
    requiredRoles: string[] = [],
    userRoles: string[] = [],
    silent: boolean = true,
  ) {
    super(message);
    this.name = 'PermissionError';
    this.statusCode = 403;
    this.errorCode = 'PERMISSION_DENIED';
    this.requiredRoles = requiredRoles;
    this.userRoles = userRoles;
    this.silent = silent;
  }

  static fromResponse(data: Record<string, unknown>, silent: boolean = true): PermissionError {
    const detail = typeof data.detail === 'object' && data.detail !== null
      ? (data.detail as Record<string, unknown>)
      : data;

    const message = typeof detail.detail === 'string'
      ? detail.detail
      : typeof data.detail === 'string'
        ? data.detail
        : 'Permission denied';

    return new PermissionError(
      message,
      Array.isArray(detail.required_roles) ? detail.required_roles : [],
      Array.isArray(detail.user_roles) ? detail.user_roles : [],
      silent,
    );
  }
}
