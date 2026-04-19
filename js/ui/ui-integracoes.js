let nomesTemporarios = [];

// ─────────────────────────────────────────────────────────────────────────────
// Navegação
// ─────────────────────────────────────────────────────────────────────────────

async function abrirTelaIntegracoes() {
	setTitle('Integrações');
	conteudo.innerHTML = Ui.PainelIntegracoes();
	await carregarIntegracoes(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Carregamento
// ─────────────────────────────────────────────────────────────────────────────

async function carregarIntegracoes(firstTime = false) {
	travarUI();
	try {
		mostrarLoading('listaIntegracoes');

		const nomes = firstTime
			? (dataStore.nomes_integracao ?? (await integracoesService.listar()))
			: await integracoesService.listar();

		if (nomes?.error) throw new Error(nomes.error);

		const lista = nomes || [];
		dataStore.nomes_integracao = lista;

		renderizarIntegracoes(lista);
	} catch (err) {
		console.error(err);
		document.getElementById('listaIntegracoes').innerHTML = `
      <div class="alert alert-danger text-center">
        Erro ao carregar integrações
      </div>
    `;
	} finally {
		liberarUI();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderização
// ─────────────────────────────────────────────────────────────────────────────

function renderizarIntegracoes(nomes) {
	const container = document.getElementById('listaIntegracoes');
	if (!container) return;

	if (!nomes.length) {
		container.innerHTML = `
      <div class="alert alert-secondary text-center">
        Nenhuma integração cadastrada
      </div>
    `;
		return;
	}

	const grupos = {};
	nomes.forEach((n) => {
		const idLocal = Number(n.id_local);
		if (!grupos[idLocal]) grupos[idLocal] = [];
		grupos[idLocal].push(n);
	});

	renderCardsIntegracoes(grupos);
}

function renderTabelaIntegracoes(grupos) {
	renderCardsIntegracoes(grupos);
}

function renderCardsIntegracoes(grupos) {
	const container = document.getElementById('listaIntegracoes');

	let html = '<div class="d-flex flex-column gap-4">';

	Object.entries(grupos).forEach(([idLocal, nomes]) => {
		const local = dataStore.locais.find((l) => Number(l.id) === Number(idLocal));
		const nomeLocal = local?.nome || 'Local não encontrado';

		html += `
      <div class="grupo-secao">
        <div class="grupo-secao-header">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${nomeLocal}
          <span class="grupo-secao-count">Total: ${nomes.length}</span>
          </span>
		  	<button class="btn btn-sm btn-outline-primary ms-auto editar-integracao-btn editar-btn"
            onclick="abrirModalEditarIntegracao(${idLocal})">
  				<i class="bi bi-pencil me-1"></i>
  				<span class="btn-text">Editar</span>
			</button>
			<button class="btn btn-sm btn-outline-danger ms-2 excluir-btn"
            onclick="excluirIntegracao(${idLocal}, this)">
  				<i class="bi bi-trash-fill me-1"></i>
  				<span class="btn-text">Excluir</span>
			</button>
        </div>
        <div class="d-flex flex-column gap-2">`;

		nomes.forEach((n) => {
			const nomeEscaped = encodeURIComponent(n.nome);
			html += `
          <div class="item-card item-card-compacto">
            <div class="item-card-body d-flex align-items-center justify-content-between gap-3">
              <div class="d-flex align-items-center gap-2">
                <div class="item-card-icon-circle" style="background:#e0e7ff">
                  <i class="bi bi-person-fill" style="color:#4338ca"></i>
                </div>
                <span class="fw-semibold">${n.nome}</span>
              </div>
              <div class="d-flex gap-2 flex-shrink-0">
                <button class="btn btn-sm btn-outline-primary compartilhar-btn"
                  onclick="compartilharNomeIntegracao('${nomeEscaped}', this)"
                  title="Compartilhar link">
                  <i class="bi bi-share"></i>
				  <span class="btn-text">Compartilhar</span>
                </button>
                <button class="btn btn-sm btn-outline-danger excluir-btn"
                  onclick="excluirNomeIntegracao(${n.id}, ${idLocal}, this)">
                  <i class="bi bi-trash"></i>
				  <span class="btn-text">Excluir</span>
                </button>
              </div>
            </div>
          </div>`;
		});

		html += '</div></div>';
	});

	html += '</div>';
	container.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compartilhar (link temporário — apenas frontend)
// ─────────────────────────────────────────────────────────────────────────────

async function compartilharNomeIntegracao(nomeEncoded, btn) {
	const nome = decodeURIComponent(nomeEncoded);
	const original = btn.innerHTML;

	btn.disabled = true;
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

	try {
		const escolha = await abrirModalEscolhaLink();

		if (!escolha) return;

		if (escolha === 'temporario') {
			await integracoesService.compartilharTemporario(nome);
		} else if (escolha === 'permanente') {
			await integracoesService.compartilharPermanente(nome);
		}
	} catch (err) {
		console.error('Erro ao compartilhar:', err);
	} finally {
		btn.disabled = false;
		btn.innerHTML = original;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de cadastro (Nova Integração)
// ─────────────────────────────────────────────────────────────────────────────

function abrirModalIntegracao() {
	nomesTemporarios = [];

	document.getElementById('inputNomeIntegracao').value = '';
	document.getElementById('selectLocalIntegracao').value = '';
	document.getElementById('erroIntegracaoLocal').classList.add('d-none');
	document.getElementById('erroIntegracaoNomes').classList.add('d-none');

	// Desbloqueia o select de local (pode ter sido desabilitado pelo modo editar)
	const select = document.getElementById('selectLocalIntegracao');
	select.disabled = false;

	document.getElementById('modalIntegracaoTitulo').textContent = 'Nova Integração';
	document.getElementById('btnSalvarIntegracao').onclick = salvarIntegracao;

	_preencherLocaisSelect();
	_renderListaTemporaria();

	bootstrap.Modal.getOrCreateInstance(document.getElementById('modalIntegracao')).show();
}

function _preencherLocaisSelect(idLocalSelecionado = null) {
	const select = document.getElementById('selectLocalIntegracao');
	if (!select) return;

	select.innerHTML = `<option value="">Selecione o local</option>`;

	if (!dataStore?.locais?.length) {
		const opt = document.createElement('option');
		opt.textContent = 'Nenhum local disponível';
		opt.disabled = true;
		select.appendChild(opt);
		return;
	}

	dataStore.locais.forEach((local) => {
		const opt = document.createElement('option');
		opt.value = local.id;
		opt.textContent = local.nome;
		if (idLocalSelecionado && Number(local.id) === Number(idLocalSelecionado)) {
			opt.selected = true;
		}
		select.appendChild(opt);
	});
}

async function adicionarNomeIntegracao() {
	const input = document.getElementById('inputNomeIntegracao');
	let nome = input.value.trim();

	if (!nome) return;

	// Capitaliza e verifica acentuação
	nome = localStorageService.capitalizarNome(nome);
	nome = await NomeCorrector.processar(nome);

	if (nomesTemporarios.includes(nome)) {
		document.getElementById('erroIntegracaoNomes').textContent = 'Este nome já foi adicionado';
		document.getElementById('erroIntegracaoNomes').classList.remove('d-none');
		return;
	}

	document.getElementById('erroIntegracaoNomes').classList.add('d-none');

	nomesTemporarios.push(nome);
	input.value = '';
	input.focus();

	_renderListaTemporaria();
}

function _renderListaTemporaria() {
	const container = document.getElementById('listaNomesIntegracao');
	container.innerHTML = '';

	if (!nomesTemporarios.length) {
		container.innerHTML = `
      <div class="text-muted text-center fst-italic py-2">
        Nenhum nome adicionado
      </div>
    `;
		return;
	}

	nomesTemporarios.forEach((nome, index) => {
		const item = document.createElement('div');
		item.className =
			'd-flex justify-content-between align-items-center py-1 px-2 rounded mb-1 bg-white border';

		item.innerHTML = `
      <span class="small">
        <i class="bi bi-person me-2 text-muted"></i>${nome}
      </span>
      <button class="btn btn-sm btn-outline-danger border-0 py-0" type="button">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

		item.querySelector('button').addEventListener('click', () => {
			nomesTemporarios.splice(index, 1);
			_renderListaTemporaria();
		});

		container.appendChild(item);
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Editar Integração — adicionar nomes a local existente
// ─────────────────────────────────────────────────────────────────────────────

function abrirModalEditarIntegracao(idLocal) {
	nomesTemporarios = [];

	document.getElementById('inputNomeIntegracao').value = '';
	document.getElementById('erroIntegracaoLocal').classList.add('d-none');
	document.getElementById('erroIntegracaoNomes').classList.add('d-none');

	// Pré-seleciona e trava o local
	_preencherLocaisSelect(idLocal);
	const select = document.getElementById('selectLocalIntegracao');
	select.disabled = true;

	document.getElementById('modalIntegracaoTitulo').textContent = 'Editar Integração';
	document.getElementById('btnSalvarIntegracao').onclick = () => salvarNomesNaIntegracao(idLocal);

	_renderListaTemporaria();

	bootstrap.Modal.getOrCreateInstance(document.getElementById('modalIntegracao')).show();
}

async function salvarNomesNaIntegracao(idLocal) {
	const erroNomes = document.getElementById('erroIntegracaoNomes');
	erroNomes.classList.add('d-none');

	if (!nomesTemporarios.length) {
		erroNomes.textContent = 'Adicione pelo menos um nome';
		erroNomes.classList.remove('d-none');
		return;
	}

	const btnSalvar = document.getElementById('btnSalvarIntegracao');
	const textoOriginal = btnSalvar.innerHTML;

	try {
		_travarModal('modalIntegracao');
		btnSalvar.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Salvando...`;

		for (const nome of nomesTemporarios) {
			const r = await integracoesService.criar({ nome, id_local: idLocal }, senhaDigitada);

			if (r?.error) {
				abrirModalAviso('Erro', `Erro ao salvar "${nome}": ${r.error}`);
				return;
			}
		}

		bootstrap.Modal.getInstance(document.getElementById('modalIntegracao')).hide();

		abrirModalAviso('Sucesso', 'Nomes adicionados com sucesso');
		await carregarIntegracoes();
	} catch (err) {
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar nomes');
	} finally {
		_liberarModal('modalIntegracao');
		btnSalvar.innerHTML = textoOriginal;
		// Reabilita o select ao fechar
		document.getElementById('selectLocalIntegracao').disabled = false;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Salvar Nova Integração
// ─────────────────────────────────────────────────────────────────────────────

async function salvarIntegracao() {
	const erroLocal = document.getElementById('erroIntegracaoLocal');
	const erroNomes = document.getElementById('erroIntegracaoNomes');
	erroLocal.classList.add('d-none');
	erroNomes.classList.add('d-none');

	const localId = Number(document.getElementById('selectLocalIntegracao').value);

	if (!localId) {
		erroLocal.textContent = 'Selecione um local';
		erroLocal.classList.remove('d-none');
		return;
	}

	if (!nomesTemporarios.length) {
		erroNomes.textContent = 'Adicione pelo menos um nome';
		erroNomes.classList.remove('d-none');
		return;
	}

	const btnSalvar = document.getElementById('btnSalvarIntegracao');
	const textoOriginal = btnSalvar.innerHTML;

	_travarModal('modalIntegracao');
	btnSalvar.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Salvando...`;

	try {
		const signal = _getModalSignal('modalIntegracao');

		for (const nome of nomesTemporarios) {
			if (signal.aborted) return;

			const r = await integracoesService.criar(
				{ nome, id_local: localId },
				senhaDigitada,
				signal,
			);

			if (signal.aborted) return;

			if (r?.error) {
				abrirModalAviso('Erro', `Erro ao salvar "${nome}": ${r.error}`);
				return;
			}
		}

		if (signal.aborted) return;

		// Marcar local como tendo integração ativa
		const rLocal = await locaisService.atualizar(
			{ id: localId, integracoes: 'TRUE' },
			senhaDigitada,
			signal,
		);

		if (rLocal?.error) {
			console.warn('Aviso ao atualizar local:', rLocal.error);
		}

		bootstrap.Modal.getInstance(document.getElementById('modalIntegracao')).hide();

		abrirModalAviso('Sucesso', 'Integração criada com sucesso');
		await carregarIntegracoes();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar integração');
	} finally {
		_liberarModal('modalIntegracao');
		btnSalvar.innerHTML = textoOriginal;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Excluir nome
// ─────────────────────────────────────────────────────────────────────────────

function excluirNomeIntegracao(id, idLocal, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir';
	document.getElementById('confirmMessage').innerText =
		'Deseja realmente excluir este nome da integração?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = null;

	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await integracoesService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Erro', r.error);
				return;
			}

			const nomesAtualizados = await integracoesService.listar();
			dataStore.nomes_integracao = nomesAtualizados || [];

			const aindaTemNomes = dataStore.nomes_integracao.some(
				(n) => Number(n.id_local) === Number(idLocal),
			);

			if (!aindaTemNomes) {
				await locaisService.atualizar({ id: idLocal, integracoes: 'FALSE' }, senhaDigitada);
			}

			abrirModalAviso('Sucesso', 'Nome excluído com sucesso');
			renderizarIntegracoes(dataStore.nomes_integracao);
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Erro', 'Erro ao excluir nome');
		} finally {
			_liberarModal('confirmModal');
			btnOk.innerHTML = textoOk;
			btnTrash.innerHTML = textoTrash;
			bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
		}
	};

	new bootstrap.Modal(document.getElementById('confirmModal')).show();
}

function excluirIntegracao(idLocal, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir';
	document.getElementById('confirmMessage').innerText =
		'Deseja excluir TODOS os nomes desta integração?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = null;

	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');

		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Excluindo`;
			btnTrash.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
			btnTrash.disabled = true;

			const signal = _getModalSignal('confirmModal');

			const r = await integracoesService.excluirPorLocal(idLocal, senhaDigitada, signal);

			if (signal?.aborted) return;

			if (r?.error) {
				abrirModalAviso('Erro', r.error);
				return;
			}

			await locaisService.atualizar(
				{ id: idLocal, integracoes: 'FALSE' },
				senhaDigitada,
				signal,
			);

			abrirModalAviso('Sucesso', 'Integração excluída com sucesso');
			await carregarIntegracoes();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Erro', 'Erro ao excluir integração');
		} finally {
			_liberarModal('confirmModal');
			btnOk.innerHTML = textoOk;
			btnTrash.innerHTML = textoTrash;
			btnTrash.disabled = false;

			bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
		}
	};

	new bootstrap.Modal(document.getElementById('confirmModal')).show();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

// Delegados ao sistema central travarUI/liberarUI
function desabilitarBotoesIntegracoes() {
	travarUI();
}
function habilitarBotoesIntegracoes() {
	liberarUI();
}
