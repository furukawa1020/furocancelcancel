const BanditService = require('../../src/services/BanditService');
const { BanditStat } = require('../../src/models');
const WeatherService = require('../../src/services/WeatherService');

// Mock Models
jest.mock('../../src/models', () => ({
    BanditStat: {
        findOne: jest.fn(),
        create: jest.fn()
    },
    User: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

// Mock WeatherService
jest.mock('../../src/services/WeatherService');

describe('BanditService with Weather', () => {

    describe('calculateEffectiveTau', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should INCREASE tau (+15%) when COLD (<10C)', async () => {
            const mockStat = { tau_mu: 180 };
            BanditStat.findOne.mockResolvedValue(mockStat);
            WeatherService.getCurrentTemperature.mockResolvedValue(5); // 5 degrees

            // Use Noon (not morning)
            const noon = new Date('2026-02-10T12:00:00');

            const tau = await BanditService.calculateEffectiveTau('u1', noon);

            expect(tau).toBe(207); // 180 * 1.15 = 207 exactly, but float math might make it 206.9999
        });

        it('should DECREASE tau (-10%) when HOT (>30C)', async () => {
            const mockStat = { tau_mu: 180 };
            BanditStat.findOne.mockResolvedValue(mockStat);
            WeatherService.getCurrentTemperature.mockResolvedValue(35); // 35 degrees

            const noon = new Date('2026-02-10T12:00:00');

            const tau = await BanditService.calculateEffectiveTau('u1', noon);

            expect(tau).toBe(162); // 180 * 0.9 = 162
        });

        it('should ignore weather when API fails (null)', async () => {
            const mockStat = { tau_mu: 180 };
            BanditStat.findOne.mockResolvedValue(mockStat);
            WeatherService.getCurrentTemperature.mockResolvedValue(null);

            const noon = new Date('2026-02-10T12:00:00');

            const tau = await BanditService.calculateEffectiveTau('u1', noon);

            expect(tau).toBe(180);
        });
    });
});
