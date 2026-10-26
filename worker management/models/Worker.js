const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
    workerId: {
        type: String,
        unique: true,
        sparse: true
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: null },
    project: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

// ✅ FIXED: Generate unique Worker ID - no duplicates ever
workerSchema.pre('save', async function (next) {
    if (this.workerId) {
        return next(); // Already has ID (edit), skip
    }

    try {
        const Worker = mongoose.model('Worker');

        // Get the highest existing numeric ID
        const lastWorker = await Worker.findOne({})
            .sort({ workerId: -1 })
            .select('workerId');

        let nextNumber = 1042; // Starting number

        if (lastWorker && lastWorker.workerId) {
            const match = lastWorker.workerId.match(/(\d+)$/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        // Ensure no duplicate
        let newId = `WB-${String(nextNumber).padStart(4, '0')}`;
        let exists = await Worker.findOne({ workerId: newId });

        while (exists) {
            nextNumber++;
            newId = `WB-${String(nextNumber).padStart(4, '0')}`;
            exists = await Worker.findOne({ workerId: newId });
        }

        this.workerId = newId;
        next();
    } catch (error) {
        console.error('Error generating worker ID:', error);
        next(error);
    }
});

module.exports = mongoose.model('Worker', workerSchema);