const fs = require('fs');
const path = require('path');

// Epsilon-Greedy Contextual Bandit
// Q(s, a) = (1 - alpha) * Q(s, a) + alpha * r
// s = Context (Temperature State: COLD, COMFORT, HOT)
// a = Action (Recipe Tier: 1min, 2min, 3min)
// r = Reward (OK: +1, BAD: -1)

const ACTIONS = ['3min', '2min', '1min'];
const ALPHA = 0.1; // Learning Rate
const EPSILON = 0.2; // Exploration Rate

const MEMORY_FILE = path.join(__dirname, '../../brain_memory.json');

class BanditBrain {
    constructor() {
        this.qTable = {}; // Key: "Context_Action" -> Value: Score (Float)
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(MEMORY_FILE)) {
                this.qTable = JSON.parse(fs.readFileSync(MEMORY_FILE));
            } else {
                this.initialize();
            }
        } catch (e) {
            this.initialize();
        }
    }

    save() {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.qTable, null, 2));
    }

    initialize() {
        // Init with optimistic values to encourage exploration
        const contexts = ['COLD', 'COMFORT', 'HOT'];
        contexts.forEach(ctx => {
            ACTIONS.forEach(action => {
                this.qTable[`${ctx}_${action}`] = 0.5; // Start neutral
            });
        });
        // Bias: Cold -> 3min is good
        this.qTable['COLD_3min'] = 0.8;
        // Bias: Hot -> 2min is good
        this.qTable['HOT_2min'] = 0.8;
    }

    getContext(temp) {
        if (temp < 10) return 'COLD';
        if (temp > 28) return 'HOT';
        return 'COMFORT';
    }

    // Decide Action
    chooseAction(temp) {
        const context = this.getContext(temp);

        // Exploration
        if (Math.random() < EPSILON) {
            const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
            console.log(`[AI] Context: ${context} -> EXPLORE -> ${randomAction}`);
            return randomAction;
        }

        // Exploitation (Greedy)
        let bestAction = ACTIONS[0];
        let maxQ = -Infinity;

        ACTIONS.forEach(action => {
            const key = `${context}_${action}`;
            const q = this.qTable[key] || 0.0;
            if (q > maxQ) {
                maxQ = q;
                bestAction = action;
            }
        });

        console.log(`[AI] Context: ${context} -> EXPLOIT (Q=${maxQ.toFixed(2)}) -> ${bestAction}`);
        return bestAction;
    }

    // Learn from Feedback
    learn(temp, action, reward) {
        const context = this.getContext(temp);
        const key = `${context}_${action}`;
        const oldQ = this.qTable[key] || 0.0;

        // Q-Learning Update Rule
        const newQ = (1 - ALPHA) * oldQ + ALPHA * reward;
        this.qTable[key] = newQ;

        console.log(`[AI] LEARNING: ${key} | Reward: ${reward} | Q: ${oldQ.toFixed(2)} -> ${newQ.toFixed(2)}`);
        this.save();
    }
}

module.exports = new BanditBrain();
