const request = require('supertest');
const app = require('../../src/app');
const { Session, User, BanditStat, Recipe } = require('../../src/models');
const BanditService = require('../../src/services/BanditService');

// Mock Models
jest.mock('../../src/models', () => ({
    Session: {
        create: jest.fn(),
        findByPk: jest.fn(),
        belongsTo: jest.fn(),
    },
    User: {
        hasMany: jest.fn(),
        hasOne: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn()
    },
    BanditStat: {
        belongsTo: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn()
    },
    Recipe: {
        findOne: jest.fn(),
        count: jest.fn() // For server init check (might run)
    },
    sequelize: {
        sync: jest.fn()
    }
}));

// Mock BanditService to simplify logic
jest.mock('../../src/services/BanditService', () => ({
    getOrCreateUser: jest.fn(),
    getTau: jest.fn(),
    selectRecipe: jest.fn()
}));

describe('API Integration', () => {
    describe('POST /sessions', () => {
        it('should create a session and return 200', async () => {
            // Setup Mocks
            const mockUser = { id: 'u1' };
            const mockRecipe = { id: 1, title: 'Test Recipe' };

            BanditService.getOrCreateUser.mockResolvedValue(mockUser);
            BanditService.getTau.mockResolvedValue({ tau_mu: 180 });
            BanditService.selectRecipe.mockResolvedValue(mockRecipe);

            Session.create.mockResolvedValue({
                toJSON: () => ({ id: 's1', proof_state: 'started' })
            });

            // Execute
            const res = await request(app)
                .post('/sessions')
                .send({ source: 'integration_test', device_id: 'test_dev' });

            // Verify
            expect(res.statusCode).toBe(200);
            expect(res.body.id).toBe('s1');
            expect(res.body.recipe_title).toBe('Test Recipe');
        });
    });
});
