const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

// Inisialisasi Discord Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Inisialisasi Express App
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

// Constants
const TEMPLATE_URL = 'https://i.imgur.com/rU6Gjvj.png'; // Template ID Card (960 x 540 px)
const COMMAND_TRIGGER = 'rwktp';
const TARGET_CHANNEL_ID = '1313095157477802034';

// Register font Rye
registerFont('./fonts/Rye-Regular.ttf', { family: 'Rye' });

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

// Download image function
async function downloadImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error downloading image:', error.message);
        throw new Error('Failed to download image.');
    }
}

// Function to draw text with font, color, and shadow explicitly
function drawText(ctx, text, x, y, options = {}) {
    const { font = '28px "Rye"', color = '#FCF4D2', align = 'left' } = options;

    ctx.save(); // Save current state
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    // Set shadow properties
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 4;

    // Draw text
    ctx.fillText(text, x, y);
    ctx.restore(); // Restore state
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

            const canvas = createCanvas(960, 540);
            const ctx = canvas.getContext('2d');

            // Load template image
            const template = await loadImage(templateBuffer);
            ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

            // Draw text
            drawText(ctx, `Nomor KTP: ${userId}`, 50, 50);
            drawText(ctx, `Nama: ${nama}`, 50, 100);
            drawText(ctx, `Jenis Kelamin: ${gender}`, 50, 150);
            drawText(ctx, `Domisili: ${domisili}`, 50, 200);
            drawText(ctx, `Agama: ${agama}`, 50, 250);
            drawText(ctx, `Hobi: ${hobi}`, 50, 300);
            drawText(ctx, `Tanggal Pembuatan: ${createdAt}`, 500, 450);

            // Load and draw avatar
            const avatar = await loadImage(avatarBuffer);
            ctx.drawImage(avatar, 700, 150, 150, 150);

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

client.login(process.env.TOKEN);
