import { describe, it, expect } from '@jest/globals';
import { Readable } from 'stream';
import { sanitizeCsvCell, parseCsvStream } from '../csv.util';

describe('csv injection protection', () => {
  it('prefixes cells starting with a formula character', () => {
    expect(sanitizeCsvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(sanitizeCsvCell('+cmd')).toBe("'+cmd");
    expect(sanitizeCsvCell('@mail')).toBe("'@mail");
    expect(sanitizeCsvCell('-1')).toBe("'-1");
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1");
  });

  it('trims leading whitespace before detecting formulas', () => {
    expect(sanitizeCsvCell('  =DANGER')).toBe("'  =DANGER");
  });

  it('keeps harmless cells untouched', () => {
    expect(sanitizeCsvCell('Laptop')).toBe('Laptop');
    expect(sanitizeCsvCell('123')).toBe('123');
    expect(sanitizeCsvCell(null)).toBe('');
  });
});

describe('parseCsvStream', () => {
  const csv = [
    'slug,name,sku,variantName',
    'laptop,Laptop,LAP-001,Laptop 16 GB',
    'mouse,Mouse,MOUSE-002,',
    '',
  ].join('\n');

  it('parses a stream into rows without buffering the file', async () => {
    const result = await parseCsvStream(Readable.from([csv]), {
      maxRows: 10,
      expectedColumns: ['slug', 'name', 'sku', 'variantName'],
    });
    expect(result.header).toEqual(['slug', 'name', 'sku', 'variantName']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].sku).toBe('LAP-001');
    expect(result.rows[1].variantName).toBeNull();
  });

  it('rejects files above the row limit', async () => {
    const tooBig = 'slug,name,sku\n' + 'a,A,A-1\n'.repeat(3);
    await expect(
      parseCsvStream(Readable.from([tooBig]), {
        maxRows: 2,
        expectedColumns: ['slug', 'name', 'sku'],
      }),
    ).rejects.toThrow(/maximum/i);
  });

  it('rejects files missing required columns', async () => {
    await expect(
      parseCsvStream(Readable.from(['slug,name\nlaptop,Laptop']), {
        maxRows: 10,
        expectedColumns: ['slug', 'name', 'sku'],
      }),
    ).rejects.toThrow(/Missing required columns/);
  });
});
