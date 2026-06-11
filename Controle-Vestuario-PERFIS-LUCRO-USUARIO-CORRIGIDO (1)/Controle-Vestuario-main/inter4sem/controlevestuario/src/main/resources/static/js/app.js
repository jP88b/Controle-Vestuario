

// ========================================================
// HELPERS DE COMPATIBILIDADE
// Mantidos para evitar erro caso alguma rotina antiga chame refreshAll().
// ========================================================
if (typeof window.$ !== 'function') {
    window.$ = function(id) { return document.getElementById(id); };
}
if (typeof window.esc !== 'function') {
    window.esc = function(value) {
        return String(value ?? '').replace(/[&<>"]/g, function(ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch];
        });
    };
}
if (typeof window.empty !== 'function') {
    window.empty = function(message) { return `<div class="p-4 text-sm text-slate-500">${window.esc(message)}</div>`; };
}
if (typeof window.toast !== 'function') {
    window.toast = function(titulo, mensagem) { console.log(titulo, mensagem); };
}
if (typeof window.refreshDashboardFromViews !== 'function') {
    window.refreshDashboardFromViews = async function() { return refreshDashboard(); };
}
if (typeof window.loadAllData !== 'function') {
    window.loadAllData = async function() { return true; };
}
if (typeof window.renderProducts !== 'function') {
    window.renderProducts = function() { return carregarTelaProdutos(); };
}
if (typeof window.renderCategories !== 'function') {
    window.renderCategories = function() { return carregarTelaCategorias(); };
}
if (typeof window.renderSuppliers !== 'function') {
    window.renderSuppliers = function() { return renderizarTabelaFornecedores(); };
}

const CATEGORIA_API_URL    = 'http://localhost:8080/categoria';
const FORNECEDOR_API_URL   = 'http://localhost:8080/fornecedor';
const ITEM_VENDA_API_URL   = 'http://localhost:8080/item-venda';
const MOVIMENTACAO_API_URL = 'http://localhost:8080/movimentacao';
const PRODUTO_API_URL      = 'http://localhost:8080/Produto';
const USUARIO_API_URL      = 'http://localhost:8080/Usuario';
const VENDA_API_URL        = 'http://localhost:8080/Venda/realizar';
const DASHBOARD_API_URL    = 'http://localhost:8080/dashboard';
const HISTORICO_API_URL    = 'http://localhost:8080/historico';
const RELATORIOS_API_URL   = 'http://localhost:8080/relatorios';
const LANCAMENTO_API_URL   = 'http://localhost:8080/movimentacao/lancar';


// ========================================================
// USUÁRIO LOGADO / PERFIS DE ACESSO
// Perfis usados no trabalho:
// FUNCIONARIO: lançamento somente de entrada; não edita/remove produto; não vê histórico.
// GERENTE: lançamento de entrada e saída; cadastra/edita produto; não remove; não vê histórico.
// ADMINISTRADOR: acesso completo.
// ========================================================
function usuarioLogadoAtual() {
    try {
        const bruto = sessionStorage.getItem('usuarioLogado');
        return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
        return null;
    }
}

function nomeUsuarioSistema() {
    const u = usuarioLogadoAtual();
    return u?.nome || u?.email || 'Sistema';
}

function perfilUsuarioAtual() {
    const u = usuarioLogadoAtual();
    const perfil = String(u?.perfil || 'FUNCIONARIO').toUpperCase();
    return perfil === 'FUNCIONÁRIO' ? 'FUNCIONARIO' : perfil;
}

function ehFuncionario() { return perfilUsuarioAtual() === 'FUNCIONARIO'; }
function ehGerente() { return perfilUsuarioAtual() === 'GERENTE'; }
function ehAdministrador() { return perfilUsuarioAtual() === 'ADMINISTRADOR'; }
function podeVerHistorico() { return ehAdministrador(); }
function podeCadastrarProduto() { return ehGerente() || ehAdministrador(); }
function podeEditarProduto() { return ehGerente() || ehAdministrador(); }
function podeRemoverProduto() { return ehAdministrador(); }
function podeLancarSaida() { return ehGerente() || ehAdministrador(); }

// Envia usuário/perfil em todas as chamadas fetch feitas pelo sistema.
// Isso permite que o Java/SQL gravem o usuário do sistema nos logs, e não o usuário técnico do banco.
const fetchNativoControleVestuario = window.fetch.bind(window);
window.fetch = function(resource, options = {}) {
    const headers = new Headers(options.headers || {});
    const usuario = usuarioLogadoAtual();
    if (usuario) {
        headers.set('X-Usuario-Sistema', nomeUsuarioSistema());
        headers.set('X-Perfil-Usuario', perfilUsuarioAtual());
    }
    return fetchNativoControleVestuario(resource, { ...options, headers });
};

function aplicarPermissoesUsuario() {
    const perfil = perfilUsuarioAtual();

    const btnAddProduto = document.getElementById('add-product-btn');
    if (btnAddProduto) btnAddProduto.classList.toggle('hidden', !podeCadastrarProduto());

    const linkHistorico = document.querySelector('[data-page="movements"]');
    if (linkHistorico) linkHistorico.classList.toggle('hidden', !podeVerHistorico());

    const activityFeed = document.getElementById('activity-feed');
    if (activityFeed && activityFeed.parentElement) {
        activityFeed.parentElement.classList.toggle('hidden', !podeVerHistorico());
    }

    const saidaRadio = document.querySelector('input[name="movementType"][value="SAIDA"]');
    if (saidaRadio) {
        const labelSaida = saidaRadio.closest('label');
        if (labelSaida) labelSaida.classList.toggle('hidden', !podeLancarSaida());
        if (!podeLancarSaida()) {
            const entradaRadio = document.querySelector('input[name="movementType"][value="ENTRADA"]');
            if (entradaRadio) entradaRadio.checked = true;
        }
    }

    const usuario = usuarioLogadoAtual();
    console.log(`Perfil aplicado: ${perfil}`, usuario?.nome || usuario?.email || '');
}

// === GET: Listar Todos ===
async function listarCategorias() {
    try {
        const response = await fetch(CATEGORIA_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar categorias: ${response.status}`);
        }
        
        const categorias = await response.json();
        return categorias; // Retorna a lista de CategoriaEntity
    } catch (error) {
        console.error("Erro no GET:", error);
    }
}

// === POST: Incluir ===
async function incluirCategoria(novaCategoria) {
    try {
        const response = await fetch(CATEGORIA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaCategoria) // Passa o objeto CategoriaEntity
        });

        if (response.status === 201) {
            const categoriaCriada = await response.json();
            return categoriaCriada;
        } else {
            throw new Error('Falha ao criar categoria (Bad Request)');
        }
    } catch (error) {
        console.error("Erro no POST:", error);
    }
}

// === PUT: Editar ===
async function editarCategoria(id, categoriaAtualizada) {
    try {
        const response = await fetch(`${CATEGORIA_API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoriaAtualizada)
        });

        if (response.status === 200) {
            const categoriaEditada = await response.json();
            return categoriaEditada;
        } else if (response.status === 404) {
            throw new Error('Categoria não encontrada');
        } else {
            throw new Error('Erro ao atualizar categoria');
        }
    } catch (error) {
        console.error("Erro no PUT:", error);
    }
}

