const botao_perfil = document.getElementById('botao_perfil');
const menu_perfil = document.getElementById('menu_perfil');
const nome_usuario = document.getElementById('nome_usuario');
const botao_sair = document.getElementById('botao_sair');
const botao_ir_perfil = document.getElementById('botao_ir_perfil');
const alternador_tema = document.getElementById('alternador_tema');
const botao_alternar_tema = document.getElementById('botao_alternar_tema');

const fundo_modal_perfil = document.getElementById('fundo_modal_perfil');
const botao_fechar_modal_perfil = document.getElementById('botao_fechar_modal_perfil');
const perfil_nome = document.getElementById('perfil_nome');
const perfil_email = document.getElementById('perfil_email');
const botao_alterar_senha = document.getElementById('botao_alterar_senha');
const botao_excluir_perfil = document.getElementById('botao_excluir_perfil');

const fundo_modal_senha = document.getElementById('fundo_modal_senha');
const botao_fechar_modal_senha = document.getElementById('botao_fechar_modal_senha');
const form_alterar_senha = document.getElementById('form_alterar_senha');
const senha_antiga = document.getElementById('senha_antiga');
const senha_nova = document.getElementById('senha_nova');
const senha_nova_confirmacao = document.getElementById('senha_nova_confirmacao');

const botao_planejamento = document.getElementById('botao_planejamento');
const ultimo_mes_informado = document.getElementById('ultimo_mes_informado');
const botao_lancar_mes = document.getElementById('botao_lancar_mes');
const rotulo_mes_editavel = document.getElementById('rotulo_mes_editavel');
const form_lancamento = document.getElementById('form_lancamento');
const lancamento_tipo = document.getElementById('lancamento_tipo');
const lancamento_nome = document.getElementById('lancamento_nome');
const lancamento_valor = document.getElementById('lancamento_valor');
const opcao_parcelado = document.getElementById('opcao_parcelado');
const lancamento_parcelado = document.getElementById('lancamento_parcelado');
const campos_parcela = document.getElementById('campos_parcela');
const lancamento_parcela_atual = document.getElementById('lancamento_parcela_atual');
const lancamento_parcela_total = document.getElementById('lancamento_parcela_total');
const texto_modelo_ativo = document.getElementById('texto_modelo_ativo');
const seletor_modelo = document.getElementById('seletor_modelo');
const select_modelo = document.getElementById('select_modelo');
const botao_aplicar_modelo = document.getElementById('botao_aplicar_modelo');
const botao_novo_modelo = document.getElementById('botao_novo_modelo');
const form_novo_modelo = document.getElementById('form_novo_modelo');
const novo_modelo_nome = document.getElementById('novo_modelo_nome');
const novo_modelo_necessidades = document.getElementById('novo_modelo_necessidades');
const novo_modelo_desejos = document.getElementById('novo_modelo_desejos');
const novo_modelo_investimentos = document.getElementById('novo_modelo_investimentos');

const select_tipo_filtro = document.getElementById('select_tipo_filtro');
const filtro_ano = document.getElementById('filtro_ano');
const filtro_data_inicio = document.getElementById('filtro_data_inicio');
const filtro_data_fim = document.getElementById('filtro_data_fim');
const grafico_gastos = document.getElementById('grafico_gastos');
const tooltip_grafico = document.getElementById('tooltip_grafico');

const lista_rendas = document.getElementById('lista_rendas');
const lista_necessidades = document.getElementById('lista_necessidades');
const lista_desejos = document.getElementById('lista_desejos');
const lista_investimentos = document.getElementById('lista_investimentos');
const total_renda = document.getElementById('total_renda');
const limite_necessidades = document.getElementById('limite_necessidades');
const gasto_necessidades = document.getElementById('gasto_necessidades');
const sobra_necessidades = document.getElementById('sobra_necessidades');
const limite_desejos = document.getElementById('limite_desejos');
const gasto_desejos = document.getElementById('gasto_desejos');
const sobra_desejos = document.getElementById('sobra_desejos');
const limite_investimentos = document.getElementById('limite_investimentos');
const gasto_investimentos = document.getElementById('gasto_investimentos');
const sobra_investimentos = document.getElementById('sobra_investimentos');
const total_gasto = document.getElementById('total_gasto');
const total_sobrou = document.getElementById('total_sobrou');

const botao_exportar_pdf = document.getElementById('botao_exportar_pdf');
const fundo_modal_exportar = document.getElementById('fundo_modal_exportar');
const botao_fechar_modal_exportar = document.getElementById('botao_fechar_modal_exportar');
const pergunta_exportar = document.getElementById('pergunta_exportar');
const opcoes_exportar = document.getElementById('opcoes_exportar');
const botao_exportar_um_mes = document.getElementById('botao_exportar_um_mes');
const botao_exportar_varios_meses = document.getElementById('botao_exportar_varios_meses');
const selecao_um_mes = document.getElementById('selecao_um_mes');
const exportar_mes_unico = document.getElementById('exportar_mes_unico');
const botao_confirmar_exportar_um_mes = document.getElementById('botao_confirmar_exportar_um_mes');
const selecao_varios_meses = document.getElementById('selecao_varios_meses');
const exportar_mes_inicio = document.getElementById('exportar_mes_inicio');
const exportar_mes_fim = document.getElementById('exportar_mes_fim');
const botao_confirmar_exportar_varios_meses = document.getElementById('botao_confirmar_exportar_varios_meses');

