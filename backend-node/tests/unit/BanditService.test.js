const BanditService = require('../../src/services/BanditService');
const { BanditStat, Recipe, User } = require('../../src/models');

// Mock Sequelize Models
jest.mock('../../src/models', () => ({
    BanditStat: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
    Recipe: {
        findOne: jest.fn(),
    },
    User: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

describe('BanditService', () => {
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

            // 50 - 15 = 35, but clamped to 45
            expect(newTau).toBe(45);
            expect(mockStat.tau_mu).toBe(45);
        });

        it('should NOT go above 300 seconds', async () => {
            const mockStat = { tau_mu: 298, save: jest.fn() };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const newTau = await BanditService.updateTau('user-1', true, 298);

            // 298 + 5 = 303, but clamped to 300
            expect(newTau).toBe(300);
            expect(mockStat.tau_mu).toBe(300);
        });
    });

    describe('calculateEffectiveTau', () => {
        it('should return REDUCED tau (0.8x) in the Morning (8:00)', async () => {
            const mockStat = { tau_mu: 180 };
            BanditStat.findOne.mockResolvedValue(mockStat);

            const morningDate = new Date('2026-02-10T08:00:00');
            const tau = await BanditService.calculateEffectiveTau('u1', morningDate);

            expect(tau).toBe(144); // 180 * 0.8
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
