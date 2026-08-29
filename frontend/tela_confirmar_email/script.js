const alternador_tema = document.getElementById('alternador_tema');

const form_confirmar_email = document.getElementById('form_confirmar_email');
const inputs_codigo_email = document.querySelectorAll('#form_confirmar_email .input_codigo_verificacao');
const botao_reenviar_codigo_email = document.getElementById('botao_reenviar_codigo_email');
const botao_cancelar_cadastro = document.getElementById('botao_cancelar_cadastro');

function obter_cadastro_pendente_id(){
    const guardado = sessionStorage.getItem('cadastro_pendente_id');

    if(guardado){
        return guardado;
    }

    // Compatibilidade com o formato antigo (id na query string): migra para o
    // sessionStorage para que o id não continue exposto na URL.
    const id_na_url = new URLSearchParams(window.location.search).get('cadastro_pendente_id');

    if(id_na_url){
        sessionStorage.setItem('cadastro_pendente_id', id_na_url);
        return id_na_url;
    }

    return null;
}

const cadastro_pendente_id = obter_cadastro_pendente_id();

// Nunca deixa o id na barra de endereço, mesmo que tenha chegado pela URL.
if(window.location.search){
    history.replaceState(null, document.title, window.location.pathname);
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

// ---------- Confirmação de e-mail (finaliza a criação da conta) ----------

form_confirmar_email.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if(!cadastro_pendente_id){
        alert('Link de confirmação inválido.');
        return;
    }

    const codigo_digitado = ler_codigo_digitado(inputs_codigo_email);

    try{
        const resposta = await fetch('/api/usuarios/confirmar-email/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cadastro_pendente_id: cadastro_pendente_id, codigo: codigo_digitado })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            sessionStorage.removeItem('cadastro_pendente_id');
            alert(dados.mensagem);
            window.location.href = '../../index.html';
        }

        else{
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao confirmar e-mail:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

botao_reenviar_codigo_email.addEventListener('click', async () => {
    if(!cadastro_pendente_id){
        alert('Link de confirmação inválido.');
        return;
    }

    try{
        const resposta = await fetch('/api/usuarios/confirmar-email/reenviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cadastro_pendente_id: cadastro_pendente_id })
        });

        const dados = await resposta.json();
        alert(resposta.ok ? dados.mensagem : ('Erro: ' + dados.erro));
    }

    catch(erro){
        console.error('Erro ao reenviar código de confirmação:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

botao_cancelar_cadastro.addEventListener('click', () => {
    sessionStorage.removeItem('cadastro_pendente_id');
    window.location.href = '../../index.html';
});
