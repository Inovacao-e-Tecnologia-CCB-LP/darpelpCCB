/* =========================
   UI • LOCAIS
========================= */

// IDs dos instrumentos específicos selecionados no modal (estado temporário)
let _instrumentosEspecificosTemp = [];

async function abrirTelaLocais() {
	setTitle('Locais');
	conteudo.innerHTML = Ui.PainelLocais();
	carregarLocais((firstTime = true));
}

/* =========================
   LISTAGEM
========================= */

async function carregarLocais(firstTime = false) {
	const lista = document.getElementById('listaLocais');

	travarUI();
	try {
		mostrarLoading('listaLocais');

		let locais = firstTime ? dataStore.locais : await locaisService.listar();
		if (locais?.error) throw new Error(locais.error);

		locais = locais || [];
		dataStore.locais = locais;

		if (!locais.length) {
			lista.innerHTML = `<div class="alert alert-secondary text-center">Nenhum local cadastrado</div>`;
			return;
		}

		renderCardsLocais(locais);
	} catch (err) {
		console.error(err);
		lista.innerHTML = `<div class="alert alert-danger text-center">Erro ao carregar locais</div>`;
	} finally {
		liberarUI();
	}
}

// Retorna array de IDs dos instrumentos específicos ou null
function _parseInstrumentosPermitidos(local) {
	if (!local.instrumentos_permitidos) return null;
	try {
		const parsed =
			typeof local.instrumentos_permitidos === 'string'
				? JSON.parse(local.instrumentos_permitidos)
				: local.instrumentos_permitidos;
		return Array.isArray(parsed) && parsed.length ? parsed.map(Number) : null;
	} catch {
		return null;
	}
}

// Retorna string com nomes dos instrumentos específicos ou null
function _resumoInstrumentosEspecificos(local) {
	const ids = _parseInstrumentosPermitidos(local);
	if (!ids) return null;
	const nomes = ids
		.map((id) => {
			const inst = (dataStore.instrumentos || []).find((i) => Number(i.id) === Number(id));
			return inst ? inst.nome : null;
		})
		.filter(Boolean);
	return nomes.length ? nomes.join(', ') : null;
}

function renderTabelaLocais(locais) {
	renderCardsLocais(locais);
}

function renderCardsLocais(locais) {
	let html = `<div class="d-flex flex-column gap-3">`;

	locais.forEach((l) => {
		const resumo = _resumoInstrumentosEspecificos(l);

		const cordasIcon = l.permite_cordas
			? `<span class="permissao-chip permissao-ok"><i class="bi bi-check-lg"></i> Cordas</span>`
			: `<span class="permissao-chip permissao-no"><i class="bi bi-x-lg"></i> Cordas</span>`;
		const soprosIcon = l.permite_sopros
			? `<span class="permissao-chip permissao-ok"><i class="bi bi-check-lg"></i> Sopros</span>`
			: `<span class="permissao-chip permissao-no"><i class="bi bi-x-lg"></i> Sopros</span>`;

		const especificosHtml = resumo
			? `<div class="card-info-row">
           <i class="bi bi-music-note-list"></i>
           <span class="text-muted small text-nowrap">Específicos:</span>
           <div class="d-flex flex-wrap gap-1 ms-1">${resumo
				.split(', ')
				.map((n) => `<span class="badge-instrumento">${n}</span>`)
				.join('')}</div>
         </div>`
			: '';

		html += `
      <div class="item-card">
        <div class="item-card-header">
          <div class="item-card-titulo">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${l.nome}</span>
          </div>
          <span class="item-card-badge">Limite: ${l.limite}</span>
        </div>
        <div class="item-card-body">
          <div class="card-info-row">
            <i class="bi bi-map"></i>
            <span>${l.endereco || 'Endereço não informado'}</span>
          </div>
          <div class="card-info-row">
            <i class="bi bi-music-note-beamed"></i>
            <div class="d-flex gap-2 flex-wrap">${cordasIcon}${soprosIcon}</div>
          </div>
          ${especificosHtml}
        </div>
        <div class="item-card-actions">
          <button class="btn btn-outline-primary editar-btn" onclick="editarLocal(${l.id}, this)">
            <i class="bi bi-pencil me-1"></i>Editar
          </button>
          <button class="btn btn-outline-danger excluir-btn" onclick="excluirLocal(${l.id}, this)">
            <i class="bi bi-trash me-1"></i>Excluir
          </button>
        </div>
      </div>`;
	});

	html += `</div>`;
	document.getElementById('listaLocais').innerHTML = html;
}