// === DELETE: Excluir ===
async function excluirCategoria(id) {
    try {
        const response = await fetch(`${CATEGORIA_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            console.log('Categoria excluída com sucesso.');
            return true;
        } else {
            throw new Error('Erro ao excluir categoria');
        }
    } catch (error) {
        console.error("Erro no DELETE:", error);
        return false;
    }
}

// ========================================================
// CONTROLE DE CATEGORIAS (ALINHADO COM SEU HTML)
// ========================================================

// Seleção dos elementos do seu HTML
const btnNovaCategoria = document.getElementById("add-category-btn");
const modalCategoria = document.getElementById("category-modal");
const formCategoria = document.getElementById("category-form");
const inputNomeCategoria = document.getElementById("categoryNameInput");
const inputIdCategoria = document.getElementById("categoryIdInput");

// 1. Função para carregar e renderizar as categorias na tabela
async function carregarTelaCategorias() {
    const tabelaBody = document.getElementById("categories-table-body");
    if (!tabelaBody) return;

    tabelaBody.innerHTML = "";
    const categorias = await listarCategorias();

    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        categorias.forEach(cat => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-600 dark:text-slate-300";
            
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">${cat.nome || '-'}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center gap-3">
                        <button class="text-primary-600 hover:text-primary-700 font-medium hover:underline" onclick="prepararEdicaoCategoria(${cat.id}, '${cat.nome}')">Editar</button>
                        <button class="text-red-500 hover:text-red-600 font-medium hover:underline" onclick="removerCategoriaFluxo(${cat.id})">Excluir</button>
                    </div>
                </td>
            `;
            tabelaBody.appendChild(tr);
        });
    } else {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="2" class="p-8 text-center text-slate-400 dark:text-slate-500">Nenhuma categoria encontrada no sistema.</td>
            </tr>
        `;
    }
}

// 2. Evento para abrir o modal clicando em "Nova"
if (btnNovaCategoria && modalCategoria) {
    btnNovaCategoria.addEventListener("click", () => {
        if (formCategoria) formCategoria.reset();
        if (inputIdCategoria) inputIdCategoria.value = ""; 
        
        const tituloModal = modalCategoria.querySelector("h2");
        if (tituloModal) tituloModal.textContent = "Nova Categoria";

        modalCategoria.classList.remove("hidden");
        modalCategoria.classList.add("flex"); // Garante que o flex do Tailwind centralize o modal
    });
}

// 3. Fechar o modal (Botão Cancelar)
if (modalCategoria) {
    const btnCancelar = modalCategoria.querySelector(".close-modal");
    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            modalCategoria.classList.add("hidden");
            modalCategoria.classList.remove("flex");
        });
    }
}

// 4. Enviar o formulário (Salvar / Editar no Spring Boot)
if (formCategoria) {
    formCategoria.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = inputIdCategoria?.value;
        const dadosCategoria = {
            nome: inputNomeCategoria.value.trim()
        };

        let resultado = null;

        if (id) {
            // Se tem ID salvos no input oculto, faz o PUT
            resultado = await editarCategoria(id, dadosCategoria);
        } else {
            // Se não tem ID, faz o POST
            resultado = await incluirCategoria(dadosCategoria);
        }

        if (resultado) {
            modalCategoria.classList.add("hidden");
            modalCategoria.classList.remove("flex");
            formCategoria.reset();
            
            // Atualiza a listagem automaticamente
            setTimeout(() => {
                carregarTelaCategorias();
            }, 300);
        } else {
            alert("Erro ao salvar categoria. Verifique se o servidor está ativo.");
        }
    });
}

// 5. Funções globais de ação na tabela (Editar e Excluir)
window.prepararEdicaoCategoria = function(id, nome) {
    if (inputIdCategoria) inputIdCategoria.value = id;
    if (inputNomeCategoria) inputNomeCategoria.value = nome;
    
    if (modalCategoria) {
        const tituloModal = modalCategoria.querySelector("h2");
        if (tituloModal) tituloModal.textContent = "Editar Categoria";
        
        modalCategoria.classList.remove("hidden");
        modalCategoria.classList.add("flex");
    }
};

window.removerCategoriaFluxo = async function(id) {
    if (confirm("Deseja realmente excluir esta categoria?")) {
        const sucesso = await excluirCategoria(id);
        if (sucesso) {
            carregarTelaCategorias();
        } else {
            alert("Erro ao excluir. Certifique-se de que não há produtos usando esta categoria.");
        }
    }
};



// ========================================================
// CONTROLE DO MODAL, SUBMIT E LISTAGEM (TOTALMENTE INTEGRADO)
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    const modalFornecedor = document.getElementById("supplier-modal");
    const formFornecedor = document.getElementById("supplier-form");

    // 1. Localiza o botão "Novo" de forma dinâmica e segura
    const todosOsBotoes = document.querySelectorAll("button");
    let btnNovoFornecedor = null;

    for (let botao of todosOsBotoes) {
        if (botao.textContent.trim() === "Novo") {
            btnNovoFornecedor = botao;
            break;
        }
    }

    // 2. Evento para ABRIR o Modal ao clicar em "Novo"
    if (btnNovoFornecedor && modalFornecedor) {
        btnNovoFornecedor.addEventListener("click", () => {
            if (formFornecedor) formFornecedor.reset();
            
            // Garante que o ID oculto está vazio (indica um fluxo de POST)
            const inputId = document.getElementById("supplierId");
            if (inputId) inputId.value = ""; 

            // Define o título do Modal como Novo Cadastro
            const tituloModal = modalFornecedor.querySelector("h2");
            if (tituloModal) tituloModal.textContent = "Novo Fornecedor";

            modalFornecedor.classList.remove("hidden");
        });
    }

    // 3. Evento para FECHAR o Modal (Botões Cancelar e "X")
    const botoesFechar = document.querySelectorAll(".close-modal");
    botoesFechar.forEach(botao => {
        botao.addEventListener("click", () => {
            if (modalFornecedor) modalFornecedor.classList.add("hidden");
        });
    });

    // 4. Fechar o modal ao clicar fora da área central (no fundo escuro)
    if (modalFornecedor) {
        modalFornecedor.addEventListener("click", (e) => {
            if (e.target === modalFornecedor) {
                modalFornecedor.classList.add("hidden");
            }
        });
    }

    // 5. Envio do Formulário Trado e Monitorado
    if (formFornecedor) {
        console.log("Formulário de fornecedores encontrado com sucesso no DOM!");

        formFornecedor.addEventListener("submit", async (e) => {
            // Impede a página de recarregar
            e.preventDefault(); 
            console.log("Botão Salvar clicado! Evento de Submit disparado.");

            const idFornecedor = document.getElementById("supplierId").value;

            // Captura os dados dos inputs de texto de forma segura
            const dadosFornecedor = {
                nome: document.getElementById("supplierName").value.trim(),
                cnpj: document.getElementById("supplierCnpj").value.replace(/\D/g, '') || null, 
                telefone: document.getElementById("supplierPhone").value.trim() || null,
                email: document.getElementById("supplierEmail").value.trim() || null
            };

            console.log("Dados que serão enviados para o Spring Boot:", dadosFornecedor);

            try {
                let resultado;
                if (idFornecedor) {
                    console.log(`Modo Edição ativado para o ID: ${idFornecedor}. Chamando PUT...`);
                    resultado = await editarFornecedor(idFornecedor, dadosFornecedor);
                } else {
                    console.log("Modo Cadastro ativado. Chamando POST...");
                    resultado = await incluirFornecedor(dadosFornecedor);
                }

                // O Spring Boot retornando os dados significa sucesso absoluto!
                if (resultado) {
                    console.log("Resposta positiva recebida da API:", resultado);
                    alert("Fornecedor salvo com sucesso!");
                    
                    // Esconde o modal e limpa a tela
                    modalFornecedor.classList.add("hidden");
                    formFornecedor.reset();
                    
                    // Recarrega a tabela de dados
                    await renderizarTabelaFornecedores();
                } else {
                    console.warn("A API processou a requisição, mas o retorno veio vazio ou inválido.");
                }
            } catch (error) {
                console.error("Erro crítico na comunicação com a API:", error);
                alert("Erro ao conectar com o servidor. Abra o console do navegador (F12) para ver os detalhes.");
            }
        });
    } else {
        console.error("ERRO CRÍTICO: O JavaScript não conseguiu encontrar o elemento com id='supplier-form' na página!");
    }

    // Inicializa a tabela buscando os dados assim que o sistema abre
    renderizarTabelaFornecedores();
});

// ========================================================
// ATUALIZAÇÃO DA TABELA EM TELA
// ========================================================
// ========================================================
// ATUALIZAÇÃO DA TABELA EM TELA (CORRIGIDA PARA O SEU HTML)
// ========================================================
async function renderizarTabelaFornecedores() {
    const tabelaBody = document.getElementById("suppliers-table-body");
    
    if (!tabelaBody) {
        console.error("ERRO VISUAL: Não foi encontrado o elemento id='suppliers-table-body' na página.");
        return;
    }

    const fornecedores = await listarFornecedores();
    tabelaBody.innerHTML = "";

    if (fornecedores && Array.isArray(fornecedores) && fornecedores.length > 0) {
        fornecedores.forEach(forn => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-600 dark:text-slate-300";
            
            // Monta as 5 colunas exatas: Nome, CNPJ, Telefone, E-mail, Ações
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-800 dark:text-white">${forn.nome || '-'}</td>
                <td class="px-6 py-4">${forn.cnpj ? maskCNPJString(forn.cnpj) : '-'}</td>
                <td class="px-6 py-4">${forn.telefone || '-'}</td>
                <td class="px-6 py-4">${forn.email || '-'}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center gap-3">
                        <button class="text-cyan-600 hover:text-cyan-700 font-medium hover:underline" onclick="prepararEdicaoFornecedor(${forn.id})">Editar</button>
                        <button class="text-red-500 hover:text-red-600 font-medium hover:underline" onclick="removerFornecedorFluxo(${forn.id})">Excluir</button>
                    </div>
                </td>
            `;
            tabelaBody.appendChild(tr);
        });
    } else {
        // Colspan ajustado para 5 para ocupar toda a largura da nova tabela
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5" class="p-8 text-center text-slate-400 dark:text-slate-500">Nenhum fornecedor encontrado no sistema.</td>
            </tr>
        `;
    }
}

// Função utilitária para formatar o CNPJ que vem puro do banco de dados (ex: 12345678000199)
function maskCNPJString(cnpj) {
    if (!cnpj) return "-";
    let value = cnpj.replace(/\D/g, "");
    if (value.length === 14) {
        return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    }
    return value;
}

// ========================================================
// FLUXOS AUXILIARES: EXCLUSÃO E EDIÇÃO
// ========================================================
window.removerFornecedorFluxo = async (id) => {
    if (confirm("Deseja realmente remover este fornecedor do sistema?")) {
        const confirmacao = await excluirFornecedor(id);
        if (confirmacao) {
            alert("Fornecedor excluído!");
            renderizarTabelaFornecedores();
        }
    }
};

window.prepararEdicaoFornecedor = async (id) => {
    // Busca os dados atuais para preencher o formulário
    const fornecedores = await listarFornecedores();
    const forn = fornecedores.find(f => f.id === id);

    if (forn) {
        document.getElementById("supplierId").value = forn.id;
        document.getElementById("supplierName").value = forn.nome;
        document.getElementById("supplierCnpj").value = forn.cnpj || "";
        document.getElementById("supplierPhone").value = forn.telefone || "";
        document.getElementById("supplierEmail").value = forn.email || "";

        const modal = document.getElementById("supplier-modal");
        const tituloModal = modal.querySelector("h2");
        if (tituloModal) tituloModal.textContent = "Editar Fornecedor";

        // Aplica máscaras instantaneamente ao carregar os dados antigos
        maskCNPJ(document.getElementById("supplierCnpj"));
        maskPhone(document.getElementById("supplierPhone"));

        modal.classList.remove("hidden");
    }
};

// ========================================================
// MÁSCARAS VISUAIS DE INPUT (EVITA REFERENCERROR NO CONSOLE)
// ========================================================
function maskCNPJ(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 14) value = value.slice(0, 14);
    value = value.replace(/^(\d{2})(\d)/, "$1.$2");
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
    value = value.replace(/(\d{4})(\d)/, "$1-$2");
    input.value = value;
}

function maskPhone(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else {
        value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    }
    input.value = value;
}

// === GET: Listar Todos ===
async function listarFornecedores() {
    try {
        const response = await fetch(FORNECEDOR_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar fornecedores: ${response.status}`);
        }
        
        const fornecedores = await response.json();
        return fornecedores; // Retorna a lista de FornecedorEntity
    } catch (error) {
        console.error("Erro no GET:", error);
    }
}

