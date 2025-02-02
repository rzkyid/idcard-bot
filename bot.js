require('dotenv').config(); // Load environment variables
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const ALLOWED_CHANNELS = ["123456789012345678"]; // Ganti dengan ID channel yang diizinkan

// Fungsi untuk delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fungsi untuk mencoba kembali dengan retry (Exponential backoff)
const makeRequestWithRetry = async (query) => {
    const MAX_RETRIES = 5; // Maksimal percobaan ulang
    const RETRY_DELAY = 5000; // Delay awal 5 detik

    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            // Melakukan request ke Gemini API
            const response = await axios.post(
                "https://generativelanguage.googleapis.com/v1beta/chat/completions",
                {
                    model: 'gemini-1.5-flash',
                    messages: [
                        {
                            role: 'system',
                            content: 'Kamu berperan sebagai asisten discord yang dapat menjawab setiap pertanyaan',
                        },
                        {
                            role: 'user',
                            content: query,
                        },
                    ],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
                    },
                }
            );

            // Mengambil respons dari Gemini
            const reply = response.data.choices[0].message.content.trim();
            return reply;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                attempts++;
                console.log(`Terlalu banyak permintaan, mencoba lagi setelah ${RETRY_DELAY * attempts} ms...`);
                await delay(RETRY_DELAY * attempts); // Exponential backoff
            } else {
                console.error("Error saat mengakses Gemini API:", error.message);
                throw error;
            }
        }
    }
    throw new Error('Coba lagi setelah beberapa saat, batas maksimum pencobaan tercapai.');
};

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Hanya merespon di channel tertentu
    if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;

    const query = message.content.trim();
    console.log(`Pesan dari ${message.author.tag} di ${message.channel.name}: ${query}`);

    try {
        const reply = await makeRequestWithRetry(query); // Menggunakan fungsi retry
        message.reply(reply); // Mengirimkan jawaban ke pengguna
    } catch (error) {
        console.error('Error with Gemini API:', error);
        message.reply('Maaf, saya lagi bingung nih sama pertanyaannya'); 
    }
});

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} sudah online!`);
});

client.login(process.env.TOKEN);

// Menjalankan server Express untuk menjaga bot tetap hidup
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Bot is running!');
});
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
