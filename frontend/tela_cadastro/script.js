const botoes_mostrar_senha = document.querySelectorAll('.mostrar_senha');
const botao_cadastrar = document.getElementById('botao_cadastrar');
const botao_voltar = document.getElementById('botao_voltar');
const alternador_tema = document.getElementById('alternador_tema');

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

botoes_mostrar_senha.forEach((botao_mostrar_senha) => {
    const input_senha = botao_mostrar_senha.previousElementSibling;

    botao_mostrar_senha.addEventListener('click', () => {
        const senha_visivel = input_senha.type === 'text';

        input_senha.type = senha_visivel ? 'password' : 'text';
        botao_mostrar_senha.classList.toggle('ativo', !senha_visivel);
        botao_mostrar_senha.setAttribute('aria-pressed', String(!senha_visivel));
    });
});

botao_voltar.addEventListener('click', async (evento) =>{
    evento.preventDefault();

    window.location.href = '../../index.html';
});

botao_cadastrar.addEventListener('click', async (evento) =>{
    evento.preventDefault();

    const nome = document.querySelector('input[name="nome_usuario"]').value;
    const email = document.querySelector('input[name="email_usuario"]').value;
    const senha = document.getElementById('senha').value;
    const verifique_senha = document.getElementById('verifique_senha').value;

    if(senha.length < 8){
        alert("A senha deve ter pelo menos 8 caracteres.");

        return;
    }

    if(senha !== verifique_senha){
        alert("As senhas digitadas não são iguais. Tente novamente!");

        return;
    }

    try{
        const resposta = await fetch(`${API_BASE_URL}/api/usuarios/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nome, email: email, senha: senha})
        });

        const dados = await resposta.json();

        if(resposta.ok){
            // Contas de teste (backend/usuario_teste.txt) já são criadas direto, sem confirmação
            if(dados.usuario){
                alert("Cadastro realizado com sucesso!");
                window.location.href = '../../index.html';
            }

            else{
                // O id do cadastro pendente vai por sessionStorage (mesma aba, mesma origem),
                // nunca pela URL — assim não fica exposto na barra de endereço nem no histórico.
                sessionStorage.setItem('cadastro_pendente_id', dados.cadastro_pendente_id);
                window.location.href = '../tela_confirmar_email/confirmar_email.html';
            }
        }

        else{
            alert("Erro: " + dados.erro);
        }
    }

    catch(erro){
        console.error("Erro ao conectar com o servidor:", erro);
    }
});