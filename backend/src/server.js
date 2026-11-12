const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('DB HOST: ', process.env.DB_HOST);
console.log('DB USER: ', process.env.DB_USER);
console.log('DB NAME:', process.env.DB_NAME);
console.log('DB PASSWORD EXISTS:', !!process.env.DB_PASSWORD);

const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// untuk test backend
app.get('/', (req, res) => {
    res.send('UTM SE&AT Backend is running!');
});

// database test connection
app.get('/api/test-db', async (req, res) =>{
    try {
        const [result] = await db.query(
            'SELECT DATABASE() AS database_name'
        );

        res.json({
            success: true,
            message: 'MySQL connected succesfully!',
            database: result[0].database_name
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});