const usuario = JSON.parse(localStorage.getItem('usuario'));

const formatador_moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

let modelo_ativo_atual = null;
let modo_edicao_ativo = false;

if(usuario){
    nome_usuario.textContent = usuario.nome;
}

botao_perfil.addEventListener('click', () => {
    menu_perfil.classList.toggle('aberto');
});

botao_sair.addEventListener('click', () => {
    localStorage.removeItem('usuario');
    window.location.href = '../../index.html';
});

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

// ---------- Perfil do usuário ----------

function abrir_modal_perfil(){
    if(!usuario){
        return;
    }

    perfil_nome.textContent = usuario.nome;
    perfil_email.textContent = usuario.email;
    menu_perfil.classList.remove('aberto');
    fundo_modal_perfil.hidden = false;
}

function fechar_modal_perfil(){
    fundo_modal_perfil.hidden = true;
}

botao_ir_perfil.addEventListener('click', abrir_modal_perfil);
botao_fechar_modal_perfil.addEventListener('click', fechar_modal_perfil);

fundo_modal_perfil.addEventListener('click', (evento) => {
    if(evento.target === fundo_modal_perfil){
        fechar_modal_perfil();
    }
});

function abrir_modal_senha(){
    form_alterar_senha.reset();
    fundo_modal_senha.hidden = false;
}

function fechar_modal_senha(){
    fundo_modal_senha.hidden = true;
}

botao_alterar_senha.addEventListener('click', abrir_modal_senha);
botao_fechar_modal_senha.addEventListener('click', fechar_modal_senha);

fundo_modal_senha.addEventListener('click', (evento) => {
    if(evento.target === fundo_modal_senha){
        fechar_modal_senha();
    }
});

