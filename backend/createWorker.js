require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createWorkerUser = async () => {
    try {
        await connectDB();

        // Check if worker already exists
        const workerExists = await User.findOne({ email: 'worker@example.com' });
        if (workerExists) {
            console.log('Worker user already exists');
            process.exit(0);
        }

        // Create worker user
        const hashedPassword = await bcrypt.hash('worker123', 10);
        const worker = await User.create({
            name: 'Sample Worker',
            email: 'worker@example.com',
            password: hashedPassword,
            role: 'worker'
        });

        console.log('Worker user created successfully:', worker);
        process.exit(0);
    } catch (error) {
        console.error('Error creating worker user:', error);
        process.exit(1);
    }
};

createWorkerUser();