// === POST: Incluir ===
async function incluirFornecedor(novoFornecedor) {
    try {
        const response = await fetch(FORNECEDOR_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoFornecedor) // Passa o objeto FornecedorEntity
        });

        if (response.status === 201) {
            const fornecedorCriado = await response.json();
            return fornecedorCriado;
        } else {
            throw new Error('Falha ao criar fornecedor (Bad Request)');
        }
    } catch (error) {
        console.error("Erro no POST:", error);
    }
}

// === PUT: Editar ===
async function editarFornecedor(id, fornecedorAtualizado) {
    try {
        const response = await fetch(`${FORNECEDOR_API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fornecedorAtualizado)
        });

        if (response.status === 200) {
            const fornecedorEditado = await response.json();
            return fornecedorEditado;
        } else if (response.status === 404) {
            throw new Error('Fornecedor não encontrado');
        } else {
            throw new Error('Erro ao atualizar fornecedor');
        }
    } catch (error) {
        console.error("Erro no PUT:", error);
    }
}

// === DELETE: Excluir ===
async function excluirFornecedor(id) {
    try {
        const response = await fetch(`${FORNECEDOR_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            console.log('Fornecedor excluído com sucesso.');
            return true;
        } else {
            throw new Error('Erro ao excluir fornecedor');
        }
    } catch (error) {
        console.error("Erro no DELETE:", error);
        return false;
    }
}



// === GET: Listar Todos ===
async function listarItensVenda() {
    try {
        const response = await fetch(ITEM_VENDA_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar itens de venda: ${response.status}`);
        }
        
        const itens = await response.json();
        return itens; // Retorna a lista de ItemVendaEntity
    } catch (error) {
        console.error("Erro no GET:", error);
    }
}

// === POST: Incluir ===
async function incluirItemVenda(novoItemVenda) {
    try {
        const response = await fetch(ITEM_VENDA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoItemVenda) // Passa o objeto ItemVendaEntity
        });

        if (response.status === 201) {
            const itemCriado = await response.json();
            return itemCriado;
        } else {
            throw new Error('Falha ao criar item de venda (Bad Request)');
        }
    } catch (error) {
        console.error("Erro no POST:", error);
    }
}

// === PUT: Editar ===
async function editarItemVenda(id, itemAtualizado) {
    try {
        const response = await fetch(`${ITEM_VENDA_API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemAtualizado)
        });

        if (response.status === 200) {
            const itemEditado = await response.json();
            return itemEditado;
        } else if (response.status === 404) {
            throw new Error('Item de venda não encontrado');
        } else {
            throw new Error('Erro ao atualizar item de venda');
        }
    } catch (error) {
        console.error("Erro no PUT:", error);
    }
}

// === DELETE: Excluir ===
async function excluirItemVenda(id) {
    try {
        const response = await fetch(`${ITEM_VENDA_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            console.log('Item de venda excluído com sucesso.');
            return true;
        } else {
            throw new Error('Erro ao excluir item de venda');
        }
    } catch (error) {
        console.error("Erro no DELETE:", error);
        return false;
    }
}



// === GET: Listar Todas ===
async function listarMovimentacoes() {
    try {
        const response = await fetch(MOVIMENTACAO_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar movimentações: ${response.status}`);
        }
        
        const movimentacoes = await response.json();
        return movimentacoes; // Retorna a lista de MovimentacaoEntity
    } catch (error) {
        console.error("Erro no GET:", error);
    }
}

// === POST: Incluir ===
async function incluirMovimentacao(novaMovimentacao) {
    try {
        const response = await fetch(MOVIMENTACAO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaMovimentacao) // Passa o objeto MovimentacaoEntity
        });

        if (response.status === 201) {
            const movimentacaoCriada = await response.json();
            return movimentacaoCriada;
        } else {
            throw new Error('Falha ao criar movimentação (Bad Request)');
        }
    } catch (error) {
        console.error("Erro no POST:", error);
    }
}

