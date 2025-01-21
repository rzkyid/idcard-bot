// Tambahkan fungsi drawText
function drawText(ctx, text, font, fontSize, color, x, y) {
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// Import required libraries
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
const app = express();
const PORT = process.env.PORT || 3000;

const TEMPLATE_URL = 'https://i.imgur.com/rU6Gjvj.png'; // URL template gambar ID Card
const COMMAND_TRIGGER = 'rwktp';
const TARGET_CHANNEL_ID = '1313095157477802034'; // Target channel ID

// Register custom font
registerFont('./fonts/Rye-Regular.ttf', { family: 'Rye' });

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

async function downloadImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error downloading image:', error.message);
        throw new Error('Failed to download image.');
    }
}

client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === COMMAND_TRIGGER) {
        const embed = new EmbedBuilder()
            .setTitle('Buat KTP Virtual')
            .setDescription('Klik tombol di bawah untuk mengisi formulir dan membuat KTP virtual Anda!')
            .setColor('#00AAFF');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ktp')
                .setLabel('Buat KTP')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'create_ktp') {
        const modal = new ModalBuilder()
            .setCustomId('ktp_form')
            .setTitle('Isi Data KTP Anda');

        const namaInput = new TextInputBuilder()
            .setCustomId('nama')
            .setLabel('Nama Lengkap')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const genderInput = new TextInputBuilder()
            .setCustomId('gender')
            .setLabel('Jenis Kelamin (L/P)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const domisiliInput = new TextInputBuilder()
            .setCustomId('domisili')
            .setLabel('Domisili')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const agamaInput = new TextInputBuilder()
            .setCustomId('agama')
            .setLabel('Agama')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const hobiInput = new TextInputBuilder()
            .setCustomId('hobi')
            .setLabel('Hobi')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(namaInput),
            new ActionRowBuilder().addComponents(genderInput),
            new ActionRowBuilder().addComponents(domisiliInput),
            new ActionRowBuilder().addComponents(agamaInput),
            new ActionRowBuilder().addComponents(hobiInput)
        );

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'ktp_form') {
        // Respond immediately to avoid timeout
        await interaction.reply({ content: 'KTP virtual Anda sedang diproses...', ephemeral: true });

        const nama = interaction.fields.getTextInputValue('nama');
        const gender = interaction.fields.getTextInputValue('gender');
        const domisili = interaction.fields.getTextInputValue('domisili');
        const agama = interaction.fields.getTextInputValue('agama');
        const hobi = interaction.fields.getTextInputValue('hobi');
        const userId = interaction.user.id;
        const avatarUrl = interaction.user.displayAvatarURL({ size: 256, extension: 'png' });
        const createdAt = new Date().toLocaleDateString('id-ID');

        try {
            const templateBuffer = await downloadImage(TEMPLATE_URL);
            const avatarBuffer = await downloadImage(avatarUrl);

            const canvas = createCanvas(1920, 1080);
            const ctx = canvas.getContext('2d');

            // Load images directly from buffer
            const template = await loadImage(templateBuffer);
            ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

            const avatar = await loadImage(avatarBuffer);
            ctx.drawImage(avatar, 1450, 300, 300, 300); // Ensure avatar maintains 1:1 ratio

            // Add text using drawText
            drawText(ctx, `Nomor KTP: ${userId}`, 'Rye', 40, '#FCF4D2', 100, 200);
            drawText(ctx, `Nama: ${nama}`, 'Rye', 40, '#FCF4D2', 100, 300);
            drawText(ctx, `Jenis Kelamin: ${gender}`, 'Rye', 40, '#FCF4D2', 100, 400);
            drawText(ctx, `Domisili: ${domisili}`, 'Rye', 40, '#FCF4D2', 100, 500);
            drawText(ctx, `Agama: ${agama}`, 'Rye', 40, '#FCF4D2', 100, 600);
            drawText(ctx, `Hobi: ${hobi}`, 'Rye', 40, '#FCF4D2', 100, 700);
            drawText(ctx, `Tanggal Pembuatan: ${createdAt}`, 'Rye', 30, '#FCF4D2', 1450, 800);

            // Convert to buffer and send
            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'idcard.png' });

            // Send to target channel
            const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
            if (targetChannel) {
                await targetChannel.send({ content: `KTP virtual untuk ${interaction.user.tag}`, files: [attachment] });
            }
        } catch (error) {
            console.error('Error creating ID card:', error);
        }
    }
});

// Express routing
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

client.login(process.env.TOKEN);
