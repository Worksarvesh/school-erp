import { formatMobile, otpSchema, parentLoginSchema, studentLoginSchema } from './validation';

describe('studentLoginSchema', () => {
  it('requires a username and a password', () => {
    const result = studentLoginSchema.safeParse({ username: '  ', password: '' });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(['username', 'password']);
  });

  it('accepts any non-empty pair (mock sign-in)', () => {
    expect(studentLoginSchema.safeParse({ username: 'sch0001s0014', password: 'x' }).success).toBe(
      true,
    );
  });
});

describe('parentLoginSchema', () => {
  it.each(['9876543210', '98765 43210', '6000000000'])('accepts %s', (mobile) => {
    expect(parentLoginSchema.safeParse({ mobile }).success).toBe(true);
  });

  it.each(['', '12345', '5876543210', '98765432101', 'abcdefghij'])('rejects %j', (mobile) => {
    expect(parentLoginSchema.safeParse({ mobile }).success).toBe(false);
  });
});

describe('otpSchema', () => {
  it('needs exactly six digits', () => {
    expect(otpSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(otpSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
});

it('formats a mobile number for display', () => {
  expect(formatMobile('9876543210')).toBe('98765 43210');
});
