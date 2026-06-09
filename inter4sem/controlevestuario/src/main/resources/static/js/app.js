const CATEGORIA_API_URL    = 'http://localhost:8080/categoria';
const FORNECEDOR_API_URL   = 'http://localhost:8080/fornecedor';
const ITEM_VENDA_API_URL   = 'http://localhost:8080/item-venda';
const MOVIMENTACAO_API_URL = 'http://localhost:8080/movimentacao';
const PRODUTO_API_URL      = 'http://localhost:8080/Produto';
const USUARIO_API_URL      = 'http://localhost:8080/Usuario';
const VENDA_API_URL        = 'http://localhost:8080/Venda';

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

        const id = document.getElementById("product-id").value;
        
        // Captura os inputs de texto/número de forma segura
        const qtyInput = document.getElementById("form-product-qty")?.value || "0";
        const priceInput = document.getElementById("form-product-price")?.value || "0";

        // 🔥 CORREÇÃO: Captura os elementos inteiros primeiro para evitar ler '.value' de null
        const selectCategoria = document.getElementById("productCategoryInput");
        const selectFornecedor = document.getElementById("form-product-supplier");

        // Extrai os valores apenas se os elementos existirem na árvore do HTML
        const idCategoria = selectCategoria ? selectCategoria.value : "";
        const idFornecedor = selectFornecedor ? selectFornecedor.value : "";

        // Converte o preço tratando possíveis vírgulas para ponto flutuante puro
        const precoLimpo = parseFloat(priceInput.replace(",", ".")) || 0.0;

        // Montagem do objeto idêntico ao contrato aceito pelo seu Spring Boot
        const novoProduto = {
            nome: document.getElementById("form-product-name")?.value.trim() || "",
            quantidade: parseInt(qtyInput, 10) || 0,
            
            // Duplo mapeamento para garantir compatibilidade com sua Entity/DTO
            preco: precoLimpo,
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
                }
            }
        });
    });
});

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
    try {
        // Converte a string de volta para um objeto JavaScript
        const produto = JSON.parse(produtoJsonEscapado.replace(/&quot;/g, '"'));

        // 1. Preenche os inputs ocultos e visíveis
        document.getElementById("product-id").value = produto.id;
        document.getElementById("form-product-name").value = produto.nome;
        document.getElementById("form-product-qty").value = produto.quantidade;
        document.getElementById("form-product-price").value = produto.precoVenda;

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

    tabelaBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-slate-500">Carregando produtos...</td></tr>`;

    const produtos = await listarProdutos();
    tabelaBody.innerHTML = ""; 

    if (!produtos || produtos.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-slate-500">Nenhum produto cadastrado.</td></tr>`;
        return;
    }

    produtos.forEach(prod => {
        // Formatações de exibição
        const precoVenda = prod.precoVenda ? `R$ ${prod.precoVenda.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
        const statusClass = prod.quantidade > 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        const statusTexto = prod.quantidade > 5 ? 'Em Estoque' : 'Baixo Estoque';

        // 🔥 TRANSFORMA O OBJETO DO PRODUTO ATUAL EM STRING PARA ENVIAR PARA O MODAL
        const produtoJson = JSON.stringify(prod).replace(/"/g, '&quot;');

        // Injeta a linha inteira de uma vez só no HTML da tabela
        tabelaBody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${prod.nome || 'Sem nome'}</td>
                <td class="px-6 py-4">${prod.fornecedor?.nome || 'Não atribuído'}</td>
                <td class="px-6 py-4 text-center">${prod.quantidade || 0}</td>
                <td class="px-6 py-4 text-right">${precoVenda}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusTexto}</span>
                </td>
                <td class="px-6 py-4 text-center space-x-3">
                    <button onclick="prepararEdicao('${produtoJson}')" class="text-blue-600 hover:text-blue-900 font-medium dark:hover:text-blue-400">
                        Editar
                    </button>
                    <button onclick="deletarProdutoFluxo(${prod.id})" class="text-red-600 hover:text-red-900 font-medium">
                        Excluir
                    </button>
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
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
        const response = await fetch(`${PRODUTO_API_URL}/${id}`, { method: 'DELETE' });
        
        // Aceita 200, 204 ou 201 como respostas válidas de sucesso do backend
        if (response.status === 204 || response.status === 200 || response.status === 201) {
            alert("Produto excluído com sucesso!");
            
            // 🔥 CORREÇÃO 1: Atualiza a tabela na tela imediatamente após deletar
            carregarTelaProdutos(); 
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
        authNameInput.removeAttribute('required');
        authSubmitBtn.innerText = "Entrar";
        authSwitchText.innerText = "Não tem uma conta?";
        authSwitchBtn.innerText = "Cadastre-se";
    } else {
        authTitle.innerText = "Criar uma Conta";
        authSubtitle.innerText = "Preencha os dados para se registrar";
        authNameContainer.classList.remove('hidden');
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
        await registrarUsuario(nome, email, senha);
    }
});

// PASSO 1: Enviar os dados de cadastro para a API de Usuários
async function registrarUsuario(nome, email, senha) {
    try {
        const response = await fetch(USUARIO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
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
}

// Monitora se o usuário já estava logado antes
document.addEventListener('DOMContentLoaded', () => {
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






