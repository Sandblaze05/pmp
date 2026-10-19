import { Injectable, signal } from '@angular/core';
import { ToastMessage, ToastType } from './types/Types';

@Injectable({ providedIn: "root" })
export class Toast {
    private nextId = 0;

    readonly toasts = signal<ToastMessage[]>([]);

    show(message: string, type: ToastType = 'info') {
        const id = ++this.nextId;

        this.toasts.update((toasts) => [
            ...toasts,
            { id, message, type }
        ]);

        setTimeout(() => this.dismiss(id), 4000);
    }

    error(message: string) {
        this.show(message, 'error');
    }

    warn(message: string) {
        this.show(message, 'warning');
    }

    inform(message: string) {
        this.show(message, 'info');
    }

    dismiss(id: number) {
        this.toasts.update((toasts) => toasts.filter(toast => toast.id !== id));
    }


}
