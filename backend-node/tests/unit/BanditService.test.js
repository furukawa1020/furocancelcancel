const BanditService = require('../../src/services/BanditService');
const { BanditStat } = require('../../src/models');
const WeatherService = require('../../src/services/WeatherService');

// Mock Models
jest.mock('../../src/models', () => ({
    BanditStat: {
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn() // Add update if needed
    }
}));

// Mock Weather Service
jest.mock('../../src/services/WeatherService');

describe('BanditService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: No weather impact
        WeatherService.getCurrentTemperature.mockResolvedValue(null);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updateTau', () => {
        it('should INCREASE tau when feedback is OK', async () => {
            const mockStat = { tau_mu: 180, save: jest.fn() };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const newTau = await BanditService.updateTau('user-1', true, 180);

            expect(newTau).toBe(185); // 180 + 5
            expect(mockStat.tau_mu).toBe(185);
            expect(mockStat.save).toHaveBeenCalled();
        });

        it('should DECREASE tau significantly when feedback is BAD', async () => {
            const mockStat = { tau_mu: 180, save: jest.fn() };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const newTau = await BanditService.updateTau('user-1', false, 180);

            expect(newTau).toBe(165); // 180 - 15
            expect(mockStat.tau_mu).toBe(165);
            expect(mockStat.save).toHaveBeenCalled();
        });

        it('should NOT go below 45 seconds', async () => {
            const mockStat = { tau_mu: 50, save: jest.fn() };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const newTau = await BanditService.updateTau('user-1', false, 50);

            // 50 - 15 = 35, but clamped to 150 (New Min)
            expect(newTau).toBe(150);
            expect(mockStat.tau_mu).toBe(150);
        });

        it('should NOT go above 240 seconds', async () => {
            const mockStat = { tau_mu: 298, save: jest.fn() };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const newTau = await BanditService.updateTau('user-1', true, 298);

            // 298 + 5 = 303, but clamped to 240 (New Max)
            expect(newTau).toBe(240);
            expect(mockStat.tau_mu).toBe(240);
        });
    });

    describe('calculateEffectiveTau', () => {
        it('should return REDUCED tau (0.8x) BUT CLAMPED to 150s in the Morning', async () => {
            const mockStat = { tau_mu: 180 };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const morningDate = new Date('2026-02-10T08:00:00');
            const tau = await BanditService.calculateEffectiveTau('u1', morningDate);

            // 180 * 0.8 = 144 -> Clamped to 150
            expect(tau).toBe(150);
        });

        it('should return NORMAL tau (1.0x) at Night (20:00)', async () => {
            const mockStat = { tau_mu: 180 };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const nightDate = new Date('2026-02-10T20:00:00');
            const tau = await BanditService.calculateEffectiveTau('u1', nightDate);

            expect(tau).toBe(180);
        });
    });
});