// === PUT: Editar ===
async function editarMovimentacao(id, movimentacaoAtualizada) {
    try {
        const response = await fetch(`${MOVIMENTACAO_API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movimentacaoAtualizada)
        });

        if (response.status === 200) {
            const movimentacaoEditada = await response.json();
            return movimentacaoEditada;
        } else if (response.status === 404) {
            throw new Error('Movimentação não encontrada');
        } else {
            throw new Error('Erro ao atualizar movimentação');
        }
    } catch (error) {
        console.error("Erro no PUT:", error);
    }
}

// === DELETE: Excluir ===
async function excluirMovimentacao(id) {
    try {
        const response = await fetch(`${MOVIMENTACAO_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            console.log('Movimentação excluída com sucesso.');
            return true;
        } else {
            throw new Error('Erro ao excluir movimentação');
        }
    } catch (error) {
        console.error("Erro no DELETE:", error);
        return false;
    }
}

// === CONFIGURAÇÃO DE ENDPOINTS (Sem conflitos de const) ===

const endpoints = {
  categories: 'categoria',
  suppliers: 'fornecedor',
  products: 'Produto',
  movements: 'Movimentacao',
  users: 'Usuario',
  sales: 'Venda',
  saleItems: 'item-venda',
  dashboard: 'dashboard',
  historico: 'historico'
};

async function refreshDashboard() {
    try {

        const response = await fetch(`${DASHBOARD_API_URL}/kpis`);
        const kpis = await response.json();

        const valorEstoque = numeroBI(pegarValorCampo(kpis, ['valor_total_estoque', 'valorTotalEstoque', 'VALOR_TOTAL_ESTOQUE'], 0));
        const custoEstoque = numeroBI(pegarValorCampo(kpis, ['custo_total_estoque', 'custoTotalEstoque', 'CUSTO_TOTAL_ESTOQUE'], 0));
        let lucroEstoque = numeroBI(pegarValorCampo(kpis, ['lucro_potencial_estoque', 'lucroPotencialEstoque', 'LUCRO_POTENCIAL_ESTOQUE'], 0));

        // Segurança: se a view antiga ainda não trouxe lucro, calcula pelo valor - custo.
        if (lucroEstoque === 0 && valorEstoque > 0 && custoEstoque > 0) {
            lucroEstoque = valorEstoque - custoEstoque;
        }

        const margem = valorEstoque > 0 ? (lucroEstoque / valorEstoque) * 100 : 0;

        document.getElementById('kpi-stock-value').textContent =
            `R$ ${valorEstoque.toFixed(2)}`;

        document.getElementById('kpi-profit').textContent =
            `R$ ${lucroEstoque.toFixed(2)}`;

        document.getElementById('kpi-margin').textContent =
            `${margem.toFixed(1)}%`;

        document.getElementById('kpi-total-items').textContent =
            pegarValorCampo(kpis, ['total_itens_estoque', 'totalItensEstoque', 'TOTAL_ITENS_ESTOQUE'], 0) || 0;

        document.getElementById('kpi-low-stock').textContent =
            pegarValorCampo(kpis, ['total_estoque_critico', 'totalEstoqueCritico', 'TOTAL_ESTOQUE_CRITICO'], 0) || 0;

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}



async function refreshAll() {
  try {
    await loadAllData();

    renderProducts();
    renderCategories();
    renderSuppliers();

    await refreshDashboardFromViews();
    await refreshHistorico();

  } catch (error) {
    console.error(error);
    toast('Erro ao atualizar sistema', error.message, 'error');
  }

  await refreshDashboardFromViews();
}

async function refreshHistorico() {
  if (!podeVerHistorico()) return;
  try {
    const response = await fetch(HISTORICO_API_URL);
    const historico = await response.json();

    renderAtividadeRecente(historico);
    renderTabelaHistorico(historico);

  } catch (error) {
    console.error(error);
    toast('Erro no histórico', error.message, 'error');
  }
}

function renderAtividadeRecente(historico) {
  const el = $('activityFeed');

  if (!el) return;

  if (!historico || historico.length === 0) {
    el.innerHTML = empty('Nenhuma atividade recente encontrada.');
    return;
  }

  el.innerHTML = historico.slice(0, 5).map(item => `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-start justify-between gap-3">
        <div>
          <strong>${esc(item.acao || '')} - ${esc(item.tabela || '')}</strong>
          <p class="text-sm text-slate-500">${esc(item.descricao || '')}</p>
        </div>
        <span class="text-xs text-slate-400">
          ${formatDateTime(item.dataEvento)}
        </span>
      </div>
    </div>
  `).join('');
}

function renderTabelaHistorico(historico) {
  const el = $('historyTable');

  if (!el) return;

  if (!historico || historico.length === 0) {
    el.innerHTML = `
      <tr>
        <td colspan="5" class="p-4 text-center text-slate-500">
          Nenhum histórico encontrado.
        </td>
      </tr>
    `;
    return;
  }

  el.innerHTML = historico.map(item => `
    <tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="p-3">${formatDateTime(item.dataEvento)}</td>
      <td class="p-3">${esc(item.tabela || '')}</td>
      <td class="p-3">${esc(item.acao || '')}</td>
      <td class="p-3">${esc(item.descricao || '')}</td>
      <td class="p-3">${esc(item.usuario || '')}</td>
    </tr>
  `).join('');
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('pt-BR');
}

async function carregarAtividadeRecente() {
    if (!podeVerHistorico()) return;

    try {

        const response = await fetch(HISTORICO_API_URL);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const atividades = await response.json();

        const feed = document.getElementById('activity-feed');

        if (!feed) return;

        feed.innerHTML = '';

        atividades.slice(0, 10).forEach(item => {

            feed.innerHTML += `
                <div class="border rounded-lg p-3">
                    <div class="font-semibold">
                        ${item.acao || ''}
                    </div>

                    <div class="text-sm text-slate-500">
                        ${item.descricao || ''}
                    </div>

                    <div class="text-xs text-slate-400 mt-1">
                        ${item.dataEvento
                            ? new Date(item.dataEvento).toLocaleString('pt-BR')
                            : ''}
                    </div>
                </div>
            `;
        });

    } catch (erro) {
        console.error('Erro ao carregar atividades:', erro);
    }
}

async function carregarEstoqueCritico() {

    try {

        const response = await fetch(`${DASHBOARD_API_URL}/criticos`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const produtos = await response.json();

        const tabela = document.getElementById('low-stock-table-body');

        if (!tabela) return;

        tabela.innerHTML = '';

        produtos.forEach(produto => {

            tabela.innerHTML += `
                <tr>
                    <td class="px-6 py-3">
                        ${produto.produto || ''}
                    </td>

                    <td class="px-6 py-3 text-center">
                        5
                    </td>

                    <td class="px-6 py-3 text-center">
                        ${produto.quantidade || 0}
                    </td>

                    <td class="px-6 py-3 text-center">
                        <span class="bg-red-100 text-red-600 px-2 py-1 rounded">
                            ${produto.status_estoque || 'Crítico'}
                        </span>
                    </td>
                </tr>
            `;
        });

    } catch (erro) {
        console.error('Erro ao carregar estoque crítico:', erro);
    }
}
// ==========================================
//          GERENCIAMENTO DE TELAS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
//          CONTROLE DO MODAL DE PRODUTOS
// ==========================================
const productModal = document.getElementById("product-modal");
const addProductBtn = document.getElementById("add-product-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelModalBtn = document.getElementById("cancel-modal-btn");
const productForm = document.getElementById("product-form");

// Abrir o modal ao clicar em "Novo Produto"
if (addProductBtn && productModal) {
    addProductBtn.addEventListener("click", async () => {
        productForm.reset(); 
        document.getElementById("product-id").value = ""; 
        document.getElementById("modal-title").innerText = "Cadastrar Novo Produto";
        
        // 🔥 CORREÇÃO 1: CARREGA AMBOS ANTES DO MODAL APARECER
        await atualizarSelectFornecedores();
        await atualizarSelectCategorias(); // Não pode esquecer este!

        productModal.classList.remove("hidden");
    });
}

// Fechar o modal
const fecharModal = () => {
    if (productModal) productModal.classList.add("hidden");
};

if (closeModalBtn) closeModalBtn.addEventListener("click", fecharModal);
if (cancelModalBtn) cancelModalBtn.addEventListener("click", fecharModal);

// Salvar / Enviar o Formulário
if (productForm) {
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!podeCadastrarProduto()) {
            alert("Seu perfil não tem permissão para cadastrar ou editar produtos.");
            return;
        }

        const id = document.getElementById("product-id").value;
        
        // Captura os inputs de texto/número de forma segura
        const qtyInput = document.getElementById("form-product-qty")?.value || "0";
        const priceInput = document.getElementById("form-product-price")?.value || "0";
        const costInput = document.getElementById("form-product-cost")?.value || "0";

        // 🔥 CORREÇÃO: Captura os elementos inteiros primeiro para evitar ler '.value' de null
        const selectCategoria = document.getElementById("productCategoryInput");
        const selectFornecedor = document.getElementById("form-product-supplier");

        // Extrai os valores apenas se os elementos existirem na árvore do HTML
        const idCategoria = selectCategoria ? selectCategoria.value : "";
        const idFornecedor = selectFornecedor ? selectFornecedor.value : "";

        // Converte o preço tratando possíveis vírgulas para ponto flutuante puro
        const precoLimpo = parseFloat(priceInput.replace(",", ".")) || 0.0;
        const custoLimpo = parseFloat(costInput.replace(",", ".")) || 0.0;

        // Montagem do objeto idêntico ao contrato aceito pelo seu Spring Boot
        const novoProduto = {
            nome: document.getElementById("form-product-name")?.value.trim() || "",
            quantidade: parseInt(qtyInput, 10) || 0,
            
            // Duplo mapeamento para garantir compatibilidade com sua Entity/DTO
            preco: precoLimpo,
            precoCusto: custoLimpo,
            custo: custoLimpo,
            precoVenda: precoLimpo,  
            
            // Relacionamentos estruturados como sub-objetos para chaves estrangeiras JPA
            categoria: idCategoria ? { id: parseInt(idCategoria, 10) } : null,
            fornecedor: idFornecedor ? { id: parseInt(idFornecedor, 10) } : null
        };

        // Validações de segurança antes do Envio
        if (!novoProduto.nome) {
            alert("Por favor, insira um nome para o produto.");
            return;
        }
        if (!novoProduto.categoria || !novoProduto.categoria.id) {
            alert("Por favor, selecione uma categoria para o produto.");
            return;
        }

        let sucesso = false;

        if (id) {
            const resultado = await editarProduto(id, novoProduto);
            if (resultado) sucesso = true;
        } else {
            const resultado = await incluirProduto(novoProduto);
            if (resultado) sucesso = true;
        }

        if (sucesso) {
            fecharModal();
            setTimeout(() => {
                carregarTelaProdutos();
            }, 300);
        } else {
            alert("O servidor rejeitou os dados (Erro 400). Verifique o console do Spring Boot para ver qual campo falhou.");
        }
    });
}
    const navLinks = document.querySelectorAll(".nav-link");
    const pages = document.querySelectorAll(".page-content");

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // Descobre qual página o link quer abrir pelo atributo data-page
            const targetPageId = link.getAttribute("data-page");
            const targetPage = document.getElementById(`${targetPageId}-content`);

            if (targetPage) {
                // Remove o estado ativo de todos os links e páginas
                navLinks.forEach(l => {
                    l.classList.remove("bg-primary-600", "text-white", "shadow-lg", "shadow-primary-900/20");
                    l.classList.add("hover:bg-slate-800", "hover:text-white");
                });
                pages.forEach(p => p.classList.remove("active"));

                // Ativa o link clicado
                link.classList.add("bg-primary-600", "text-white", "shadow-lg", "shadow-primary-900/20");
                link.classList.remove("hover:bg-slate-800", "hover:text-white");

                // Exibe a tela correspondente
                targetPage.classList.add("active");

                // Se clicou em produtos, renderiza a tabela buscando os dados do back
                if (targetPageId === "products") {
                    carregarTelaProdutos();
                } else if (targetPageId === "categories") {
                    // Carrega a lista ao abrir a aba. Antes ela só aparecia depois de cadastrar uma categoria nova.
                    carregarTelaCategorias();
                } else if (targetPageId === "suppliers") {
                    renderizarTabelaFornecedores();
                } else if (targetPageId === "dashboard") {
                    refreshDashboard();
                    carregarAtividadeRecente();
                    carregarEstoqueCritico();
                } else if (targetPageId === "analysis") {
                    carregarRelatoriosBI();
                } else if (targetPageId === "movements") {
                    carregarHistoricoSistema();
                }
            }
        });
    });
});

