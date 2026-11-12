import {
  COMMENT_MAX_LENGTH,
  COMMENT_MIN_LENGTH,
  canAddComment,
  isCommentValid,
  validateComment,
} from './comments';

describe('canAddComment', () => {
  it('permite comentar en cualquier estado excepto closed', () => {
    expect(canAddComment('open')).toBe(true);
    expect(canAddComment('in_progress')).toBe(true);
    expect(canAddComment('waiting_customer')).toBe(true);
    expect(canAddComment('closed')).toBe(false);
  });
});

describe('validateComment', () => {
  it('rechaza textos con menos de 10 caracteres tras trim', () => {
    expect(validateComment('corto')).toContain(String(COMMENT_MIN_LENGTH));
    expect(validateComment('   123456789   ')).toContain(String(COMMENT_MIN_LENGTH)); // 9 útiles
  });

  it('acepta exactamente 10 caracteres útiles', () => {
    expect(validateComment('0123456789')).toBeNull();
    expect(validateComment('  0123456789  ')).toBeNull();
  });

  it('rechaza textos de más de 500 caracteres', () => {
    const tooLong = 'a'.repeat(COMMENT_MAX_LENGTH + 1);
    expect(validateComment(tooLong)).toContain(String(COMMENT_MAX_LENGTH));
  });

  it('acepta exactamente 500 caracteres', () => {
    expect(validateComment('a'.repeat(COMMENT_MAX_LENGTH))).toBeNull();
  });

  it('en estado pristine no marca error si está vacío', () => {
    expect(validateComment('', { pristine: true })).toBeNull();
  });

  it('tras interactuar marca error si está vacío', () => {
    expect(validateComment('', { pristine: false })).toContain(String(COMMENT_MIN_LENGTH));
  });
});

describe('isCommentValid', () => {
  it('resume la validación en boolean', () => {
    expect(isCommentValid('corto')).toBe(false);
    expect(isCommentValid('comentario valido')).toBe(true);
  });
});
