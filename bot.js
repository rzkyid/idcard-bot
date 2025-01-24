const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
require('dotenv').config();

// Path font kustom
const FONT_PATH = path.join(__dirname, 'fonts', 'Rye-Regular.ttf');

// Register font Rye
registerFont(FONT_PATH, { family: 'Rye' });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

// Fungsi untuk menggambar teks
function drawText(ctx, text, x, y, options = {}) {
    const { font = '28px "Rye"', color = '#FCF4D2', align = 'left' } = options;

    ctx.save(); // Simpan state
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    // Tambahkan shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 4;

    // Gambar teks
    ctx.fillText(text, x, y);
    ctx.restore(); // Kembalikan state
}

// Fungsi untuk menggambar ID Card
async function createIDCard(data) {
    const { templateUrl, avatarUrl, nama, gender, domisili, agama, hobi, userId, createdAt } = data;

    const canvas = createCanvas(960, 540);
    const ctx = canvas.getContext('2d');

    try {
        // Load template dan avatar
        const template = await loadImage(templateUrl);
        const avatar = await loadImage(avatarUrl);

        // Gambar template
        ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

        // Gambar avatar
        ctx.drawImage(avatar, 700, 150, 200, 200); // Posisi avatar

        // Gambar teks
        drawText(ctx, `Nomor KTP: ${userId}`, 50, 50, { font: '28px "Rye"', color: '#000000' });
        drawText(ctx, `Nama: ${nama}`, 50, 100, { font: '28px "Rye"', color: '#000000' });
        drawText(ctx, `Jenis Kelamin: ${gender}`, 50, 150, { font: '28px "Rye"', color: '#000000' });
        drawText(ctx, `Domisili: ${domisili}`, 50, 200, { font: '28px "Rye"', color: '#000000' });
        drawText(ctx, `Agama: ${agama}`, 50, 250, { font: '28px "Rye"', color: '#000000' });
        drawText(ctx, `Hobi: ${hobi}`, 50, 300, { font: '28px "Rye"', color: '#000000' });
        drawText(ctx, `Tanggal Pembuatan: ${createdAt}`, 50, 350, { font: '28px "Rye"', color: '#000000' });

        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Error creating ID card:', error);
        throw error;
    }
}

client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === 'rwktp') {
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
            const templateUrl = 'https://i.imgur.com/rU6Gjvj.png'; // URL template
            const idCardBuffer = await createIDCard({
                templateUrl,
                avatarUrl,
                nama,
                gender,
                domisili,
                agama,
                hobi,
                userId,
                createdAt
            });

            const attachment = new AttachmentBuilder(idCardBuffer, { name: 'idcard.png' });

            await interaction.followUp({
                content: `KTP virtual untuk ${interaction.user.tag}`,
                files: [attachment]
            });
        } catch (error) {
            console.error('Error processing ID card:', error);
        }
    }
});

client.login(process.env.TOKEN);