form_alterar_senha.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if(!usuario){
        return;
    }

    if(senha_nova.value !== senha_nova_confirmacao.value){
        alert('A confirmação não é igual à nova senha.');
        return;
    }

    try{
        const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario.id}/senha`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha_antiga: senha_antiga.value, senha_nova: senha_nova.value })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            fechar_modal_senha();
            alert('Senha alterada com sucesso!');
        }

        else{
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao alterar senha:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

botao_excluir_perfil.addEventListener('click', async () => {
    if(!usuario){
        return;
    }

    const confirmou = confirm('Tem certeza que deseja excluir seu perfil? Essa ação não pode ser desfeita e todos os seus dados serão apagados.');

    if(!confirmou){
        return;
    }

    try{
        const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario.id}`, { method: 'DELETE' });

        if(resposta.ok){
            localStorage.removeItem('usuario');
            window.location.href = '../../index.html';
        }

        else{
            const dados = await resposta.json();
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao excluir perfil:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

botao_planejamento.addEventListener('click', () => {
    seletor_modelo.hidden = !seletor_modelo.hidden;
    modo_edicao_ativo = !seletor_modelo.hidden;
    botao_planejamento.textContent = seletor_modelo.hidden ? 'EDITAR PLANEJAMENTO' : 'FECHAR EDIÇÃO';

    if(modelo_ativo_atual){
        calcular_e_atualizar_informacoes(modelo_ativo_atual);
    }
});

function fechar_edicao_de_planejamento(){
    seletor_modelo.hidden = true;
    modo_edicao_ativo = false;
    botao_planejamento.textContent = 'EDITAR PLANEJAMENTO';
}

// ---------- Lançamentos mensais (renda/gastos reais, vindos do banco) ----------

const NOMES_MESES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

let mes_editavel_atual = null;
let dados_financeiros_atuais = { rendas: [], necessarios: [], desejos: [], investimentos: [] };

function formatar_mes_ano(ano, mes){
    return `${NOMES_MESES_LONGO[mes - 1]} de ${ano}`;
}

function gerar_opcoes_meses(quantidade){
    const hoje = new Date();
    const opcoes = [];

    for(let i = 0; i < quantidade; i++){
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        opcoes.push({ ano: data.getFullYear(), mes: data.getMonth() + 1 });
    }

    return opcoes;
}

function preencher_select_meses(elemento_select, quantidade){
    elemento_select.innerHTML = '';

    gerar_opcoes_meses(quantidade).forEach(({ ano, mes }) => {
        const opcao = document.createElement('option');
        opcao.value = `${ano}-${String(mes).padStart(2, '0')}`;
        opcao.textContent = formatar_mes_ano(ano, mes);
        elemento_select.appendChild(opcao);
    });
}

function gerar_opcoes_anos(quantidade){
    const ano_atual = new Date().getFullYear();
    const opcoes = [];

    for(let i = 0; i < quantidade; i++){
        opcoes.push(ano_atual - i);
    }

    return opcoes;
}

function preencher_select_anos(elemento_select, quantidade){
    elemento_select.innerHTML = '';

    gerar_opcoes_anos(quantidade).forEach((ano) => {
        const opcao = document.createElement('option');
        opcao.value = ano;
        opcao.textContent = ano;
        elemento_select.appendChild(opcao);
    });
}

function formatar_data_iso(data){
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function validar_data_nao_futura(elemento_input){
    if(!elemento_input.value){
        return true;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const data_escolhida = new Date(`${elemento_input.value}T00:00:00`);

    if(data_escolhida > hoje){
        alert('Selecione uma data que já passou.');
        elemento_input.value = '';
        return false;
    }

    return true;
}

function somar(itens){
    return itens.reduce((soma, item) => soma + item.valor, 0);
}

async function carregar_ultimo_mes(usuario_id){
    const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario_id}/ultimo-mes`);
    const dados = await resposta.json();
    return dados.ultimo_mes;
}

async function carregar_mes_editavel(usuario_id){
    const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario_id}/mes-editavel`);
    const dados = await resposta.json();
    return dados.mes_editavel;
}

async function carregar_lancamentos(usuario_id, ano, mes){
    const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario_id}/lancamentos?ano=${ano}&mes=${mes}`);
    const dados = await resposta.json();
    return dados.lancamentos;
}

function agrupar_lancamentos(lancamentos){
    const grupos = { rendas: [], necessarios: [], desejos: [], investimentos: [] };
    const chave_por_tipo = { renda: 'rendas', necessario: 'necessarios', desejo: 'desejos', investimento: 'investimentos' };

    lancamentos.forEach((item) => {
        const chave = chave_por_tipo[item.tipo];

        if(chave){
            grupos[chave].push({
                id: item.id,
                nome: item.nome,
                valor: Number(item.valor),
                parcela_atual: item.parcela_atual,
                parcela_total: item.parcela_total
            });
        }
    });

    return grupos;
}

async function excluir_lancamento(id){
    try{
        const resposta = await fetch(`${API_BASE_URL}/api/lancamentos/${id}`, { method: 'DELETE' });

        if(resposta.ok){
            await carregar_e_atualizar_tudo();
        }

        else{
            alert('Não foi possível remover o lançamento.');
        }
    }

    catch(erro){
        console.error('Erro ao remover lançamento:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
}

function renderizar_lista(elemento, itens, permite_excluir){
    elemento.innerHTML = '';

    if(itens.length === 0){
        const item = document.createElement('li');
        item.textContent = 'Nenhum lançamento cadastrado.';
        elemento.appendChild(item);
        return;
    }

    itens.forEach((item) => {
        const linha = document.createElement('li');

        const rotulo = document.createElement('span');
        rotulo.textContent = item.parcela_atual && item.parcela_total
            ? `${item.nome} (parcela ${item.parcela_atual} de ${item.parcela_total})`
            : item.nome;

        const grupo_valor = document.createElement('div');
        grupo_valor.className = 'grupo_valor_item';

        const valor = document.createElement('span');
        valor.textContent = formatador_moeda.format(item.valor);
        grupo_valor.appendChild(valor);

        if(permite_excluir && item.id){
            const botao_excluir = document.createElement('button');
            botao_excluir.type = 'button';
            botao_excluir.className = 'botao_excluir_item';
            botao_excluir.textContent = '×';
            botao_excluir.addEventListener('click', () => excluir_lancamento(item.id));
            grupo_valor.appendChild(botao_excluir);
        }

        linha.appendChild(rotulo);
        linha.appendChild(grupo_valor);
        elemento.appendChild(linha);
    });
}

function definir_valor_sobra(elemento, valor, esta_ruim){
    elemento.textContent = formatador_moeda.format(valor);
    elemento.classList.toggle('negativo', esta_ruim);
}

function calcular_resumo_financeiro(dados, modelo){
    const total_renda = somar(dados.rendas);
    const total_necessarios = somar(dados.necessarios);
    const total_desejos = somar(dados.desejos);
    const total_investido = somar(dados.investimentos);

    const limite_necessarios_valor = total_renda * modelo.porcent_necessidades / 100;
    const limite_desejos_valor = total_renda * modelo.porcent_desejos / 100;
    const limite_investimentos_valor = total_renda * modelo.porcent_investimentos / 100;

    const sobra_necessarios = limite_necessarios_valor - total_necessarios;
    const sobra_desejos = limite_desejos_valor - total_desejos;

    // Para investimentos o "estipulado" é uma meta mínima de quanto guardar, não um teto de gasto.
    // Por isso o sinal aqui é o contrário do necessário/desejos: FALTA guardar quando positivo
    // (guardou menos que a meta) — guardar mais que a meta é bom, não um estouro de orçamento.
    const falta_guardar = limite_investimentos_valor - total_investido;

    const total_gasto = total_necessarios + total_desejos + total_investido;
    const total_sobrou = total_renda - total_gasto;

    return {
        total_renda, total_necessarios, total_desejos, total_investido,
        limite_necessarios_valor, limite_desejos_valor, limite_investimentos_valor,
        sobra_necessarios, sobra_desejos, falta_guardar,
        total_gasto, total_sobrou
    };
}

function calcular_e_atualizar_informacoes(modelo){
    const dados = dados_financeiros_atuais;
    const resumo = calcular_resumo_financeiro(dados, modelo);

    const pode_excluir = modo_edicao_ativo;
    renderizar_lista(lista_rendas, dados.rendas, pode_excluir);
    renderizar_lista(lista_necessidades, dados.necessarios, pode_excluir);
    renderizar_lista(lista_desejos, dados.desejos, pode_excluir);
    renderizar_lista(lista_investimentos, dados.investimentos, pode_excluir);

    total_renda.textContent = formatador_moeda.format(resumo.total_renda);

    limite_necessidades.textContent = formatador_moeda.format(resumo.limite_necessarios_valor);
    gasto_necessidades.textContent = formatador_moeda.format(resumo.total_necessarios);
    definir_valor_sobra(sobra_necessidades, resumo.sobra_necessarios, resumo.sobra_necessarios < 0);

    limite_desejos.textContent = formatador_moeda.format(resumo.limite_desejos_valor);
    gasto_desejos.textContent = formatador_moeda.format(resumo.total_desejos);
    definir_valor_sobra(sobra_desejos, resumo.sobra_desejos, resumo.sobra_desejos < 0);

    limite_investimentos.textContent = formatador_moeda.format(resumo.limite_investimentos_valor);
    gasto_investimentos.textContent = formatador_moeda.format(resumo.total_investido);
    definir_valor_sobra(sobra_investimentos, resumo.falta_guardar, resumo.falta_guardar > 0);

    total_gasto.textContent = formatador_moeda.format(resumo.total_gasto);
    definir_valor_sobra(total_sobrou, resumo.total_sobrou, resumo.total_sobrou < 0);

    if(modelo.nome){
        texto_modelo_ativo.textContent = `${modelo.nome} (${modelo.porcent_necessidades}-${modelo.porcent_desejos}-${modelo.porcent_investimentos})`;
    }
}

async function carregar_e_atualizar_tudo(){
    if(!usuario){
        return;
    }

    const ultimo_mes = await carregar_ultimo_mes(usuario.id);
    ultimo_mes_informado.textContent = ultimo_mes ? formatar_mes_ano(ultimo_mes.ano, ultimo_mes.mes) : 'nenhum mês informado ainda';

    mes_editavel_atual = await carregar_mes_editavel(usuario.id);
    rotulo_mes_editavel.textContent = formatar_mes_ano(mes_editavel_atual.ano, mes_editavel_atual.mes);

    const lancamentos = await carregar_lancamentos(usuario.id, mes_editavel_atual.ano, mes_editavel_atual.mes);
    dados_financeiros_atuais = agrupar_lancamentos(lancamentos);

    if(modelo_ativo_atual){
        calcular_e_atualizar_informacoes(modelo_ativo_atual);
    }
}

botao_lancar_mes.addEventListener('click', () => {
    form_lancamento.hidden = !form_lancamento.hidden;
});

function tipo_aceita_parcelamento(tipo){
    return tipo === 'necessario' || tipo === 'desejo';
}

function resetar_campos_parcela(){
    lancamento_parcelado.checked = false;
    campos_parcela.hidden = true;
    lancamento_parcela_atual.value = '';
    lancamento_parcela_total.value = '';
}

lancamento_tipo.addEventListener('change', () => {
    opcao_parcelado.hidden = !tipo_aceita_parcelamento(lancamento_tipo.value);

    if(opcao_parcelado.hidden){
        resetar_campos_parcela();
    }
});

lancamento_parcelado.addEventListener('change', () => {
    campos_parcela.hidden = !lancamento_parcelado.checked;

    if(!lancamento_parcelado.checked){
        lancamento_parcela_atual.value = '';
        lancamento_parcela_total.value = '';
    }
});

form_lancamento.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if(!usuario || !mes_editavel_atual){
        return;
    }

    const esta_parcelado = tipo_aceita_parcelamento(lancamento_tipo.value) && lancamento_parcelado.checked;

    if(esta_parcelado){
        const parcela_atual = Number(lancamento_parcela_atual.value);
        const parcela_total = Number(lancamento_parcela_total.value);

        if(!parcela_atual || !parcela_total || parcela_atual < 1 || parcela_total < parcela_atual){
            alert('Informe corretamente em qual parcela está e o total de parcelas.');
            return;
        }
    }

    try{
        const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario.id}/lancamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ano: mes_editavel_atual.ano,
                mes: mes_editavel_atual.mes,
                tipo: lancamento_tipo.value,
                nome: lancamento_nome.value,
                valor: Number(lancamento_valor.value),
                parcela_atual: esta_parcelado ? Number(lancamento_parcela_atual.value) : null,
                parcela_total: esta_parcelado ? Number(lancamento_parcela_total.value) : null
            })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            form_lancamento.reset();
            form_lancamento.hidden = true;
            opcao_parcelado.hidden = true;
            resetar_campos_parcela();
            await carregar_e_atualizar_tudo();
        }

        else{
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao lançar informação mensal:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

// ---------- Sistema financeiro (modelos_orcamentarios) ----------

async function carregar_modelos(usuario_id){
    const resposta = await fetch(`${API_BASE_URL}/api/modelos-orcamentarios?usuario_id=${usuario_id}`);
    const dados = await resposta.json();

    select_modelo.innerHTML = '';

    dados.modelos.forEach((modelo) => {
        const opcao = document.createElement('option');
        opcao.value = modelo.id;
        opcao.textContent = `${modelo.nome} (${modelo.porcent_necessidades}-${modelo.porcent_desejos}-${modelo.porcent_investimentos})`;
        opcao.dataset.nome = modelo.nome;
        opcao.dataset.necessidades = modelo.porcent_necessidades;
        opcao.dataset.desejos = modelo.porcent_desejos;
        opcao.dataset.investimentos = modelo.porcent_investimentos;
        select_modelo.appendChild(opcao);
    });
}

async function carregar_modelo_ativo(usuario_id){
    const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario_id}/modelo-ativo`);

    if(!resposta.ok){
        return null;
    }

    const dados = await resposta.json();
    return dados.modelo;
}

