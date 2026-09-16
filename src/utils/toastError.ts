import { toast } from 'sonner-native';
import axios from 'axios';

export function toastError(error: unknown, opts?: { context?: string }) {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            toast.error('Offline', { description: 'Reconnect and try again.' });
            return;
        }

        const status = error.response.status;
        const beMessage = error.response.data?.message;

        switch (status) {
            case 401:
                toast.error('Session expired', { description: 'Sign in again.' });
                return;
            case 403:
                toast.error('Permission denied', { description: 'You don\'t have access to this.' });
                return;
            case 404:
                toast.error('Not found', { description: 'The requested resource doesn\'t exist.' });
                return;
            case 429:
                toast.error('Too many requests', { description: 'Slow down and try again in a minute.' });
                return;
            default:
                if (status >= 500) {
                    toast.error('Our end failed', { description: 'Try again in a minute.' });
                    return;
                }
                if (beMessage) {
                    toast.error(opts?.context || 'Request failed', { description: beMessage });
                    return;
                }
        }
    }

    toast.error('Something failed', { description: 'Try again, or contact support.' });
}
