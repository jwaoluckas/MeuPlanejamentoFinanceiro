const alternador_tema = document.getElementById('alternador_tema');

const etapa_pedir_email = document.getElementById('etapa_pedir_email');
const etapa_digitar_codigo = document.getElementById('etapa_digitar_codigo');
const etapa_nova_senha = document.getElementById('etapa_nova_senha');
const etapa_confirmacao_final = document.getElementById('etapa_confirmacao_final');

const form_pedir_email = document.getElementById('form_pedir_email');
const input_email_recuperacao = document.getElementById('input_email_recuperacao');
const botao_voltar_login = document.getElementById('botao_voltar_login');

const form_digitar_codigo = document.getElementById('form_digitar_codigo');
const inputs_codigo_senha = document.querySelectorAll('#form_digitar_codigo .input_num_esq_senha');
const botao_reenviar_codigo_senha = document.getElementById('botao_reenviar_codigo_senha');

const form_nova_senha = document.getElementById('form_nova_senha');
const input_nova_senha = document.getElementById('input_nova_senha');
const input_confirmar_nova_senha = document.getElementById('input_confirmar_nova_senha');

const botao_ir_para_login_final = document.getElementById('botao_ir_para_login_final');

let email_em_recuperacao = '';
let codigo_verificado = '';

function mostrar_etapa(etapa_visivel){
    [etapa_pedir_email, etapa_digitar_codigo, etapa_nova_senha, etapa_confirmacao_final].forEach((etapa) => {
        etapa.hidden = etapa !== etapa_visivel;
    });
}

function ler_codigo_digitado(inputs){
    return Array.from(inputs).map((input) => input.value.trim()).join('');
}

// ---------- Tema claro/escuro ----------

function aplicar_tema(tema){
    document.documentElement.setAttribute('data-tema', tema);
    alternador_tema.classList.toggle('claro', tema === 'light');
}

alternador_tema.addEventListener('click', () => {
    const novo_tema = document.documentElement.getAttribute('data-tema') === 'light' ? 'dark' : 'light';
    localStorage.setItem('tema', novo_tema);
    aplicar_tema(novo_tema);
});

aplicar_tema(localStorage.getItem('tema') === 'light' ? 'light' : 'dark');

// ---------- Etapa 1: solicitar código ----------

botao_voltar_login.addEventListener('click', () => {
    window.location.href = '../../index.html';
});

form_pedir_email.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    email_em_recuperacao = input_email_recuperacao.value;

    try{
        const resposta = await fetch('/api/usuarios/esqueci-senha/solicitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email_em_recuperacao })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            alert(dados.mensagem);
            mostrar_etapa(etapa_digitar_codigo);
        }

        else{
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao solicitar código de redefinição de senha:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

// ---------- Etapa 2: verificar código ----------

form_digitar_codigo.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const codigo_digitado = ler_codigo_digitado(inputs_codigo_senha);

    try{
        const resposta = await fetch('/api/usuarios/esqueci-senha/verificar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email_em_recuperacao, codigo: codigo_digitado })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            codigo_verificado = codigo_digitado;
            mostrar_etapa(etapa_nova_senha);
        }

        else{
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao verificar código:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

botao_reenviar_codigo_senha.addEventListener('click', async () => {
    try{
        const resposta = await fetch('/api/usuarios/esqueci-senha/solicitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email_em_recuperacao })
        });

        const dados = await resposta.json();
        alert(resposta.ok ? dados.mensagem : ('Erro: ' + dados.erro));
    }

    catch(erro){
        console.error('Erro ao reenviar código:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

// ---------- Etapa 3: definir nova senha ----------

form_nova_senha.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if(input_nova_senha.value !== input_confirmar_nova_senha.value){
        alert('As senhas digitadas não são iguais. Tente novamente!');
        return;
    }

    try{
        const resposta = await fetch('/api/usuarios/esqueci-senha/redefinir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email_em_recuperacao, codigo: codigo_verificado, senha_nova: input_nova_senha.value })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            mostrar_etapa(etapa_confirmacao_final);
        }

        else{
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao redefinir senha:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

// ---------- Etapa 4: confirmação final ----------

botao_ir_para_login_final.addEventListener('click', () => {
    window.location.href = '../../index.html';
});
