const botao_entrar = document.getElementById('botao_entrar');
const botao_cadastrar = document.getElementById('botao_cadastrar');
const botao_mostrar_senha = document.getElementById('mostrar_senha');
const input_email = document.getElementById('input_email');
const input_senha = document.getElementById('input_senha');
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

botao_entrar.addEventListener('click', async (evento) =>{
    evento.preventDefault();

    try{
        const resposta = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: input_email.value, senha: input_senha.value })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            localStorage.setItem('usuario', JSON.stringify(dados.usuario));
            localStorage.setItem('token', dados.token);
            window.location.href = 'frontend/tela_principal/tela_principal.html';
        }

        else{
            alert("Erro: " + dados.erro);
        }
    }

    catch(erro){
        console.error("Erro ao conectar com o servidor:", erro);
        alert("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
    }
});

botao_cadastrar.addEventListener('click', async (evento) =>{
    evento.preventDefault();

    window.location.href = 'frontend/tela_cadastro/cadastro.html';
});

botao_mostrar_senha.addEventListener('change', () => {
    input_senha.type = botao_mostrar_senha.checked ? 'text' : 'password';
});