const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = {
    enviar_email: async (destinatario, assunto, texto) => {
        const { data, error } = await resend.emails.send({
            from: 'Meu Planejamento Financeiro <naoresponda@mail.meuplanejamentofinanceiro.dev.br>',
            to: destinatario,
            subject: assunto,
            text: texto,
        });

        if(error){
            throw new Error(error.message || 'Falha ao enviar e-mail via Resend');
        }

        return data;
    },
};
