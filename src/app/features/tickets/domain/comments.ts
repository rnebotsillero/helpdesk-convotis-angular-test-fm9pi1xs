import { TicketStatus } from '../models/ticket';

/** BUSINESS_RULES.md §3 */
export const COMMENT_MIN_LENGTH = 10;
export const COMMENT_MAX_LENGTH = 500;

export function canAddComment(status: TicketStatus): boolean {
  return status !== 'closed';
}

/**
 * Valida el texto de un comentario.
 * El mínimo se mide sin espacios al inicio/final; el máximo sobre el texto tal cual.
 * Devuelve mensaje de error o `null` si es válido.
 */
export function validateComment(
  text: string,
  options: { pristine?: boolean } = {},
): string | null {
  const trimmedLength = text.trim().length;

  // Sin interacción aún: no mostrar error por campo vacío
  if (options.pristine && text.length === 0) {
    return null;
  }

  if (trimmedLength < COMMENT_MIN_LENGTH) {
    return `El comentario debe tener al menos ${COMMENT_MIN_LENGTH} caracteres (ahora ${trimmedLength}).`;
  }
  if (text.length > COMMENT_MAX_LENGTH) {
    return `El comentario no puede superar ${COMMENT_MAX_LENGTH} caracteres.`;
  }
  return null;
}

export function isCommentValid(text: string): boolean {
  return validateComment(text) === null;
}