async function carregarHistoricoSistema() {
    if (!podeVerHistorico()) return;
    try {
        const response = await fetch(HISTORICO_API_URL);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const historico = await response.json();
        const tabela = document.getElementById('movements-table-body');

        if (!tabela) return;

        tabela.innerHTML = '';

        if (!historico || historico.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-slate-400">
                        Nenhum histórico encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        historico.forEach(item => {
            tabela.innerHTML += `
                <tr>
                    <td class="px-6 py-3">
                        ${item.dataEvento ? new Date(item.dataEvento).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td class="px-6 py-3">
                        ${item.tabela || '-'}
                    </td>
                    <td class="px-6 py-3">
                        ${item.acao || '-'}
                    </td>
                    <td class="px-6 py-3">
                        ${item.descricao || '-'}
                    </td>
                    <td class="px-6 py-3">
                        ${item.usuario || '-'}
                    </td>
                </tr>
            `;
        });

    } catch (erro) {
        console.error('Erro ao carregar histórico:', erro);
    }
}

// ==========================================
//       FUNÇÕES DE PRODUTO (Limpas)
// ==========================================

async function listarProdutos() {
    try {
        const response = await fetch(PRODUTO_API_URL);
        if (!response.ok) throw new Error(`Erro ao buscar produtos: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Erro no GET de Produtos:", error);
        return [];
    }
}

function prepararEdicao(produtoJsonEscapado) {
    if (!podeEditarProduto()) {
        alert("Seu perfil não tem permissão para editar produtos.");
        return;
    }
    try {
        // Converte a string de volta para um objeto JavaScript
        const produto = JSON.parse(produtoJsonEscapado.replace(/&quot;/g, '"'));

        // 1. Preenche os inputs ocultos e visíveis
        document.getElementById("product-id").value = produto.id;
        document.getElementById("form-product-name").value = produto.nome;
        document.getElementById("form-product-qty").value = produto.quantidade;
        document.getElementById("form-product-price").value = produto.precoVenda || 0;
        document.getElementById("form-product-cost").value = produto.precoCusto || 0;

        // 2. Garante que os selects de Categorias e Fornecedores estejam carregados
        // Nota: se essas funções forem assíncronas, o ideal é que já tenham rodado na página
        if (typeof atualizarSelectFornecedores === "function") atualizarSelectFornecedores();
        if (typeof atualizarSelectCategorias === "function") atualizarSelectCategorias();

        // 3. Seleciona o ID correto dentro dos <select> do HTML
        if (produto.categoria && produto.categoria.id) {
            const selectCat = document.getElementById("productCategoryInput");
            if (selectCat) selectCat.value = produto.categoria.id;
        }
        
        if (produto.fornecedor && produto.fornecedor.id) {
            const selectForn = document.getElementById("form-product-supplier");
            if (selectForn) selectForn.value = produto.fornecedor.id;
        }

        // 4. Muda o título do modal e exibe na tela
        document.getElementById("modal-title").innerText = `Editar Produto: ${produto.nome}`;
        
        const productModal = document.getElementById("product-modal");
        if (productModal) {
            productModal.classList.remove("hidden");
        }

    } catch (error) {
        console.error("Erro ao processar dados para edição:", error);
    }
}

// Expõe para o escopo global do HTML
window.prepararEdicao = prepararEdicao;

async function carregarTelaProdutos() {
    const tabelaBody = document.getElementById("products-table-body");
    if (!tabelaBody) return;

    // 🔥 IMPORTANTE: Alterado de colspan="6" para "7" para acompanhar a nova coluna
    tabelaBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-slate-500">Carregando produtos...</td></tr>`;

    const produtos = await listarProdutos();
    tabelaBody.innerHTML = ""; 

    if (!produtos || produtos.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-slate-500">Nenhum produto cadastrado.</td></tr>`;
        return;
    }

    produtos.forEach(prod => {
        // Formatações de exibição de valores monetários
        const precoVenda = prod.precoVenda ? `R$ ${prod.precoVenda.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
        
        // 🔥 NOVA FORMATAÇÃO: Alinhado com o campo vindo do banco do backend
        const precoCusto = prod.precoCusto ? `R$ ${prod.precoCusto.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
        
        const statusClass = prod.quantidade > 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        const statusTexto = prod.quantidade > 5 ? 'Em Estoque' : 'Baixo Estoque';

        const produtoJson = JSON.stringify(prod).replace(/"/g, '&quot;');

        // Injeta a linha com a nova célula correspondente ao Preço de Custo
        tabelaBody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${prod.nome || 'Sem nome'}</td>
                <td class="px-6 py-4">${prod.fornecedor?.nome || 'Não atribuído'}</td>
                <td class="px-6 py-4 text-center">${prod.quantidade || 0}</td>
                <td class="px-6 py-4 text-right text-slate-500 dark:text-slate-400">${precoCusto}</td>
                <td class="px-6 py-4 text-right font-medium">${precoVenda}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusTexto}</span>
                </td>
                <td class="px-6 py-4 text-center space-x-3">
                    ${podeEditarProduto() ? `<button onclick="prepararEdicao('${produtoJson}')" class="text-blue-600 hover:text-blue-900 font-medium dark:hover:text-blue-400">Editar</button>` : ''}
                    ${podeRemoverProduto() ? `<button onclick="deletarProdutoFluxo(${prod.id})" class="text-red-600 hover:text-red-900 font-medium">Excluir</button>` : ''}
                    ${(!podeEditarProduto() && !podeRemoverProduto()) ? '<span class="text-slate-400 text-xs">Sem ações</span>' : ''}
                </td>
            </tr>
        `;
    });
}

async function incluirProduto(novoProduto) {
    try {
        const response = await fetch(PRODUTO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoProduto)
        });
        if (response.status === 201 || response.status === 200) return await response.json();
        throw new Error('Falha ao criar produto');
    } catch (error) {
        console.error("Erro no POST de Produtos:", error);
    }
}

async function editarProduto(id, produtoAtualizado) {
    try {
        const response = await fetch(`${PRODUTO_API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produtoAtualizado)
        });
        if (response.ok) return await response.json();
        throw new Error('Erro ao atualizar produto');
    } catch (error) {
        console.error("Erro no PUT de Produtos:", error);
    }
}

async function deletarProdutoFluxo(id) {
    if (!podeRemoverProduto()) {
        alert("Seu perfil não tem permissão para remover produtos.");
        return;
    }
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
        const response = await fetch(`${PRODUTO_API_URL}/${id}`, { method: 'DELETE' });
        
        // Aceita 200, 204 ou 201 como respostas válidas de sucesso do backend
        if (response.status === 204 || response.status === 200 || response.status === 201) {
            alert("Produto excluído com sucesso!");

            // Atualiza produto, dashboard, estoque crítico, BI e histórico para a exclusão aparecer na tela.
            await carregarTelaProdutos();
            if (typeof refreshDashboard === "function") await refreshDashboard();
            if (typeof carregarEstoqueCritico === "function") await carregarEstoqueCritico();
            if (typeof carregarAtividadeRecente === "function") await carregarAtividadeRecente();
            if (typeof carregarHistoricoSistema === "function") await carregarHistoricoSistema();
            if (typeof carregarRelatoriosBI === "function") await carregarRelatoriosBI();
        } else {
            alert(`Erro ao tentar excluir o produto. Status: ${response.status}`);
        }
    } catch (error) {
        console.error("Erro no DELETE de Produtos:", error);
        alert("Erro de conexão ao tentar excluir.");
    }
}

// 🔥 CORREÇÃO 2: Expõe a função para o escopo global (torna o onclick do HTML capaz de encontrá-la)
window.deletarProdutoFluxo = deletarProdutoFluxo;


// ========================================================
// PREENCHIMENTO DINÂMICO DE CATEGORIAS NO PRODUTO
// ========================================================

// 1. Função que limpa e popula o <select> com as categorias do banco
async function atualizarSelectCategorias() {
    const selectCategoria = document.getElementById("productCategoryInput");
    if (!selectCategoria) return;

    // Mantém apenas a primeira opção padrão limpa
    selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';

    try {
        // Usa a sua função existente para listar as categorias do backend
        const categorias = await listarCategorias();

        if (categorias && Array.isArray(categorias)) {
            categorias.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.id; // Envia o ID para o Spring Boot vincular o relacionamento
                option.textContent = cat.nome; // Exibe o texto amigável para o usuário
                selectCategoria.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar categorias para o formulário de produtos:", error);
    }
}

// 2. Vinculação com a abertura do Modal de Produtos
// Procure o local onde você gerencia o clique do botão "Novo Produto" e inclua a chamada:
const btnNovoProduto = document.getElementById("add-product-btn"); // mude para o ID correto do seu botão se for diferente
const modalProduto = document.getElementById("product-modal"); // mude para o ID correto do seu modal se for diferente

if (btnNovoProduto) {
    btnNovoProduto.addEventListener("click", () => {
        // Executa a busca de categorias atualizadas logo antes de exibir o modal na tela
        atualizarSelectCategorias();

        // O seu código original para abrir o modal de produto continua aqui embaixo:
        if (modalProduto) {
            modalProduto.classList.remove("hidden");
            modalProduto.classList.add("flex");
        }
    });
}

async function atualizarSelectFornecedores() {
    const selectSupplier = document.getElementById("form-product-supplier");
    if (!selectSupplier) return;

    try {
        // Busca a lista atualizada de fornecedores da sua API Spring Boot
        // Certifique-se de usar a mesma URL configurada no mapeamento de fornecedores
        const response = await fetch("http://localhost:8080/fornecedor");
        if (!response.ok) throw new Error("Erro ao buscar fornecedores");
        
        const fornecedores = await response.json();

        // Reseta o select mantendo apenas a opção padrão desabilitada
        selectSupplier.innerHTML = '<option value="" disabled selected>Selecione um fornecedor</option>';

        // Alimenta o select com os fornecedores vindos do banco de dados
        if (fornecedores && fornecedores.length > 0) {
            fornecedores.forEach(forn => {
                const option = document.createElement("option");
                option.value = forn.id; // Guarda o ID do fornecedor no valor da opção
                option.textContent = forn.nome; // Exibe o nome na tela
                selectSupplier.appendChild(option);
            });
            console.log(`${fornecedores.length} fornecedores carregados no select de produtos.`);
        }
    } catch (error) {
        console.error("Falha ao carregar fornecedores no formulário de produtos:", error);
    }
}


// ==========================================
//           FUNÇÕES DE USUÁRIO
// ==========================================

// === GET: Listar Todos ===
async function listarUsuarios() {
    try {
        const response = await fetch(USUARIO_API_URL);
        if (!response.ok) {
            throw new Error(`Erro ao buscar usuários: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erro no GET de Usuários:", error);
    }
}

// === POST: Incluir ===
async function incluirUsuario(novoUsuario) {
    try {
        const response = await fetch(USUARIO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoUsuario)
        });

        if (response.status === 201) {
            return await response.json();
        } else {
            throw new Error('Falha ao criar usuário (Bad Request)');
        }
    } catch (error) {
        console.error("Erro no POST de Usuários:", error);
    }
}

// === PUT: Editar ===
async function editarUsuario(id, usuarioAtualizado) {
    try {
        const response = await fetch(`${USUARIO_API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioAtualizado)
        });

        if (response.status === 200) {
            return await response.json();
        } else if (response.status === 404) {
            throw new Error('Usuário não encontrado');
        } else {
            throw new Error('Erro ao atualizar usuário');
        }
    } catch (error) {
        console.error("Erro no PUT de Usuários:", error);
    }
}

// === DELETE: Excluir ===
async function excluirUsuario(id) {
    try {
        const response = await fetch(`${USUARIO_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            console.log('Usuário excluído com sucesso.');
            return true;
        } else {
            throw new Error('Erro ao excluir usuário');
        }
    } catch (error) {
        console.error("Erro no DELETE de Usuários:", error);
        return false;
    }
}


// ==========================================
//    LÓGICA DA TELA DE LOGIN / CADASTRO
// ==========================================

let isLoginMode = true;

// Mapeamento dos elementos do HTML
const authScreen = document.getElementById('auth-screen');
const mainSidebar = document.getElementById('sidebar');
const mainContainer = document.getElementById('main-container');
const mobileHeader = document.querySelector('.lg\\:hidden.fixed.top-0');

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authNameContainer = document.getElementById('auth-name-container');
const authNameInput = document.getElementById('auth-name');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authProfileContainer = document.getElementById('auth-profile-container');
const authProfileInput = document.getElementById('auth-profile');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authSwitchText = document.getElementById('auth-switch-text');

// Alternar as telas de Login e Cadastro
authSwitchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
        authTitle.innerText = "Acessar o EstoquePro";
        authSubtitle.innerText = "Insira suas credenciais para continuar";
        authNameContainer.classList.add('hidden');
        if (authProfileContainer) authProfileContainer.classList.add('hidden');
        authNameInput.removeAttribute('required');
        authSubmitBtn.innerText = "Entrar";
        authSwitchText.innerText = "Não tem uma conta?";
        authSwitchBtn.innerText = "Cadastre-se";
    } else {
        authTitle.innerText = "Criar uma Conta";
        authSubtitle.innerText = "Preencha os dados para se registrar";
        authNameContainer.classList.remove('hidden');
        if (authProfileContainer) authProfileContainer.classList.remove('hidden');
        authNameInput.setAttribute('required', 'true');
        authSubmitBtn.innerText = "Registrar e Entrar";
        authSwitchText.innerText = "Já possui uma conta?";
        authSwitchBtn.innerText = "Faça Login";
    }
    authForm.reset();
});

// Intercepta o envio do formulário
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = authEmailInput.value.trim();
    const senha = authPasswordInput.value;

    if (isLoginMode) {
        // Fluxo de LOGIN: Procura o e-mail e senha digitados na lista da API
        await realizarLogin(email, senha);
    } else {
        // Fluxo de CADASTRO: Envia o novo usuário para a API
        const nome = authNameInput.value.trim();
        const perfil = authProfileInput ? authProfileInput.value : 'FUNCIONARIO';
        await registrarUsuario(nome, email, senha, perfil);
    }
});

// PASSO 1: Enviar os dados de cadastro para a API de Usuários
async function registrarUsuario(nome, email, senha, perfil) {
    try {
        const response = await fetch(USUARIO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, perfil })
        });

        if (response.status === 201 || response.status === 200) {
            const usuarioCriado = await response.json();
            alert(`Conta criada com sucesso para: ${usuarioCriado.nome}! Redirecionando para o sistema...`);
            
            // Entra direto no sistema após cadastrar
            liberarAcessoAoSistema(usuarioCriado);
        } else {
            alert('Erro ao cadastrar. Verifique se o servidor aceitou os dados.');
        }
    } catch (error) {
        console.error("Erro na requisição de cadastro:", error);
        alert('Não foi possível conectar ao servidor para realizar o cadastro.');
    }
}

// PASSO 2: Validar o Login comparando com os dados da API
async function realizarLogin(email, senha) {
    try {
        const response = await fetch(USUARIO_API_URL);
        if (!response.ok) throw new Error("Erro ao ler tabela de usuários");

        const usuarios = await response.json();
        
        // Procura no array da API se existe alguém com as credenciais digitadas
        const usuarioValido = usuarios.find(u => u.email === email && u.senha === senha);

        if (usuarioValido) {
            alert(`Bem-vindo de volta, ${usuarioValido.nome}!`);
            liberarAcessoAoSistema(usuarioValido);
        } else {
            alert('E-mail ou senha incorretos. Tente novamente ou cadastre-se.');
        }
    } catch (error) {
        console.error("Erro na requisição de login:", error);
        alert('Erro ao conectar com o banco de dados dos usuários.');
    }
}

// PASSO 3: Mostrar o Dashboard e Menus, destruindo o bloqueio visual
function liberarAcessoAoSistema(usuario) {
    // Salva o estado para não perder o login ao atualizar a página (F5)
    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));

    // Remove as barreiras visuais
    if (authScreen) authScreen.classList.add('hidden');
    if (mainSidebar) mainSidebar.classList.remove('hidden');
    if (mainContainer) mainContainer.classList.remove('hidden');
    if (mobileHeader) mobileHeader.classList.remove('hidden');

    document.body.classList.remove('overflow-hidden');
    aplicarPermissoesUsuario();
    if (typeof carregarTelaProdutos === "function") carregarTelaProdutos();
}

// Monitora se o usuário já estava logado antes
document.addEventListener('DOMContentLoaded', async () => {

    await refreshDashboard();
    if (podeVerHistorico()) await carregarAtividadeRecente();
    await carregarEstoqueCritico();
    // Deixa a tabela de categorias preparada desde a abertura do sistema.
    // Se a aba estiver escondida, não tem problema: quando o usuário abrir, os dados já estarão lá.
    await carregarTelaCategorias();

    const sessaoAtiva = sessionStorage.getItem('usuarioLogado');
    
    if (sessaoAtiva) {
        liberarAcessoAoSistema(JSON.parse(sessaoAtiva));
    } else {
        // Mantém tudo oculto caso não haja login ativo
        if (mainSidebar) mainSidebar.classList.add('hidden');
        if (mainContainer) mainContainer.classList.add('hidden');
        if (mobileHeader) mobileHeader.classList.add('hidden');
    }
});

// Função Utilitária para o botão de Deslogar (Sair)
// ==========================================
//        VINCULAÇÃO E LOGOUT DO SISTEMA
// ==========================================

// Mapeia o botão de logout que adicionamos na barra lateral
const btnLogout = document.getElementById("logout-btn");

function efetuarLogout() {
    if (confirm("Deseja realmente sair do sistema?")) {
        // 1. Limpa a sessão do navegador (O usuário continua salvo no banco do Spring Boot)
        sessionStorage.removeItem('usuarioLogado');
        
        // 2. Opcional: Garante que a tela volte direto no modo de Login (evita abrir em modo cadastro)
        isLoginMode = true; 

        // 3. Recarrega a página. O DOMContentLoaded vai rodar, ver que a sessão sumiu e travar o sistema na tela de login
        window.location.reload(); 
    }
}

// Escuta o clique do botão de Sair
if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
        e.preventDefault();
        efetuarLogout();
    });
}



// === GET: Listar Todas ===
async function listarVendas() {
    try {
        const response = await fetch(ITEM_VENDA_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar vendas: ${response.status}`);
        }
        
        const vendas = await response.json();
        return vendas; // Retorna a lista de VendaEntity
    } catch (error) {
        console.error("Erro no GET:", error);
    }
}

// === POST: Incluir ===
async function incluirVenda(novaVenda) {
    try {
        const response = await fetch(ITEM_VENDA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaVenda) // Passa o objeto VendaEntity
        });

        if (response.status === 201) {
            const vendaCriada = await response.json();
            return vendaCriada;
        } else {
            throw new Error('Falha ao registrar venda (Bad Request)');
        }
    } catch (error) {
        console.error("Erro no POST:", error);
    }
}

