/**
 * Safely extract a string parameter from req.params or req.query
 * Express types these as string | string[] | ParsedQs but in practice they're usually strings
 */
export function getParam(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

export function getRequiredParam(value: unknown): string {
  const result = getParam(value);
  if (!result) {
    throw new Error('Required parameter is missing');
  }
  return result;
}
