import type { ProductVariant } from '@bendike/shared';

export type Selection = (string | undefined)[];

export function optionNames(variants: ProductVariant[]): string[] {
  return variants[0]?.optionNames ?? [];
}

export function valuesFor(variants: ProductVariant[], selection: Selection, index: number): string[] {
  const values: string[] = [];
  for (const variant of variants) {
    if (!variant.active) {
      continue;
    }
    const matchesEarlierChoices = selection.slice(0, index).every((chosen, i) => chosen === variant.optionValues[i]);
    const value = variant.optionValues[index];
    if (matchesEarlierChoices && value !== undefined && !values.includes(value)) {
      values.push(value);
    }
  }
  return values;
}

export function selectValue(selection: Selection, index: number, value: string): Selection {
  const next = selection.slice(0, index);
  next[index] = value;
  return next;
}

export function findVariant(
  variants: ProductVariant[],
  names: string[],
  selection: Selection,
): ProductVariant | undefined {
  if (names.length === 0 || names.some((_, i) => selection[i] === undefined)) {
    return undefined;
  }
  return variants.find((variant) => variant.active && names.every((_, i) => variant.optionValues[i] === selection[i]));
}