// === PUT: Editar ===
async function editarVenda(id, vendaAtualizada) {
    try {
        const response = await fetch(`${ITEM_VENDA_API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendaAtualizada)
        });

        if (response.status === 200) {
            const vendaEditada = await response.json();
            return vendaEditada;
        } else if (response.status === 404) {
            throw new Error('Venda não encontrada');
        } else {
            throw new Error('Erro ao atualizar venda');
        }
    } catch (error) {
        console.error("Erro no PUT:", error);
    }
}

// === DELETE: Excluir ===
async function excluirVenda(id) {
    try {
        const response = await fetch(`${ITEM_VENDA_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            console.log('Venda excluída com sucesso.');
            return true;
        } else {
            throw new Error('Erro ao excluir venda');
        }
    } catch (error) {
        console.error("Erro no DELETE:", error);
        return false;
    }
}

// ==========================================
//          LOGOUT DO SISTEMA
// ==========================================








// ========================================================
// LANÇAMENTO DE ESTOQUE: entrada/saída com custo e venda
// ========================================================
async function preencherSelectLancamentoProdutos() {
    const select = document.getElementById("launch-product-select");
    if (!select) return;

    const produtos = await listarProdutos();
    select.innerHTML = '<option value="">Selecione um produto</option>';

    produtos.forEach(prod => {
        const option = document.createElement("option");
        option.value = prod.id;
        option.textContent = `${prod.nome || 'Produto'} | estoque: ${prod.quantidade || 0}`;
        option.dataset.custo = prod.precoCusto || 0;
        option.dataset.venda = prod.precoVenda || 0;
        select.appendChild(option);
    });
}

async function enviarLancamentoEstoque(dados) {
    dados.usuarioSistema = nomeUsuarioSistema();
    dados.perfilUsuario = perfilUsuarioAtual();
    const response = await fetch(LANCAMENTO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || `Erro HTTP ${response.status}`);
    }

    return await response.json();
}

document.addEventListener("DOMContentLoaded", () => {
    const btnLancamento = document.getElementById("launch-movement-btn");
    const btnLancamentoDashboard = document.getElementById("dashboard-launch-btn");
    const stockModal = document.getElementById("stock-modal");
    const stockForm = document.getElementById("stock-form");
    const productSelect = document.getElementById("launch-product-select");
    const costInput = document.getElementById("movementCost");
    const saleInput = document.getElementById("movementSale");

    if (stockModal) {
        stockModal.querySelectorAll(".close-modal").forEach(btn => {
            btn.addEventListener("click", () => stockModal.classList.add("hidden"));
        });
    }

    const abrirModalLancamento = async () => {
        if (!stockModal) return;
        if (stockForm) stockForm.reset();
        aplicarPermissoesUsuario();
        await preencherSelectLancamentoProdutos();
        stockModal.classList.remove("hidden");
    };

    if (btnLancamento) btnLancamento.addEventListener("click", abrirModalLancamento);
    if (btnLancamentoDashboard) btnLancamentoDashboard.addEventListener("click", abrirModalLancamento);

    if (productSelect) {
        productSelect.addEventListener("change", () => {
            const selected = productSelect.options[productSelect.selectedIndex];
            if (selected) {
                if (costInput) costInput.value = selected.dataset.custo || 0;
                if (saleInput) saleInput.value = selected.dataset.venda || 0;
            }
        });
    }

    if (stockForm) {
        stockForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const tipoSelecionado = document.querySelector('input[name="movementType"]:checked');
            const dados = {
                idproduto: parseInt(document.getElementById("launch-product-select")?.value || "0", 10),
                tipo: tipoSelecionado ? tipoSelecionado.value : "ENTRADA",
                quantidade: parseInt(document.getElementById("movementQuantity")?.value || "0", 10),
                precoCusto: parseFloat((document.getElementById("movementCost")?.value || "0").replace(",", ".")) || 0,
                precoVenda: parseFloat((document.getElementById("movementSale")?.value || "0").replace(",", ".")) || 0
            };

            if (ehFuncionario() && String(dados.tipo).toUpperCase() === 'SAIDA') return alert("Funcionário só pode lançar entrada.");
            if (!dados.idproduto || dados.idproduto <= 0) return alert("Selecione um produto.");
            if (!Number.isInteger(dados.quantidade) || dados.quantidade <= 0) return alert("Informe uma quantidade inteira maior que zero.");
            if (!Number.isFinite(dados.precoCusto) || dados.precoCusto < 0) return alert("O valor de custo não pode ser negativo.");
            if (!Number.isFinite(dados.precoVenda) || dados.precoVenda < 0) return alert("O valor de venda não pode ser negativo.");

            try {
                await enviarLancamentoEstoque(dados);
                alert("Lançamento registrado com sucesso!");
                stockModal.classList.add("hidden");
                await carregarTelaProdutos();
                await refreshDashboard();
                if (podeVerHistorico()) await carregarAtividadeRecente();
                await carregarEstoqueCritico();
                await carregarRelatoriosBI();
            } catch (error) {
                console.error("Erro ao lançar movimentação:", error);
                alert("Erro ao lançar movimentação. Verifique o console do Spring Boot e do navegador.");
            }
        });
    }
});

