const nodemailer = require('nodemailer');

const transportador = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    family: 4,
});

module.exports = {
    enviar_email: (destinatario, assunto, texto) => transportador.sendMail({
        from: `"Meu Planejamento Financeiro" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: assunto,
        text: texto,
    }),
};
