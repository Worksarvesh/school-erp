import { mockStudent } from '@/mock/student';
import { formatDisplayDate, optionalProfileSchema, profileCompletion } from './progress';

describe('profileCompletion', () => {
  it('counts school records as complete and optional fields when filled', () => {
    expect(profileCompletion(mockStudent, {})).toBe(71);
    expect(profileCompletion(mockStudent, { height: '145' })).toBe(86);
    expect(profileCompletion(mockStudent, { height: '145', bloodGroup: 'O+' })).toBe(100);
  });

  it('ignores a height that is only spaces', () => {
    expect(profileCompletion(mockStudent, { height: '   ' })).toBe(71);
  });
});

describe('optionalProfileSchema', () => {
  it('lets both optional fields stay empty (never blocks saving)', () => {
    expect(optionalProfileSchema.safeParse({ height: '' }).success).toBe(true);
  });

  it.each(['49', '251', '1.5', 'abc'])('rejects height %j', (height) => {
    expect(optionalProfileSchema.safeParse({ height }).success).toBe(false);
  });

  it('accepts a sensible height and a known blood group', () => {
    expect(optionalProfileSchema.safeParse({ height: '145', bloodGroup: 'AB-' }).success).toBe(
      true,
    );
  });
});

it('formats dates like the design ("12 Mar 2014")', () => {
  expect(formatDisplayDate('2014-03-12')).toBe('12 Mar 2014');
  expect(formatDisplayDate('not a date')).toBe('not a date');
});
