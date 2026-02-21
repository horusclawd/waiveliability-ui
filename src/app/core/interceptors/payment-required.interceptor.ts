import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const paymentRequiredInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 402) {
        messageService.add({
          severity: 'warn',
          summary: 'Upgrade Required',
          detail: 'Your current plan does not include this feature. Please upgrade your subscription.',
          life: 5000,
        });

        // Dispatch custom event for components that want to open upgrade dialog
        window.dispatchEvent(
          new CustomEvent('billing:upgrade-required', {
            detail: { message: err.error?.message },
          })
        );
      }
      return throwError(() => err);
    })
  );
};
