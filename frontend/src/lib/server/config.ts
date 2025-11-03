import dotenv from 'dotenv';

dotenv.config();

export const config = {
	port: parseInt(process.env.PORT || '3000'),
	telegramApiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
	telegramApiHash: process.env.TELEGRAM_API_HASH || '',
	databaseUrl: process.env.DATABASE_URL || 'file:./database.db'
};

// Валидация обязательных переменных
const requiredEnvVars = ['TELEGRAM_API_ID', 'TELEGRAM_API_HASH'];

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		console.error(`❌ Missing required environment variable: ${envVar}`);
		console.error(`   Get Telegram API credentials at https://my.telegram.org`);
		process.exit(1);
	}
}

console.log(`✅ Configuration loaded successfully`);