// ========================================================
// RELATÓRIOS BI - renderização dos gráficos da aba Relatórios BI
// ========================================================
let trendChartInstance = null;
let categoryChartInstance = null;
let valueChartInstance = null;

function destruirGrafico(chart) {
    if (chart && typeof chart.destroy === 'function') chart.destroy();
}

function agruparSoma(lista, chaveFn, valorFn) {
    const mapa = new Map();
    lista.forEach(item => {
        const chave = chaveFn(item) || 'Sem informação';
        const valor = Number(valorFn(item) || 0);
        mapa.set(chave, (mapa.get(chave) || 0) + valor);
    });
    return mapa;
}

async function carregarRelatoriosBI() {
    if (typeof Chart === 'undefined') return;

    try {
        const [estoqueResp, lancResp] = await Promise.all([
            fetch(`${RELATORIOS_API_URL}/powerbi-estoque`),
            fetch(`${RELATORIOS_API_URL}/powerbi-lancamentos`)
        ]);

        const estoque = estoqueResp.ok ? await estoqueResp.json() : [];
        const lancamentos = lancResp.ok ? await lancResp.json() : [];

        renderizarGraficoCategoriasBI(estoque);
        renderizarGraficoFinanceiroBI(estoque, lancamentos);
        renderizarGraficoTendenciaBI(lancamentos);
    } catch (error) {
        console.error("Erro ao carregar relatórios BI:", error);
    }
}

