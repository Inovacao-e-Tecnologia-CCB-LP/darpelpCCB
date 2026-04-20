/* =========================
   UI • TIPOS DE VISITA
========================= */

async function abrirTelaTiposVisita() {
	setTitle('Tipos de Visita');
	conteudo.innerHTML = Ui.PainelTiposVisita();
	await carregarTiposVisita(true);
}

/* =========================
   LISTAGEM
========================= */

async function carregarTiposVisita(firstTime = false) {
	const lista = document.getElementById('listaTiposVisita');

	travarUI();
	try {
		mostrarLoading('listaTiposVisita');

		let tipos;

		if (firstTime && dataStore.tiposVisita?.length) {
			tipos = dataStore.tiposVisita;
		} else {
			tipos = await tiposVisitaService.listar();
		}

		if (tipos?.error) throw new Error(tipos.error);

		tipos = tipos || [];

		dataStore.tiposVisita = tipos;
		dataStore.tipos_visita = tipos;

		if (!tipos.length) {
			lista.innerHTML = `
				<div class="alert alert-secondary text-center">
					Nenhum tipo de visita cadastrado
				</div>`;
			return;
		}

		// Ordenação alfabética
		tipos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

		renderCardsTiposVisita(tipos);
	} catch (err) {
		console.error(err);
		lista.innerHTML = `
			<div class="alert alert-danger text-center">
				Erro ao carregar tipos de visita
			</div>`;
	} finally {
		liberarUI();
	}
}

function renderCardsTiposVisita(tipos) {
	const lista = document.getElementById('listaTiposVisita');

	const icones = {
		música: { icone: 'bi-music-note-beamed', bg: '#dbeafe', color: '#1d4ed8' },
		evangelização: { icone: 'bi-book', bg: '#dcfce7', color: '#15803d' },
	};

	function _getEstilo(nome) {
		return (
			icones[(nome || '').toLowerCase()] || {
				icone: 'bi-tag',
				bg: '#f3f4f6',
				color: '#6b7280',
			}
		);
	}

	const cards = tipos
		.map((t) => {
			const estilo = _getEstilo(t.nome);
			return `
			<div class="item-card item-card-compacto">
				<div class="item-card-body d-flex align-items-center justify-content-between gap-3">
					<div class="d-flex align-items-center gap-2">
						<div class="item-card-icon-circle" style="background:${estilo.bg}">
							<i class="bi ${estilo.icone}" style="color:${estilo.color}"></i>
						</div>
						<span class="fw-semibold">${t.nome}</span>
					</div>
					<div class="d-flex gap-2 flex-shrink-0">
						<button class="btn btn-sm btn-outline-primary editar-btn"
							onclick="editarTipoVisita(${t.id}, this)">
							<i class="bi bi-pencil"></i>
							<span class="btn-text">Editar</span>
						</button>
						<button class="btn btn-sm btn-outline-danger excluir-btn"
							onclick="excluirTipoVisita(${t.id}, this)">
							<i class="bi bi-trash"></i>
							<span class="btn-text">Excluir</span>
						</button>
					</div>
				</div>
			</div>`;
		})
		.join('');

	lista.innerHTML = `<div class="d-flex flex-column gap-2">${cards}</div>`;
}

async function reloadTiposVisita() {
	mostrarLoading('listaTiposVisita');
	await carregarTiposVisita();
}

/* =========================
   HELPERS DE FORMULÁRIO
========================= */

function montarPayloadTipoVisita() {
	const id = document.getElementById('tipoVisitaId').value;
	const nome = document.getElementById('tipoVisitaNome').value.trim();

	if (!nome) {
		mostrarErroCampo('erroValidacaoCamposTipoVisita', 'Preencha o nome do tipo de visita');
		return null;
	}

	return { id: id ? Number(id) : null, nome };
}

function preencherFormularioTipoVisita(tipo) {
	document.getElementById('tipoVisitaId').value = tipo.id ?? '';
	document.getElementById('tipoVisitaNome').value = tipo.nome ?? '';
}

function limparFormularioTipoVisita() {
	document.getElementById('tipoVisitaId').value = '';
	document.getElementById('tipoVisitaNome').value = '';
	limparErroCampo('erroValidacaoCamposTipoVisita');
}

/* =========================
   MODAL • NOVO
========================= */

function abrirModalNovoTipoVisita() {
	limparFormularioTipoVisita();
	document.getElementById('modalTipoVisitaTitulo').innerText = 'Novo Tipo de Visita';
	document.getElementById('btnSalvarTipoVisita').onclick = salvarTipoVisita;
	new bootstrap.Modal(document.getElementById('modalTipoVisita')).show();
}

/* =========================
   SALVAR
========================= */

async function salvarTipoVisita() {
	limparErroCampo('erroValidacaoCamposTipoVisita');

	const btn = document.getElementById('btnSalvarTipoVisita');
	const textoOriginal = btn.innerHTML;

	const payload = montarPayloadTipoVisita();
	if (!payload) return;

	_travarModal('modalTipoVisita');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalTipoVisita');

		const r = payload.id
			? await tiposVisitaService.atualizar(payload, senhaDigitada, signal)
			: await tiposVisitaService.criar(payload, senhaDigitada, signal);

		if (signal.aborted) return;

		if (r?.error) {
			mostrarErroCampo('erroValidacaoCamposTipoVisita', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalTipoVisita')).hide();
		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Tipo de visita editado com sucesso' : 'Tipo de visita criado com sucesso',
		);
		await reloadTiposVisita();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar tipo de visita');
	} finally {
		_liberarModal('modalTipoVisita');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EDITAR
========================= */

async function editarTipoVisita(id, btnEditar) {
	limparErroCampo('erroValidacaoCamposTipoVisita');

	const textoOriginal = btnEditar.innerHTML;
	btnEditar.disabled = true;
	btnEditar.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

	try {
		const tipos = await tiposVisitaService.listar();
		const tipo = (tipos || []).find((t) => Number(t.id) === Number(id));

		if (!tipo) {
			abrirModalAviso('Erro', 'Tipo de visita não encontrado');
			return;
		}

		preencherFormularioTipoVisita(tipo);
		document.getElementById('modalTipoVisitaTitulo').innerText = 'Editar Tipo de Visita';
		document.getElementById('btnSalvarTipoVisita').onclick = salvarTipoVisita;
		new bootstrap.Modal(document.getElementById('modalTipoVisita')).show();
	} catch (err) {
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao carregar tipo de visita');
	} finally {
		btnEditar.disabled = false;
		btnEditar.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */

function excluirTipoVisita(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Tipo de Visita';
	document.getElementById('confirmMessage').innerText =
		'Deseja realmente excluir este tipo de visita?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = null;

	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await tiposVisitaService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}

			abrirModalAviso('Sucesso', 'Tipo de visita excluído com sucesso');
			await reloadTiposVisita();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Erro', 'Erro ao excluir tipo de visita');
		} finally {
			_liberarModal('confirmModal');
			btnOk.innerHTML = textoOk;
			btnTrash.innerHTML = textoTrash;
			bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
		}
	};

	new bootstrap.Modal(document.getElementById('confirmModal')).show();
}
