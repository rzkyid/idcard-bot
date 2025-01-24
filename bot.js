const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

// Inisialisasi Discord Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Inisialisasi Express App untuk Server
const app = express();
const PORT = process.env.PORT || 3000; // Gunakan PORT dari environment atau default 3000

// Express Routing
app.get('/', (req, res) => {
    res.send('Bot is running!'); // Tampilan sederhana saat mengakses root
});

// Start server untuk monitoring
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

// Constants
const TEMPLATE_URL = 'https://i.imgur.com/rU6Gjvj.png'; // Template ID Card
const COMMAND_TRIGGER = 'rwktp'; // Trigger command
const TARGET_CHANNEL_ID = '1313095157477802034'; // Target channel ID

// Register custom font Rye
registerFont('./fonts/Rye-Regular.ttf', { family: 'Rye' });

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

// Function to download images
async function downloadImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error downloading image:', error.message);
        throw new Error('Failed to download image.');
    }
}

// Function to add text with shadow
function addTextWithShadow(ctx, text, font, color, x, y) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Set shadow properties
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 6;

    // Draw text
    ctx.fillText(text, x, y);
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

            // Load template image
            const template = await loadImage(templateBuffer);
            ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

            // Add text to canvas first
            const fontMain = '80px "Rye"';
            addTextWithShadow(ctx, `Nomor KTP: ${userId}`, fontMain, '#FCF4D2', 100, 200);
            addTextWithShadow(ctx, `Nama: ${nama}`, fontMain, '#FCF4D2', 100, 300);
            addTextWithShadow(ctx, `Jenis Kelamin: ${gender}`, fontMain, '#FCF4D2', 100, 400);
            addTextWithShadow(ctx, `Domisili: ${domisili}`, fontMain, '#FCF4D2', 100, 500);
            addTextWithShadow(ctx, `Agama: ${agama}`, fontMain, '#FCF4D2', 100, 600);
            addTextWithShadow(ctx, `Hobi: ${hobi}`, fontMain, '#FCF4D2', 100, 700);
            addTextWithShadow(ctx, `Tanggal Pembuatan: ${createdAt}`, fontMain, '#FCF4D2', 1450, 800);

            // Load and draw avatar after the text
            const avatar = await loadImage(avatarBuffer);
            ctx.drawImage(avatar, 1450, 300, 300, 300); // Position avatar on template

            // Generate and send the image
            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'idcard.png' });

            const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
            if (targetChannel) {
                await targetChannel.send({ content: `KTP virtual untuk ${interaction.user.tag}`, files: [attachment] });
            }
        } catch (error) {
            console.error('Error creating ID card:', error);
        }
    }
});

// Login ke bot Discord
client.login(process.env.TOKEN);
