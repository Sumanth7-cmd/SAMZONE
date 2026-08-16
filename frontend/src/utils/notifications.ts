type ToastTone = 'success' | 'error' | 'info' | 'warning';

export function showToast(message: string, tone: ToastTone = 'success') {
    const colorByTone: Record<ToastTone, string> = {
        success: 'bg-emerald-600',
        error: 'bg-rose-600',
        info: 'bg-slate-700',
        warning: 'bg-amber-600',
    };

    const existing = document.getElementById('samzone-toast-root');
    if (!existing) {
        const root = document.createElement('div');
        root.id = 'samzone-toast-root';
        root.className = 'fixed bottom-4 right-4 z-[100] flex flex-col gap-2';
        document.body.appendChild(root);
    }

    const container = document.getElementById('samzone-toast-root');
    const toast = document.createElement('div');
    toast.className = `min-w-[220px] max-w-[320px] rounded-lg px-4 py-3 text-sm text-white shadow-lg animate-[fadeIn_180ms_ease-out] ${colorByTone[tone]}`;
    toast.textContent = message;

    container?.appendChild(toast);
    window.setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        window.setTimeout(() => toast.remove(), 300);
    }, 2400);
}
