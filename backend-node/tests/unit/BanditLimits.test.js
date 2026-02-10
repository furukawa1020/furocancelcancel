const BanditService = require('../../src/services/BanditService');
const { BanditStat } = require('../../src/models');
const WeatherService = require('../../src/services/WeatherService');

// Mock Models
jest.mock('../../src/models', () => ({
    BanditStat: {
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    }
}));

// Mock Weather Service
jest.mock('../../src/services/WeatherService');

describe('BanditService Strict Limits', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        WeatherService.getCurrentTemperature.mockResolvedValue(null);
    });

    it('should clamp LOW duration to 150s (2.5 mins)', async () => {
        const mockStat = { tau_mu: 100 }; // Legacy value
        BanditStat.findOne.mockResolvedValue(mockStat);

        const tau = await BanditService.calculateEffectiveTau('u1');
        expect(tau).toBe(150);
    });

    it('should clamp HIGH duration to 240s (4 mins)', async () => {
        const mockStat = { tau_mu: 300 }; // Legacy value
        BanditStat.findOne.mockResolvedValue(mockStat);

        const tau = await BanditService.calculateEffectiveTau('u1');
        expect(tau).toBe(240);
    });

    it('should allow 180s (Perfect 3 mins)', async () => {
        const mockStat = { tau_mu: 180 };
        BanditStat.findOne.mockResolvedValue(mockStat);

        const tau = await BanditService.calculateEffectiveTau('u1');
        expect(tau).toBe(180);
    });
});
