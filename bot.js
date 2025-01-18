global.ReadableStream = require('web-streams-polyfill/ponyfill').ReadableStream;
// Import required libraries
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
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

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

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
        const nama = interaction.fields.getTextInputValue('nama');
        const gender = interaction.fields.getTextInputValue('gender');
        const domisili = interaction.fields.getTextInputValue('domisili');
        const agama = interaction.fields.getTextInputValue('agama');
        const hobi = interaction.fields.getTextInputValue('hobi');
        const userId = interaction.user.id;
        const avatarUrl = interaction.user.displayAvatarURL({ format: 'png', size: 256 });
        const createdAt = new Date().toLocaleDateString('id-ID');

        // Generate ID Card
        const canvas = Canvas.createCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');

        // Load template
        const template = await Canvas.loadImage(TEMPLATE_URL);
        ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

        // Load and crop avatar
        const avatar = await Canvas.loadImage(avatarUrl);
        ctx.beginPath();
        ctx.rect(1450, 300, 300, 450); // Define crop area
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 1450, 300, 300, 450);

        // Add text
        ctx.font = '40px Arial';
        ctx.fillStyle = '#FCF4D2';
        ctx.fillText(`Nomor KTP: ${userId}`, 100, 200);
        ctx.fillText(`Nama: ${nama}`, 100, 300);
        ctx.fillText(`Jenis Kelamin: ${gender}`, 100, 400);
        ctx.fillText(`Domisili: ${domisili}`, 100, 500);
        ctx.fillText(`Agama: ${agama}`, 100, 600);
        ctx.fillText(`Hobi: ${hobi}`, 100, 700);
        ctx.fillText(`Tanggal Pembuatan: ${createdAt}`, 1450, 800);

        // Convert to buffer and send
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ktp.png' });

        // Send to target channel
        const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
        if (targetChannel) {
            await targetChannel.send({ content: `KTP virtual untuk ${interaction.user.tag}`, files: [attachment] });
        }

        // Acknowledge interaction
        await interaction.reply({ content: 'KTP virtual Anda telah diproses dan dikirim ke channel tujuan!' });
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