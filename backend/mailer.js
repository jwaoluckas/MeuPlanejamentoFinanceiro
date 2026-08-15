const nodemailer = require('nodemailer');
const dns = require('dns').promises;

async function enviar_email(destinatario, assunto, texto){
    const enderecos = await dns.resolve4('smtp.gmail.com');

    const transportador = nodemailer.createTransport({
        host: enderecos[0],
        port: 465,
        secure: true,
        tls: { servername: 'smtp.gmail.com' },
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    return transportador.sendMail({
        from: `"Meu Planejamento Financeiro" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: assunto,
        text: texto,
    });
}

module.exports = { enviar_email };
