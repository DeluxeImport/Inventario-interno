import { badRequest } from './AppError.js';

const INVALID_CURSOR = 'Cursor de paginación inválido.';

export function encodeCursor(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function decodeCursor(value, isValid) {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
    if (!isValid(decoded)) throw new Error(INVALID_CURSOR);
    return decoded;
  } catch {
    throw badRequest(INVALID_CURSOR);
  }
}

export function pageResult(rows, limit, toCursor) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    hasMore,
    nextCursor: hasMore && items.length > 0 ? encodeCursor(toCursor(items.at(-1))) : null,
  };
}