/* =========================
   MODAL INSTRUMENTOS ESPECÍFICOS
========================= */

function abrirModalInstrumentosEspecificos() {
	const instrumentos = dataStore.instrumentos || [];
	const container = document.getElementById('listaInstrumentosEspecificos');
	if (!container) return;

	container.innerHTML = '';

	if (!instrumentos.length) {
		container.innerHTML = `<span class="text-muted small">Nenhum instrumento cadastrado</span>`;
	} else {
		// Agrupa por tipo para melhor visualização
		const tipos = [...new Set(instrumentos.map((i) => i.tipo))];

		tipos.forEach((tipo) => {
			const grupo = document.createElement('div');
			grupo.className = 'w-100';
			grupo.innerHTML = `<p class="fw-semibold mb-2 text-capitalize">${_formatarTipo(tipo)}</p>`;

			const linha = document.createElement('div');
			linha.className = 'd-flex flex-wrap gap-2 mb-3';

			instrumentos
				.filter((i) => i.tipo === tipo)
				.forEach((inst) => {
					const checked = _instrumentosEspecificosTemp.includes(Number(inst.id));
					const label = document.createElement('label');
					label.className = `btn btn-sm ${checked ? 'btn-dark' : 'btn-outline-dark'} instrumento-esp-btn`;
					label.style.cursor = 'pointer';
					label.innerHTML = `
          <input type="checkbox" class="d-none instrumento-esp-check"
            value="${inst.id}" ${checked ? 'checked' : ''}>
          ${inst.nome}
        `;
					label.addEventListener('click', function (e) {
						e.preventDefault();
						const cb = this.querySelector('input');
						cb.checked = !cb.checked;
						this.classList.toggle('btn-dark', cb.checked);
						this.classList.toggle('btn-outline-dark', !cb.checked);
					});
					linha.appendChild(label);
				});

			grupo.appendChild(linha);
			container.appendChild(grupo);
		});
	}

	// Abre como modal aninhado (sobre o modal do local)
	bootstrap.Modal.getOrCreateInstance(
		document.getElementById('modalInstrumentosEspecificos'),
	).show();
}

function confirmarInstrumentosEspecificos() {
	const checks = document.querySelectorAll('.instrumento-esp-check:checked');
	_instrumentosEspecificosTemp = Array.from(checks).map((c) => Number(c.value));

	_atualizarResumoInstrumentosEspecificos();

	bootstrap.Modal.getInstance(document.getElementById('modalInstrumentosEspecificos')).hide();
}

function _atualizarResumoInstrumentosEspecificos() {
	const span = document.getElementById('resumoInstrumentosEspecificos');
	if (!span) return;

	if (!_instrumentosEspecificosTemp.length) {
		span.textContent = 'Nenhum instrumento específico selecionado';
		span.className = 'text-muted small fst-italic';
		return;
	}

	const nomes = _instrumentosEspecificosTemp
		.map((id) => {
			const inst = (dataStore.instrumentos || []).find((i) => Number(i.id) === id);
			return inst ? inst.nome : null;
		})
		.filter(Boolean);

	span.textContent = nomes.join(', ');
	span.className = 'text-dark small fw-semibold';
}

/* =========================
   HELPERS — PAYLOAD
========================= */

function montarPayloadLocal() {
	const id = document.getElementById('localId').value;
	const nome = document.getElementById('localNome').value.trim();
	const limite = document.getElementById('localLimite').value;
	const endereco = document.getElementById('localEndereco').value.trim();
	const permiteCordas = document.querySelector('input[name="permiteCordas"]:checked')?.value;
	const permiteSopros = document.querySelector('input[name="permiteSopros"]:checked')?.value;

	if (
		!nome ||
		!limite ||
		!endereco ||
		permiteCordas === undefined ||
		permiteSopros === undefined
	) {
		mostrarErroCampo('erroValidacaoCamposLocal', 'Preencha todos os campos corretamente');
		return null;
	}

	const instrumentos_permitidos = _instrumentosEspecificosTemp.length
		? JSON.stringify(_instrumentosEspecificosTemp)
		: '';

	return {
		id: id ? Number(id) : null,
		nome,
		limite,
		endereco,
		permite_cordas: permiteCordas,
		permite_sopros: permiteSopros,
		instrumentos_permitidos,
	};
}

