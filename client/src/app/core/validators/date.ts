import { AbstractControl, ValidationErrors } from '@angular/forms';

export function noPastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const selected = new Date(control.value);
  if (Number.isNaN(selected.getTime())) return null;

  const now = new Date();

  return selected.getTime() < now.getTime() ? { pastDate: true } : null;
}
