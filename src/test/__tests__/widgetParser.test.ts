import { describe, it, expect } from 'vitest';
import { parseWidgetTag, isStandardWidgetId } from '../../utils/widgetParser';

describe('parseWidgetTag', () => {
  it('should return null widget when no tag is present', () => {
    const result = parseWidgetTag('Hello, this is a regular message.');
    expect(result.widget).toBeNull();
    expect(result.textBefore).toBe('Hello, this is a regular message.');
    expect(result.textAfter).toBe('');
  });

  it('should parse a yesno widget tag', () => {
    const content = 'Do you agree? <$_WGET _id=yesno d={"yesLabel":"Yes","noLabel":"No"} />';
    const result = parseWidgetTag(content);
    expect(result.widget).not.toBeNull();
    expect(result.widget!.id).toBe('yesno');
    expect(result.widget!.data).toEqual({ yesLabel: 'Yes', noLabel: 'No' });
    expect(result.textBefore).toBe('Do you agree?');
    expect(result.textAfter).toBe('');
  });

  it('should parse a survey widget tag', () => {
    const content = '<$_WGET _id=survey d={"title":"Feedback","questions":[{"question":"Rate?","options":["Good","Bad"]}]} />';
    const result = parseWidgetTag(content);
    expect(result.widget).not.toBeNull();
    expect(result.widget!.id).toBe('survey');
    expect(result.widget!.data).toEqual({
      title: 'Feedback',
      questions: [{ question: 'Rate?', options: ['Good', 'Bad'] }],
    });
  });

  it('should extract text before and after the tag', () => {
    const content = 'Before text <$_WGET _id=yesno d={} /> After text';
    const result = parseWidgetTag(content);
    expect(result.textBefore).toBe('Before text');
    expect(result.textAfter).toBe('After text');
    expect(result.widget).not.toBeNull();
  });

  it('should return null widget for invalid JSON data', () => {
    const content = '<$_WGET _id=yesno d={invalid} />';
    const result = parseWidgetTag(content);
    expect(result.widget).toBeNull();
  });

  it('should parse a tag with an empty object', () => {
    const content = '<$_WGET _id=custom-widget d={} />';
    const result = parseWidgetTag(content);
    expect(result.widget).not.toBeNull();
    expect(result.widget!.id).toBe('custom-widget');
    expect(result.widget!.data).toEqual({});
  });

  it('should parse a tag with array data', () => {
    const content = '<$_WGET _id=list d=["a","b","c"] />';
    const result = parseWidgetTag(content);
    expect(result.widget).not.toBeNull();
    expect(result.widget!.data).toEqual(['a', 'b', 'c']);
  });

  it('should only parse the first tag when multiple exist', () => {
    const content = '<$_WGET _id=first d={} /> middle <$_WGET _id=second d={} />';
    const result = parseWidgetTag(content);
    expect(result.widget!.id).toBe('first');
    expect(result.textAfter).toContain('middle');
  });
});

describe('isStandardWidgetId', () => {
  it('should return true for yesno', () => {
    expect(isStandardWidgetId('yesno')).toBe(true);
  });

  it('should return true for survey', () => {
    expect(isStandardWidgetId('survey')).toBe(true);
  });

  it('should return false for custom widget IDs', () => {
    expect(isStandardWidgetId('custom-widget')).toBe(false);
    expect(isStandardWidgetId('my-form')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isStandardWidgetId('')).toBe(false);
  });
});

describe('parseWidgetTag — empty/missing d=', () => {
  it('should parse a tag with d= followed by space (empty data)', () => {
    const content = 'I Need more data! <$_WGET _id=79c56c4d-7ba8-471b-9cb9-a6d9d39382d7 d= />';
    const result = parseWidgetTag(content);
    expect(result.widget).not.toBeNull();
    expect(result.widget!.id).toBe('79c56c4d-7ba8-471b-9cb9-a6d9d39382d7');
    expect(result.widget!.data).toEqual({});
    expect(result.textBefore).toBe('I Need more data!');
  });

  it('should parse a tag without d= at all', () => {
    const content = 'Fill this out: <$_WGET _id=abc-123 />';
    const result = parseWidgetTag(content);
    expect(result.widget).not.toBeNull();
    expect(result.widget!.id).toBe('abc-123');
    expect(result.widget!.data).toEqual({});
    expect(result.textBefore).toBe('Fill this out:');
  });
});

describe('parseWidgetTag — mode attribute', () => {
  it('should default to interactive mode when no mode specified', () => {
    const content = '<$_WGET _id=abc d={} />';
    const result = parseWidgetTag(content);
    expect(result.widget!.mode).toBe('interactive');
  });

  it('should parse mode=readonly', () => {
    const content = '<$_WGET _id=abc d={"name":"John"} mode=readonly />';
    const result = parseWidgetTag(content);
    expect(result.widget!.mode).toBe('readonly');
    expect(result.widget!.data).toEqual({ name: 'John' });
  });

  it('should treat unknown mode values as interactive', () => {
    const content = '<$_WGET _id=abc d={} mode=unknown />';
    const result = parseWidgetTag(content);
    expect(result.widget!.mode).toBe('interactive');
  });

  it('should parse readonly mode without data', () => {
    const content = '<$_WGET _id=abc mode=readonly />';
    const result = parseWidgetTag(content);
    expect(result.widget).not.toBeNull();
    expect(result.widget!.mode).toBe('readonly');
    expect(result.widget!.data).toEqual({});
  });
});
