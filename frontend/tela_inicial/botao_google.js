async function handleCredentialResponse(response) {
    try {
        const resposta = await fetch(`${API_BASE_URL}/api/usuarios/login-google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            alert("Login realizado com sucesso!");
        }

        else{
            alert("Erro: " + dados.erro);
        }
    }

    catch(erro){
        console.error("Erro ao conectar com o servidor:", erro);
    }
}

window.onload = function () {
    // 1. Inicializa a biblioteca do Google com o seu ID
    google.accounts.id.initialize({
        client_id: "908803381353-cnv1iuuc37rikt6ucvqeqbq50dg25neb.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    
    // 2. Renderiza o botão na div que criamos no HTML
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { 
            theme: "outline", 
            size: "large", 
            text: "continue_with",
            shape: "pill" // Combina melhor com o border-radius dos seus botões atuais
        } 
    );
}