function renderizarGraficoCategoriasBI(estoque) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    const agrupado = agruparSoma(estoque, item => item.categoria, item => item.quantidade);
    const labels = [...agrupado.keys()];
    const valores = [...agrupado.values()];

    destruirGrafico(categoryChartInstance);
    categoryChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Itens em estoque', data: valores }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderizarGraficoFinanceiroBI(estoque, lancamentos) {
    const canvas = document.getElementById('valueChart');
    if (!canvas) return;

    let faturamento = 0;
    let custo = 0;
    let lucro = 0;

    if (lancamentos && lancamentos.length > 0) {
        lancamentos.filter(l => String(l.tipo || '').toUpperCase() === 'SAIDA').forEach(l => {
            faturamento += Number(l.valor_venda || l.valorVenda || 0);
            custo += Number(l.valor_custo || l.valorCusto || 0);
            lucro += Number(l.lucro_estimado || l.lucroEstimado || 0);
        });
    } else {
        estoque.forEach(p => {
            faturamento += Number(p.valor_total_estoque || p.valorTotalEstoque || 0);
            custo += Number(p.custo_total_estoque || p.custoTotalEstoque || 0);
            lucro += Number(p.lucro_potencial_estoque || p.lucroPotencialEstoque || 0);
        });
    }

    destruirGrafico(valueChartInstance);
    valueChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Faturamento/Estoque venda', 'Custo', 'Lucro'],
            datasets: [{ data: [faturamento, custo, lucro] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderizarGraficoTendenciaBI(lancamentos) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const porDiaEntrada = new Map();
    const porDiaSaida = new Map();

    lancamentos.forEach(l => {
        const data = String(l.data || l.data_movimentacao || '').substring(0, 10) || 'Sem data';
        const tipo = String(l.tipo || '').toUpperCase();
        const qtd = Number(l.quantidade || 0);
        const mapa = tipo === 'ENTRADA' ? porDiaEntrada : porDiaSaida;
        mapa.set(data, (mapa.get(data) || 0) + qtd);
    });

    const labels = [...new Set([...porDiaEntrada.keys(), ...porDiaSaida.keys()])].sort();
    const entradas = labels.map(d => porDiaEntrada.get(d) || 0);
    const saidas = labels.map(d => porDiaSaida.get(d) || 0);

    destruirGrafico(trendChartInstance);
    trendChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Entradas', data: entradas },
                { label: 'Saídas', data: saidas }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}


// ========================================================
// BACKUP / RESTAURAÇÃO DO SISTEMA
// Exporta um arquivo JSON de backup e importa cadastros sem apagar dados.
// A importação evita duplicar categoria/fornecedor/usuário quando encontra
// nome, CNPJ ou e-mail já cadastrados. Movimentações e histórico ficam no
// arquivo de backup para auditoria, mas não são reaplicados automaticamente
// para não duplicar estoque.
// ========================================================
function baixarArquivoBackup(nomeArquivo, conteudo) {
    const blob = new Blob([conteudo], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function buscarJsonSeguro(url) {
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
}

window.exportData = async function exportData() {
    try {
        const [categorias, fornecedores, usuarios, produtos, movimentacoes, historico] = await Promise.all([
            buscarJsonSeguro(CATEGORIA_API_URL),
            buscarJsonSeguro(FORNECEDOR_API_URL),
            buscarJsonSeguro(USUARIO_API_URL),
            buscarJsonSeguro(PRODUTO_API_URL),
            buscarJsonSeguro(MOVIMENTACAO_API_URL),
            buscarJsonSeguro(HISTORICO_API_URL)
        ]);

        const backup = {
            tipo: 'backup-controle-vestuario',
            versao: 2,
            geradoEm: new Date().toISOString(),
            observacao: 'Backup exportado pelo sistema. Para restaurar, use o botão Importar.',
            dados: {
                categorias: categorias || [],
                fornecedores: fornecedores || [],
                usuarios: usuarios || [],
                produtos: produtos || [],
                movimentacoes: movimentacoes || [],
                historico: historico || []
            }
        };

        const data = new Date().toISOString().slice(0, 10);
        baixarArquivoBackup(`backup-controle-vestuario-${data}.json`, JSON.stringify(backup, null, 2));
        alert('Backup exportado com sucesso.');
    } catch (error) {
        console.error('Erro ao exportar backup:', error);
        alert('Erro ao exportar backup. Verifique o console do navegador.');
    }
};

function textoNormalizado(valor) {
    return String(valor || '').trim().toLowerCase();
}

function somenteNumeros(valor) {
    return String(valor || '').replace(/\D/g, '');
}

async function criarOuReutilizarCategoria(categoria, existentes, mapaCategorias) {
    const nome = String(categoria?.nome || '').trim();
    if (!nome) return null;

    let encontrada = existentes.find(c => textoNormalizado(c.nome) === textoNormalizado(nome));
    if (!encontrada) {
        encontrada = await incluirCategoria({ nome });
        if (encontrada) existentes.push(encontrada);
    }

    if (categoria.id && encontrada?.id) mapaCategorias.set(Number(categoria.id), Number(encontrada.id));
    return encontrada;
}

async function criarOuReutilizarFornecedor(fornecedor, existentes, mapaFornecedores) {
    const nome = String(fornecedor?.nome || '').trim();
    if (!nome) return null;

    const cnpjLimpo = somenteNumeros(fornecedor.cnpj);
    const emailNorm = textoNormalizado(fornecedor.email);

    let encontrado = existentes.find(f => {
        const mesmoCnpj = cnpjLimpo && somenteNumeros(f.cnpj) === cnpjLimpo;
        const mesmoEmail = emailNorm && textoNormalizado(f.email) === emailNorm;
        const mesmoNome = textoNormalizado(f.nome) === textoNormalizado(nome);
        return mesmoCnpj || mesmoEmail || mesmoNome;
    });

    const payload = {
        nome,
        cnpj: fornecedor.cnpj || null,
        telefone: fornecedor.telefone || null,
        email: fornecedor.email || null
    };

    if (!encontrado) {
        encontrado = await incluirFornecedor(payload);
        if (encontrado) existentes.push(encontrado);
    }

    if (fornecedor.id && encontrado?.id) mapaFornecedores.set(Number(fornecedor.id), Number(encontrado.id));
    return encontrado;
}

async function criarOuReutilizarUsuario(usuario, existentes) {
    const nome = String(usuario?.nome || '').trim();
    const email = String(usuario?.email || '').trim();
    const senha = String(usuario?.senha || '').trim();
    const perfil = String(usuario?.perfil || 'FUNCIONARIO').toUpperCase();
    if (!nome || !email || !senha) return null;

    let encontrado = existentes.find(u => textoNormalizado(u.email) === textoNormalizado(email));
    if (!encontrado) {
        encontrado = await incluirUsuario({ nome, email, senha, perfil });
        if (encontrado) existentes.push(encontrado);
    }
    return encontrado;
}

async function importarProduto(produto, existentes, mapaCategorias, mapaFornecedores) {
    const nome = String(produto?.nome || '').trim();
    if (!nome) return null;

    const categoriaAntigaId = produto.categoria?.id || produto.idcategoria || produto.categoria_id;
    const fornecedorAntigoId = produto.fornecedor?.id || produto.idfornecedor || produto.fornecedor_id;
    const categoriaId = mapaCategorias.get(Number(categoriaAntigaId)) || categoriaAntigaId;
    const fornecedorId = mapaFornecedores.get(Number(fornecedorAntigoId)) || fornecedorAntigoId;

    const quantidade = Number(produto.quantidade || 0);
    const precoCusto = Number(produto.precoCusto ?? produto.preco_custo ?? produto.custo ?? 0);
    const precoVenda = Number(produto.precoVenda ?? produto.preco_venda ?? produto.preco ?? 0);

    if (quantidade < 0 || precoCusto < 0 || precoVenda < 0) {
        console.warn('Produto ignorado por conter número negativo:', produto);
        return null;
    }

    const payload = {
        nome,
        descricao: produto.descricao || '',
        quantidade,
        precoCusto,
        precoVenda,
        categoria: categoriaId ? { id: Number(categoriaId) } : null,
        fornecedor: fornecedorId ? { id: Number(fornecedorId) } : null
    };

    let existente = existentes.find(p => textoNormalizado(p.nome) === textoNormalizado(nome));
    if (existente?.id) {
        return await editarProduto(existente.id, payload);
    }

    const criado = await incluirProduto(payload);
    if (criado) existentes.push(criado);
    return criado;
}

async function importarBackupControleVestuario(backup) {
    const dados = backup?.dados || backup;
    if (!dados || !Array.isArray(dados.categorias) || !Array.isArray(dados.fornecedores) || !Array.isArray(dados.produtos)) {
        throw new Error('Arquivo de backup inválido ou incompleto.');
    }

    const mapaCategorias = new Map();
    const mapaFornecedores = new Map();

    const categoriasAtuais = await listarCategorias() || [];
    const fornecedoresAtuais = await listarFornecedores() || [];
    const usuariosAtuais = await listarUsuarios() || [];
    const produtosAtuais = await listarProdutos() || [];

    for (const categoria of dados.categorias) {
        await criarOuReutilizarCategoria(categoria, categoriasAtuais, mapaCategorias);
    }

    for (const fornecedor of dados.fornecedores) {
        await criarOuReutilizarFornecedor(fornecedor, fornecedoresAtuais, mapaFornecedores);
    }

    for (const usuario of (dados.usuarios || [])) {
        await criarOuReutilizarUsuario(usuario, usuariosAtuais);
    }

    for (const produto of dados.produtos) {
        await importarProduto(produto, produtosAtuais, mapaCategorias, mapaFornecedores);
    }

    await refreshAll();
}

document.addEventListener('DOMContentLoaded', () => {
    const importInput = document.getElementById('importFile');
    if (!importInput) return;

    importInput.addEventListener('change', async (event) => {
        const arquivo = event.target.files && event.target.files[0];
        if (!arquivo) return;

        try {
            const conteudo = await arquivo.text();
            const backup = JSON.parse(conteudo);
            if (!confirm('Importar este backup? O sistema vai criar ou atualizar cadastros sem apagar dados existentes.')) {
                importInput.value = '';
                return;
            }
            await importarBackupControleVestuario(backup);
            alert('Backup importado com sucesso.');
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            alert(`Erro ao importar backup: ${error.message}`);
        } finally {
            importInput.value = '';
        }
    });
});


// ========================================================
// AJUSTE PONTUAL - CATEGORIAS E GRÁFICOS BI
// Esta parte ficou no final para não reescrever as rotinas antigas que já estão funcionando.
// A ideia é só reforçar a carga das categorias e deixar os gráficos mais tolerantes
// com nomes de campos vindos do SQL Server/JdbcTemplate.
// ========================================================
function pegarValorCampo(obj, nomes, padrao = null) {
    if (!obj) return padrao;
    for (const nome of nomes) {
        if (Object.prototype.hasOwnProperty.call(obj, nome)) return obj[nome];
    }
    const chaves = Object.keys(obj);
    for (const nome of nomes) {
        const achada = chaves.find(k => k.toLowerCase() === String(nome).toLowerCase());
        if (achada) return obj[achada];
    }
    return padrao;
}

function numeroBI(valor) {
    if (valor === null || valor === undefined || valor === '') return 0;
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    const n = Number(String(valor).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

async function buscarListaBI(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Relatório BI retornou HTTP', response.status, url);
            return [];
        }
        const dados = await response.json();
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.warn('Não foi possível carregar dados BI:', url, erro);
        return [];
    }
}

function dadosVaziosGrafico(texto = 'Sem dados') {
    return { labels: [texto], valores: [0] };
}

function montarAgrupamentoBI(lista, campoNome, campoValor) {
    const mapa = new Map();
    (lista || []).forEach(item => {
        const chave = String(pegarValorCampo(item, campoNome, 'Sem informação') || 'Sem informação');
        const valor = numeroBI(pegarValorCampo(item, campoValor, 0));
        mapa.set(chave, (mapa.get(chave) || 0) + valor);
    });
    if (mapa.size === 0) return dadosVaziosGrafico();
    return { labels: Array.from(mapa.keys()), valores: Array.from(mapa.values()) };
}

async function carregarRelatoriosBI() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não foi carregado. Os relatórios BI dependem dele.');
        return;
    }

    const estoque = await buscarListaBI(`${RELATORIOS_API_URL}/powerbi-estoque`);
    const lancamentos = await buscarListaBI(`${RELATORIOS_API_URL}/powerbi-lancamentos`);

    // Se a view de estoque ainda não tiver dados por algum motivo, usa a API de produtos como plano B.
    // Isso evita tela em branco enquanto o banco está sendo ajustado.
    let estoqueParaGrafico = estoque;
    if (!estoqueParaGrafico || estoqueParaGrafico.length === 0) {
        const produtos = await listarProdutos();
        estoqueParaGrafico = (produtos || []).map(p => ({
            produto: p.nome,
            categoria: p.categoria?.nome || 'Sem categoria',
            fornecedor: p.fornecedor?.nome || 'Sem fornecedor',
            quantidade: p.quantidade || 0,
            preco_custo: p.precoCusto || 0,
            preco_venda: p.precoVenda || 0,
            valor_total_estoque: (p.quantidade || 0) * (p.precoVenda || 0),
            custo_total_estoque: (p.quantidade || 0) * (p.precoCusto || 0),
            lucro_potencial_estoque: (p.quantidade || 0) * ((p.precoVenda || 0) - (p.precoCusto || 0))
        }));
    }

    renderizarGraficoCategoriasBI(estoqueParaGrafico);
    renderizarGraficoFinanceiroBI(estoqueParaGrafico, lancamentos);
    renderizarGraficoTendenciaBI(lancamentos);
}

function renderizarGraficoCategoriasBI(estoque) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    const dados = montarAgrupamentoBI(
        estoque,
        ['categoria', 'CATEGORIA', 'nome_categoria'],
        ['quantidade', 'QUANTIDADE', 'total_itens', 'TOTAL_ITENS']
    );

    destruirGrafico(categoryChartInstance);
    categoryChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: dados.labels,
            datasets: [{ label: 'Itens em estoque por categoria', data: dados.valores }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderizarGraficoFinanceiroBI(estoque, lancamentos) {
    const canvas = document.getElementById('valueChart');
    if (!canvas) return;

    let vendaEstoque = 0;
    let custoEstoque = 0;
    let lucroEstoque = 0;

    (estoque || []).forEach(p => {
        vendaEstoque += numeroBI(pegarValorCampo(p, ['valor_total_estoque', 'VALOR_TOTAL_ESTOQUE', 'valorTotalEstoque']));
        custoEstoque += numeroBI(pegarValorCampo(p, ['custo_total_estoque', 'CUSTO_TOTAL_ESTOQUE', 'custoTotalEstoque']));
        lucroEstoque += numeroBI(pegarValorCampo(p, ['lucro_potencial_estoque', 'LUCRO_POTENCIAL_ESTOQUE', 'lucroPotencialEstoque']));
    });

    // Se a view não trouxe os totais prontos, calcula pela quantidade x preço.
    if (vendaEstoque === 0 && custoEstoque === 0 && lucroEstoque === 0) {
        (estoque || []).forEach(p => {
            const qtd = numeroBI(pegarValorCampo(p, ['quantidade', 'QUANTIDADE']));
            const custo = numeroBI(pegarValorCampo(p, ['preco_custo', 'PRECO_CUSTO', 'precoCusto']));
            const venda = numeroBI(pegarValorCampo(p, ['preco_venda', 'PRECO_VENDA', 'precoVenda']));
            vendaEstoque += qtd * venda;
            custoEstoque += qtd * custo;
            lucroEstoque += qtd * (venda - custo);
        });
    }

    destruirGrafico(valueChartInstance);
    valueChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Valor de venda em estoque', 'Custo em estoque', 'Lucro potencial'],
            datasets: [{ data: [vendaEstoque, custoEstoque, lucroEstoque] }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderizarGraficoTendenciaBI(lancamentos) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const entradasPorDia = new Map();
    const saidasPorDia = new Map();

    (lancamentos || []).forEach(l => {
        const dataBruta = pegarValorCampo(l, ['data', 'DATA', 'data_movimentacao', 'dataMovimentacao'], 'Sem data');
        const dia = String(dataBruta || 'Sem data').substring(0, 10);
        const tipo = String(pegarValorCampo(l, ['tipo', 'TIPO'], '') || '').toUpperCase();
        const quantidade = numeroBI(pegarValorCampo(l, ['quantidade', 'QUANTIDADE'], 0));
        const mapa = tipo === 'ENTRADA' ? entradasPorDia : saidasPorDia;
        mapa.set(dia, (mapa.get(dia) || 0) + quantidade);
    });

    let labels = Array.from(new Set([...entradasPorDia.keys(), ...saidasPorDia.keys()])).sort();
    if (labels.length === 0) labels = ['Sem lançamentos'];

    destruirGrafico(trendChartInstance);
    trendChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Entradas', data: labels.map(d => entradasPorDia.get(d) || 0), tension: 0.25 },
                { label: 'Saídas', data: labels.map(d => saidasPorDia.get(d) || 0), tension: 0.25 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Reforço pequeno para a aba Categorias: carrega ao abrir a página e também ao clicar no menu.
// Não altera cadastro/edição/exclusão; só garante a listagem inicial.
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof carregarTelaCategorias === 'function') carregarTelaCategorias();
    }, 300);
});


// Reaplica permissões após a página montar, porque alguns botões são gerados dinamicamente.
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => aplicarPermissoesUsuario(), 500);
});
