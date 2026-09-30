import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'copCurrency',
  standalone: true
})
export class CopCurrencyPipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    if (value === undefined || value === null) return '$ 0 COP';
    return '$ ' + value.toLocaleString('es-CO') + ' COP';
  }
}
