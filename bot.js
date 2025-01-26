const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js'); const { createCanvas, loadImage } = require('canvas'); const express = require('express'); require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => { console.log(`Bot is online as ${client.user.tag}`); });

// Fungsi untuk menggambar teks 

function drawText(ctx, text, x, y, options = {}) { const { font = '18px Arial', color = '#000000', align = 'left' } = options;

ctx.save(); // Simpan state
ctx.font = font;
ctx.fillStyle = color;
ctx.textAlign = align;
ctx.textBaseline = 'middle';

// Tambahkan shadow
ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
ctx.shadowBlur = 3;

// Gambar teks
ctx.fillText(text, x, y);
ctx.restore(); // Kembalikan state


}

// Fungsi untuk menggambar ID Card 

async function createIDCard(data) { const { templateUrl, avatarUrl, nama, gender, domisili, agama, hobi, userId, createdAt } = data;

const canvas = createCanvas(480, 270); // Ukuran canvas 480 x 270 px
const ctx = canvas.getContext('2d');

try {
    // Load template dan avatar
    const template = await loadImage(templateUrl);
    const avatar = await loadImage(avatarUrl);

    // Gambar template
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // Gambar avatar
    ctx.drawImage(avatar, 340, 60, 100, 100); // Posisi avatar

    // Gambar teks
    drawText(ctx, `Nomor KTP: ${userId}`, 20, 20, { font: '18px Arial', color: '#FFFFFF' });
    drawText(ctx, `Nama: ${nama}`, 20, 60, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Jenis Kelamin: ${gender}`, 20, 100, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Domisili: ${domisili}`, 20, 140, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Agama: ${agama}`, 20, 180, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Hobi: ${hobi}`, 20, 220, { font: '18px Arial', color: '#000000' });
    drawText(ctx, `Tanggal: ${createdAt}`, 20, 260, { font: '12px Arial', color: '#000000' });

    return canvas.toBuffer('image/png');
} catch (error) {
    console.error('Error creating ID card:', error);
    throw error;
}


}

client.on('messageCreate', async (message) => { if (message.content.toLowerCase() === 'rwktp') { const embed = new EmbedBuilder() .setTitle('Buat KTP Virtual') .setDescription('Klik tombol di bawah untuk mengisi formulir dan membuat KTP virtual Anda!') .setColor('#00AAFF');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('create_ktp')
            .setLabel('Buat KTP')
            .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [row] });
}


});

client.on('interactionCreate', async (interaction) => { if (interaction.isButton() && interaction.customId === 'create\_ktp') { const modal = new ModalBuilder() .setCustomId('ktp\_form') .setTitle('Isi Data KTP Anda');


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

// Express server untuk port 

const app = express(); const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => { res.send('Bot is running!'); });

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });

client.login(process.env.TOKEN);