function preencherFormularioLocal(local) {
	document.getElementById('localId').value = local.id;
	document.getElementById('localNome').value = local.nome;
	document.getElementById('localLimite').value = local.limite;
	document.getElementById('localEndereco').value = local.endereco || '';

	document.querySelector(`input[name="permiteCordas"][value="${local.permite_cordas}"]`).checked =
		true;
	document.querySelector(`input[name="permiteSopros"][value="${local.permite_sopros}"]`).checked =
		true;

	// Carrega instrumentos específicos no estado temporário
	_instrumentosEspecificosTemp = _parseInstrumentosPermitidos(local) || [];
	_atualizarResumoInstrumentosEspecificos();
}

async function reloadLocais() {
	mostrarLoading('listaLocais');
	await carregarLocais();
}

/* =========================
   MODAL • NOVO / EDITAR
========================= */

function abrirModalNovoLocal() {
	limparErrosCamposLocal();
	_instrumentosEspecificosTemp = [];
	document.getElementById('modalLocalTitulo').innerText = 'Novo Local';
	limparFormularioLocal();
	_atualizarResumoInstrumentosEspecificos();
	document.getElementById('btnSalvarLocal').onclick = salvarLocal;
	new bootstrap.Modal(document.getElementById('modalLocal')).show();
}

function limparFormularioLocal() {
	document.getElementById('localId').value = '';
	document.getElementById('localNome').value = '';
	document.getElementById('localLimite').value = '';
	document.getElementById('localEndereco').value = '';
	document
		.querySelectorAll('input[name="permiteCordas"], input[name="permiteSopros"]')
		.forEach((r) => (r.checked = false));
}

/* =========================
   SALVAR
========================= */

async function salvarLocal() {
	limparErrosCamposLocal();

	const btn = document.getElementById('btnSalvarLocal');
	const textoOriginal = btn.innerHTML;
	const payload = montarPayloadLocal();

	if (!payload) return;

	_travarModal('modalLocal');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalLocal');

		let r;
		if (payload.id) {
			r = await locaisService.atualizar(payload, senhaDigitada, signal);
		} else {
			r = await locaisService.criar(payload, senhaDigitada, signal);
			// Atribui cor aleatória ao novo local imediatamente
			if (r && !r.error && r.id && typeof _getCorLocal === 'function') {
				_getCorLocal(r.id);
			}
		}

		if (signal.aborted) return;

		if (r?.error) {
			mostrarErroCampo('erroLocalNome', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalLocal')).hide();
		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Local editado com sucesso' : 'Local criado com sucesso',
		);
		await reloadLocais();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar local');
	} finally {
		_liberarModal('modalLocal');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EDITAR
========================= */

async function editarLocal(id, btn) {
	limparErrosCamposLocal();
	let salvou = false;
	const textoOriginal = btn.innerHTML;

	try {
		btn.disabled = true;
		btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

		const locais = await locaisService.listar();
		const local = (locais || []).find((l) => Number(l.id) === Number(id));

		if (!local) {
			abrirModalAviso('Erro', 'Local não encontrado');
			return;
		}

		preencherFormularioLocal(local);
		document.getElementById('modalLocalTitulo').innerText = 'Editar Local';
		document.getElementById('btnSalvarLocal').onclick = async () => {
			salvou = true;
			await salvarLocal();
		};

		const modalEl = document.getElementById('modalLocal');
		const modal = new bootstrap.Modal(modalEl);

		modalEl.addEventListener(
			'hidden.bs.modal',
			() => {
				if (!salvou) {
					btn.disabled = false;
					btn.innerHTML = textoOriginal;
				}
			},
			{ once: true },
		);

		modal.show();
	} catch (err) {
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao carregar local');
	} finally {
		btn.disabled = false;
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */

function excluirLocal(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Local';
	document.getElementById('confirmMessage').innerText = 'Deseja realmente excluir este local?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await locaisService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}

			abrirModalAviso('Sucesso', 'Local excluído com sucesso');
			await reloadLocais();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Erro', 'Erro ao excluir local');
		} finally {
			_liberarModal('confirmModal');
			btnOk.innerHTML = textoOk;
			btnTrash.innerHTML = textoTrash;
			bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
		}
	};

	new bootstrap.Modal(document.getElementById('confirmModal')).show();
}

/* =========================
   ESTADOS DE INTERFACE
========================= */

// Delegados ao sistema central travarUI/liberarUI
function desabilitarBotaoLocal() {
	travarUI();
}
function habilitarBotaoLocal() {
	liberarUI();
}

function limparErrosCamposLocal() {
	limparErroCampo('erroLocalNome');
	limparErroCampo('erroValidacaoCamposLocal');
}