botao_aplicar_modelo.addEventListener('click', async () => {
    const opcao_selecionada = select_modelo.options[select_modelo.selectedIndex];

    if(!opcao_selecionada || !usuario){
        return;
    }

    try{
        const resposta = await fetch(`${API_BASE_URL}/api/usuarios/${usuario.id}/modelo-ativo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelo_id: opcao_selecionada.value })
        });

        const dados = await resposta.json();

        if(resposta.ok){
            modelo_ativo_atual = {
                nome: opcao_selecionada.dataset.nome,
                porcent_necessidades: Number(opcao_selecionada.dataset.necessidades),
                porcent_desejos: Number(opcao_selecionada.dataset.desejos),
                porcent_investimentos: Number(opcao_selecionada.dataset.investimentos)
            };

            fechar_edicao_de_planejamento();
            calcular_e_atualizar_informacoes(modelo_ativo_atual);
            alert('Planejamento aplicado ao seu orçamento!');
        }

        else{
            alert('Erro: ' + dados.erro);
        }
    }

    catch(erro){
        console.error('Erro ao aplicar modelo orçamentário:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

botao_novo_modelo.addEventListener('click', () => {
    form_novo_modelo.hidden = !form_novo_modelo.hidden;
});

form_novo_modelo.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if(!usuario){
        return;
    }

    const porcent_necessidades = Number(novo_modelo_necessidades.value);
    const porcent_desejos = Number(novo_modelo_desejos.value);
    const porcent_investimentos = Number(novo_modelo_investimentos.value);

    if(porcent_necessidades + porcent_desejos + porcent_investimentos !== 100){
        alert('A soma das porcentagens deve fechar exatamente em 100%.');
        return;
    }

    try{
        const resposta_criar = await fetch(`${API_BASE_URL}/api/modelos-orcamentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: novo_modelo_nome.value,
                porcent_necessidades: porcent_necessidades,
                porcent_desejos: porcent_desejos,
                porcent_investimentos: porcent_investimentos,
                usuario_id: usuario.id
            })
        });

        const dados_criar = await resposta_criar.json();

        if(!resposta_criar.ok){
            alert('Erro: ' + dados_criar.erro);
            return;
        }

        await carregar_modelos(usuario.id);
        select_modelo.value = dados_criar.modelo.id;

        await fetch(`${API_BASE_URL}/api/usuarios/${usuario.id}/modelo-ativo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelo_id: dados_criar.modelo.id })
        });

        modelo_ativo_atual = {
            nome: dados_criar.modelo.nome,
            porcent_necessidades: dados_criar.modelo.porcent_necessidades,
            porcent_desejos: dados_criar.modelo.porcent_desejos,
            porcent_investimentos: dados_criar.modelo.porcent_investimentos
        };

        form_novo_modelo.reset();
        form_novo_modelo.hidden = true;
        fechar_edicao_de_planejamento();
        calcular_e_atualizar_informacoes(modelo_ativo_atual);
        alert('Novo planejamento criado e aplicado ao seu orçamento!');
    }

    catch(erro){
        console.error('Erro ao criar modelo orçamentário:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});

// ---------- Gráfico de gastos (dados reais, agregados) ----------

async function total_gasto_do_mes(ano, mes){
    if(!usuario){
        return 0;
    }

    const lancamentos = await carregar_lancamentos(usuario.id, ano, mes);
    const dados = agrupar_lancamentos(lancamentos);

    return somar(dados.necessarios) + somar(dados.desejos) + somar(dados.investimentos);
}

async function gerar_serie_anual(ano){
    const nomes_meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const pontos = [];

    for(let mes = 1; mes <= 12; mes++){
        pontos.push({ rotulo: nomes_meses[mes - 1], valor: await total_gasto_do_mes(ano, mes) });
    }

    return pontos;
}

async function gerar_serie_personalizada(data_inicio, data_fim){
    const inicio = { ano: data_inicio.getFullYear(), mes: data_inicio.getMonth() + 1 };
    const fim = { ano: data_fim.getFullYear(), mes: data_fim.getMonth() + 1 };
    const meses = gerar_intervalo_meses(inicio, fim);
    const pontos = [];

    for(const { ano, mes } of meses){
        pontos.push({ rotulo: `${String(mes).padStart(2, '0')}/${ano}`, valor: await total_gasto_do_mes(ano, mes) });
    }

    return pontos;
}

const NS_SVG = 'http://www.w3.org/2000/svg';
const LARGURA_VIEWBOX = 1000;
const ALTURA_VIEWBOX = 300;
const MARGEM = { topo: 30, base: 30, esquerda: 15, direita: 15 };

function mostrar_tooltip(evento, coordenada){
    const container_rect = grafico_gastos.parentElement.getBoundingClientRect();
    tooltip_grafico.textContent = `${coordenada.rotulo}: ${formatador_moeda.format(coordenada.valor)}`;
    tooltip_grafico.style.left = `${evento.clientX - container_rect.left}px`;
    tooltip_grafico.style.top = `${evento.clientY - container_rect.top}px`;
    tooltip_grafico.hidden = false;
}

function esconder_tooltip(){
    tooltip_grafico.hidden = true;
}

function desenhar_grafico(pontos){
    grafico_gastos.innerHTML = '';
    grafico_gastos.setAttribute('viewBox', `0 0 ${LARGURA_VIEWBOX} ${ALTURA_VIEWBOX}`);

    if(pontos.length === 0){
        return;
    }

    const valor_maximo = Math.max(...pontos.map((ponto) => ponto.valor)) * 1.15 || 1;
    const largura_util = LARGURA_VIEWBOX - MARGEM.esquerda - MARGEM.direita;
    const altura_util = ALTURA_VIEWBOX - MARGEM.topo - MARGEM.base;
    const linha_base = ALTURA_VIEWBOX - MARGEM.base;

    const posicao_x = (indice) => MARGEM.esquerda + (pontos.length === 1 ? largura_util / 2 : (indice / (pontos.length - 1)) * largura_util);
    const posicao_y = (valor) => MARGEM.topo + altura_util - (valor / valor_maximo) * altura_util;

    const defs = document.createElementNS(NS_SVG, 'defs');
    const gradiente = document.createElementNS(NS_SVG, 'linearGradient');
    gradiente.setAttribute('id', 'gradiente_area_grafico');
    gradiente.setAttribute('x1', '0');
    gradiente.setAttribute('y1', '0');
    gradiente.setAttribute('x2', '0');
    gradiente.setAttribute('y2', '1');

    const parada_topo = document.createElementNS(NS_SVG, 'stop');
    parada_topo.setAttribute('offset', '0%');
    parada_topo.setAttribute('stop-color', '#5CD256');
    parada_topo.setAttribute('stop-opacity', '0.35');

    const parada_base = document.createElementNS(NS_SVG, 'stop');
    parada_base.setAttribute('offset', '100%');
    parada_base.setAttribute('stop-color', '#5CD256');
    parada_base.setAttribute('stop-opacity', '0');

    gradiente.appendChild(parada_topo);
    gradiente.appendChild(parada_base);
    defs.appendChild(gradiente);
    grafico_gastos.appendChild(defs);

    const eixo = document.createElementNS(NS_SVG, 'line');
    eixo.setAttribute('x1', MARGEM.esquerda);
    eixo.setAttribute('y1', linha_base);
    eixo.setAttribute('x2', LARGURA_VIEWBOX - MARGEM.direita);
    eixo.setAttribute('y2', linha_base);
    eixo.setAttribute('stroke', '#2a2a2a');
    eixo.setAttribute('stroke-width', '1');
    grafico_gastos.appendChild(eixo);

    const coordenadas = pontos.map((ponto, indice) => ({
        ...ponto,
        x: posicao_x(indice),
        y: posicao_y(ponto.valor)
    }));

    const pontos_area = [
        `${coordenadas[0].x},${linha_base}`,
        ...coordenadas.map((coordenada) => `${coordenada.x},${coordenada.y}`),
        `${coordenadas[coordenadas.length - 1].x},${linha_base}`
    ].join(' ');

    const area = document.createElementNS(NS_SVG, 'polygon');
    area.setAttribute('points', pontos_area);
    area.setAttribute('fill', 'url(#gradiente_area_grafico)');
    grafico_gastos.appendChild(area);

    const linha = document.createElementNS(NS_SVG, 'polyline');
    linha.setAttribute('points', coordenadas.map((coordenada) => `${coordenada.x},${coordenada.y}`).join(' '));
    linha.setAttribute('fill', 'none');
    linha.setAttribute('stroke', '#5CD256');
    linha.setAttribute('stroke-width', '2');
    linha.setAttribute('stroke-linecap', 'round');
    linha.setAttribute('stroke-linejoin', 'round');
    grafico_gastos.appendChild(linha);

    const limite_rotulo = valor_maximo * 0.55;
    const salto_rotulo_eixo = pontos.length <= 12 ? 1 : Math.ceil(pontos.length / 12);

    coordenadas.forEach((coordenada, indice) => {
        const anterior = coordenadas[indice - 1];
        const proximo = coordenadas[indice + 1];
        const eh_pico = coordenada.valor >= limite_rotulo
            && (!anterior || coordenada.valor >= anterior.valor)
            && (!proximo || coordenada.valor >= proximo.valor);

        if(eh_pico){
            const rotulo_pico = document.createElementNS(NS_SVG, 'text');
            rotulo_pico.setAttribute('x', coordenada.x);
            rotulo_pico.setAttribute('y', coordenada.y - 10);
            rotulo_pico.setAttribute('text-anchor', 'middle');
            rotulo_pico.setAttribute('font-size', '11');
            rotulo_pico.setAttribute('fill', '#ffffff');
            rotulo_pico.textContent = formatador_moeda.format(coordenada.valor);
            grafico_gastos.appendChild(rotulo_pico);
        }

        const marcador = document.createElementNS(NS_SVG, 'circle');
        marcador.setAttribute('cx', coordenada.x);
        marcador.setAttribute('cy', coordenada.y);
        marcador.setAttribute('r', eh_pico ? 4 : 2.5);
        marcador.setAttribute('fill', '#5CD256');
        grafico_gastos.appendChild(marcador);

        const alvo = document.createElementNS(NS_SVG, 'circle');
        alvo.setAttribute('cx', coordenada.x);
        alvo.setAttribute('cy', coordenada.y);
        alvo.setAttribute('r', 10);
        alvo.setAttribute('fill', 'transparent');
        alvo.style.cursor = 'pointer';
        alvo.addEventListener('mouseenter', (evento) => mostrar_tooltip(evento, coordenada));
        alvo.addEventListener('mousemove', (evento) => mostrar_tooltip(evento, coordenada));
        alvo.addEventListener('mouseleave', esconder_tooltip);
        grafico_gastos.appendChild(alvo);

        if(indice % salto_rotulo_eixo === 0){
            const rotulo_eixo = document.createElementNS(NS_SVG, 'text');
            rotulo_eixo.setAttribute('x', coordenada.x);
            rotulo_eixo.setAttribute('y', ALTURA_VIEWBOX - 10);
            rotulo_eixo.setAttribute('text-anchor', 'middle');
            rotulo_eixo.setAttribute('font-size', '10');
            rotulo_eixo.setAttribute('fill', 'darkgrey');
            rotulo_eixo.textContent = coordenada.rotulo;
            grafico_gastos.appendChild(rotulo_eixo);
        }
    });
}

async function atualizar_grafico(){
    const tipo = select_tipo_filtro.value;
    let pontos = [];

    if(tipo === 'anual' && filtro_ano.value){
        pontos = await gerar_serie_anual(Number(filtro_ano.value));
    }

    else if(tipo === 'personalizado' && filtro_data_inicio.value && filtro_data_fim.value){
        pontos = await gerar_serie_personalizada(new Date(`${filtro_data_inicio.value}T00:00:00`), new Date(`${filtro_data_fim.value}T00:00:00`));
    }

    desenhar_grafico(pontos);
}

function inicializar_filtro_grafico(){
    const hoje = new Date();

    preencher_select_anos(filtro_ano, 10);
    filtro_ano.value = String(hoje.getFullYear());

    filtro_data_inicio.max = formatar_data_iso(hoje);
    filtro_data_fim.max = formatar_data_iso(hoje);

    select_tipo_filtro.addEventListener('change', () => {
        filtro_ano.hidden = select_tipo_filtro.value !== 'anual';
        filtro_data_inicio.hidden = select_tipo_filtro.value !== 'personalizado';
        filtro_data_fim.hidden = select_tipo_filtro.value !== 'personalizado';
        atualizar_grafico();
    });

    filtro_ano.addEventListener('change', atualizar_grafico);

    filtro_data_inicio.addEventListener('change', () => {
        if(validar_data_nao_futura(filtro_data_inicio)){
            atualizar_grafico();
        }
    });

    filtro_data_fim.addEventListener('change', () => {
        if(validar_data_nao_futura(filtro_data_fim)){
            atualizar_grafico();
        }
    });
}

// ---------- Exportar em PDF ----------

function resetar_modal_exportar(){
    pergunta_exportar.hidden = false;
    opcoes_exportar.hidden = false;
    selecao_um_mes.hidden = true;
    selecao_varios_meses.hidden = true;
}

function abrir_modal_exportar(){
    resetar_modal_exportar();
    preencher_select_meses(exportar_mes_unico, 36);
    preencher_select_meses(exportar_mes_inicio, 36);
    preencher_select_meses(exportar_mes_fim, 36);
    fundo_modal_exportar.hidden = false;
}

function fechar_modal_exportar(){
    fundo_modal_exportar.hidden = true;
}

botao_exportar_pdf.addEventListener('click', abrir_modal_exportar);
botao_fechar_modal_exportar.addEventListener('click', fechar_modal_exportar);

fundo_modal_exportar.addEventListener('click', (evento) => {
    if(evento.target === fundo_modal_exportar){
        fechar_modal_exportar();
    }
});

botao_exportar_um_mes.addEventListener('click', () => {
    pergunta_exportar.hidden = true;
    opcoes_exportar.hidden = true;
    selecao_um_mes.hidden = false;
});

botao_exportar_varios_meses.addEventListener('click', () => {
    pergunta_exportar.hidden = true;
    opcoes_exportar.hidden = true;
    selecao_varios_meses.hidden = false;
});

function comparar_ano_mes(a, b){
    return (a.ano - b.ano) || (a.mes - b.mes);
}

function proximo_mes({ ano, mes }){
    return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}

function gerar_intervalo_meses(inicio, fim){
    let de = inicio;
    let ate = fim;

    if(comparar_ano_mes(de, ate) > 0){
        [de, ate] = [ate, de];
    }

    const meses = [];
    let atual = de;

    while(comparar_ano_mes(atual, ate) <= 0){
        meses.push(atual);
        atual = proximo_mes(atual);
    }

    return meses;
}

async function escrever_mes_no_pdf(doc, ano, mes, y_inicial){
    let y = y_inicial;

    const verificar_quebra_de_pagina = (proxima_altura) => {
        if(y + proxima_altura > 280){
            doc.addPage();
            y = 20;
        }
    };

    const escrever_linha = (texto) => {
        verificar_quebra_de_pagina(6);
        doc.text(texto, 16, y);
        y += 6;
    };

    const escrever_itens = (titulo, itens) => {
        verificar_quebra_de_pagina(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(titulo, 14, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        if(itens.length === 0){
            escrever_linha('Nenhum lançamento cadastrado.');
        }

        itens.forEach((item) => {
            verificar_quebra_de_pagina(6);
            const nome_exibido = item.parcela_atual && item.parcela_total
                ? `${item.nome} (parcela ${item.parcela_atual} de ${item.parcela_total})`
                : item.nome;
            doc.text(nome_exibido, 16, y);
            doc.text(formatador_moeda.format(item.valor), 196, y, { align: 'right' });
            y += 6;
        });

        y += 2;
    };

    const lancamentos = await carregar_lancamentos(usuario.id, ano, mes);
    const dados = agrupar_lancamentos(lancamentos);
    const resumo = calcular_resumo_financeiro(dados, modelo_ativo_atual);

    verificar_quebra_de_pagina(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const rotulo_mes = formatar_mes_ano(ano, mes);
    doc.text(rotulo_mes.charAt(0).toUpperCase() + rotulo_mes.slice(1), 14, y);
    y += 10;

    escrever_itens('Origens de Renda', dados.rendas);
    escrever_linha(`Total de renda: ${formatador_moeda.format(resumo.total_renda)}`);
    y += 3;

    escrever_itens('Gastos Necessários', dados.necessarios);
    escrever_linha(`Pode gastar: ${formatador_moeda.format(resumo.limite_necessarios_valor)}`);
    escrever_linha(`Gastou: ${formatador_moeda.format(resumo.total_necessarios)}`);
    escrever_linha(`Sobrou: ${formatador_moeda.format(resumo.sobra_necessarios)}`);
    y += 3;

    escrever_itens('Gastos com Desejos', dados.desejos);
    escrever_linha(`Pode gastar: ${formatador_moeda.format(resumo.limite_desejos_valor)}`);
    escrever_linha(`Gastou: ${formatador_moeda.format(resumo.total_desejos)}`);
    escrever_linha(`Sobrou: ${formatador_moeda.format(resumo.sobra_desejos)}`);
    y += 3;

    escrever_itens('Investimentos', dados.investimentos);
    escrever_linha(`Meta do mês: ${formatador_moeda.format(resumo.limite_investimentos_valor)}`);
    escrever_linha(`Guardado: ${formatador_moeda.format(resumo.total_investido)}`);
    escrever_linha(`Falta guardar: ${formatador_moeda.format(resumo.falta_guardar)}`);
    y += 3;

    verificar_quebra_de_pagina(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    escrever_linha(`Total gasto no mês: ${formatador_moeda.format(resumo.total_gasto)}`);
    escrever_linha(`Total que sobrou ao fim do mês: ${formatador_moeda.format(resumo.total_sobrou)}`);

    return y;
}

function criar_documento_pdf(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Meu Planejamento Financeiro', 14, 18);

    return doc;
}

async function gerar_pdf_um_mes(ano, mes){
    if(!window.jspdf){
        alert('Não foi possível carregar a biblioteca de geração de PDF. Verifique sua conexão com a internet.');
        return;
    }

    const doc = criar_documento_pdf();
    await escrever_mes_no_pdf(doc, ano, mes, 30);
    doc.save(`planejamento-${ano}-${String(mes).padStart(2, '0')}.pdf`);
}

async function gerar_pdf_varios_meses(inicio, fim){
    if(!window.jspdf){
        alert('Não foi possível carregar a biblioteca de geração de PDF. Verifique sua conexão com a internet.');
        return;
    }

    const doc = criar_documento_pdf();
    const meses = gerar_intervalo_meses(inicio, fim);
    let y = 30;

    for(let indice = 0; indice < meses.length; indice++){
        if(indice > 0){
            doc.addPage();
            y = 20;
        }

        y = await escrever_mes_no_pdf(doc, meses[indice].ano, meses[indice].mes, y);
    }

    const primeiro = meses[0];
    const ultimo = meses[meses.length - 1];
    doc.save(`planejamento-${primeiro.ano}-${String(primeiro.mes).padStart(2, '0')}_a_${ultimo.ano}-${String(ultimo.mes).padStart(2, '0')}.pdf`);
}

botao_confirmar_exportar_um_mes.addEventListener('click', async () => {
    const [ano, mes] = exportar_mes_unico.value.split('-').map(Number);
    fechar_modal_exportar();
    await gerar_pdf_um_mes(ano, mes);
});

botao_confirmar_exportar_varios_meses.addEventListener('click', async () => {
    const [ano_inicio, mes_inicio] = exportar_mes_inicio.value.split('-').map(Number);
    const [ano_fim, mes_fim] = exportar_mes_fim.value.split('-').map(Number);
    fechar_modal_exportar();
    await gerar_pdf_varios_meses({ ano: ano_inicio, mes: mes_inicio }, { ano: ano_fim, mes: mes_fim });
});

// ---------- Inicialização ----------

async function inicializar_dashboard(){
    inicializar_filtro_grafico();
    await atualizar_grafico();

    if(!usuario){
        return;
    }

    try{
        await carregar_modelos(usuario.id);

        const modelo_ativo = await carregar_modelo_ativo(usuario.id);

        if(modelo_ativo){
            modelo_ativo_atual = modelo_ativo;
            select_modelo.value = modelo_ativo.id;
        }

        else if(select_modelo.options.length > 0){
            const primeira_opcao = select_modelo.options[0];
            modelo_ativo_atual = {
                nome: primeira_opcao.dataset.nome,
                porcent_necessidades: Number(primeira_opcao.dataset.necessidades),
                porcent_desejos: Number(primeira_opcao.dataset.desejos),
                porcent_investimentos: Number(primeira_opcao.dataset.investimentos)
            };
        }

        await carregar_e_atualizar_tudo();
    }

    catch(erro){
        console.error('Erro ao carregar o painel financeiro:', erro);
    }
}

inicializar_dashboard();
