import { renderHook, act } from '@testing-library/react';
import { useIntentlessSession } from './useIntentlessSession';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Modules
vi.mock('axios');
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

const mockedAxios = axios as any;

describe('useIntentlessSession', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockedAxios.post.mockResolvedValue({
            data: { id: 's1', tau_limit: 180 }
        });
        mockedAxios.get.mockResolvedValue({
            data: {
                recipe: {
                    title: 'Test Recipe',
                    steps_json: JSON.stringify([{ time: 0, text: 'Start' }])
                },
                proof_state: 'started'
            }
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should initialize session on mount', async () => {
        const { result } = renderHook(() => useIntentlessSession());

        // Wait for useEffect async
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve(); // Flush promises
        });

        expect(result.current.sessionId).toBe('s1');
        expect(result.current.totalTime).toBe(180);
    });

    it('should countdown timer', async () => {
        const { result } = renderHook(() => useIntentlessSession());

        // Wait for init
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        // Initial state
        expect(result.current.timeLeft).toBe(180);

        // Advance 1 sec
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.timeLeft).toBe(179);
    });
});
