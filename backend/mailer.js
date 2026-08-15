const nodemailer = require('nodemailer');

const transportador = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

module.exports = {
    enviar_email: (destinatario, assunto, texto) => transportador.sendMail({
        from: process.env.EMAIL_USER,
        to: destinatario,
        subject: assunto,
        text: texto,
    }),
};
