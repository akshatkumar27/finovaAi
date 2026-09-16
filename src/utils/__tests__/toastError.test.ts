import { toast } from 'sonner-native';
import axios from 'axios';
import { toastError } from '../toastError';

// Mock sonner-native
jest.mock('sonner-native', () => ({
    toast: {
        error: jest.fn(),
    },
}));

describe('toastError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle non-axios errors', () => {
        toastError(new Error('Random error'));
        expect(toast.error).toHaveBeenCalledWith('Something failed', { description: 'Try again, or contact support.' });
    });

    it('should handle network/offline errors', () => {
        const error = new axios.AxiosError('Network Error');
        toastError(error);
        expect(toast.error).toHaveBeenCalledWith('Offline', { description: 'Reconnect and try again.' });
    });

    it('should handle 401 Unauthorized', () => {
        const error = new axios.AxiosError('Unauthorized', '401', undefined, {}, { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config: {} as any });
        toastError(error);
        expect(toast.error).toHaveBeenCalledWith('Session expired', { description: 'Sign in again.' });
    });

    it('should handle 403 Forbidden', () => {
        const error = new axios.AxiosError('Forbidden', '403', undefined, {}, { status: 403, data: {}, statusText: 'Forbidden', headers: {}, config: {} as any });
        toastError(error);
        expect(toast.error).toHaveBeenCalledWith('Permission denied', { description: "You don't have access to this." });
    });

    it('should handle 404 Not Found', () => {
        const error = new axios.AxiosError('Not Found', '404', undefined, {}, { status: 404, data: {}, statusText: 'Not Found', headers: {}, config: {} as any });
        toastError(error);
        expect(toast.error).toHaveBeenCalledWith('Not found', { description: "The requested resource doesn't exist." });
    });

    it('should handle 429 Too Many Requests', () => {
        const error = new axios.AxiosError('Too Many Requests', '429', undefined, {}, { status: 429, data: {}, statusText: 'Too Many Requests', headers: {}, config: {} as any });
        toastError(error);
        expect(toast.error).toHaveBeenCalledWith('Too many requests', { description: 'Slow down and try again in a minute.' });
    });

    it('should handle 5xx Server Errors', () => {
        const error = new axios.AxiosError('Internal Server Error', '500', undefined, {}, { status: 500, data: {}, statusText: 'Internal Server Error', headers: {}, config: {} as any });
        toastError(error);
        expect(toast.error).toHaveBeenCalledWith('Our end failed', { description: 'Try again in a minute.' });
    });

    it('should handle 400 with backend message', () => {
        const error = new axios.AxiosError('Bad Request', '400', undefined, {}, { status: 400, data: { message: 'Invalid input provided.' }, statusText: 'Bad Request', headers: {}, config: {} as any });
        toastError(error, { context: 'Validation Error' });
        expect(toast.error).toHaveBeenCalledWith('Validation Error', { description: 'Invalid input provided.' });
    });
    
    it('should fallback to Request failed if no context provided', () => {
        const error = new axios.AxiosError('Bad Request', '400', undefined, {}, { status: 400, data: { message: 'Invalid input provided.' }, statusText: 'Bad Request', headers: {}, config: {} as any });
        toastError(error);
        expect(toast.error).toHaveBeenCalledWith('Request failed', { description: 'Invalid input provided.' });
    });
});
