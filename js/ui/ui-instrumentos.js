/* =========================
   UI • INSTRUMENTOS
========================= */

function abrirTelaInstrumentos() {
	setTitle('Instrumentos');
	conteudo.innerHTML = Ui.PainelInstrumentos();
	carregarInstrumentos((firstTime = true));
}

/* =========================
   LISTAGEM
========================= */

async function carregarInstrumentos(firstTime = false) {
	const lista = document.getElementById('listaInstrumentos');

	travarUI();
	try {
		mostrarLoading('listaInstrumentos');

		let instrumentos = firstTime ? dataStore.instrumentos : await instrumentosService.listar();

		if (instrumentos?.error) {
			throw new Error(instrumentos.error);
		}

		instrumentos = instrumentos || [];
		dataStore.instrumentos = instrumentos;

		if (!instrumentos.length) {
			lista.innerHTML = `
        <div class="alert alert-secondary text-center">
          Nenhum instrumento cadastrado
        </div>
      `;
			return;
		}

		// ORDENAÇÃO: tipo → alfabética
		instrumentos.sort((a, b) => {
			if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo, 'pt-BR');
			return a.nome.localeCompare(b.nome, 'pt-BR');
		});

		renderCardsInstrumentos(instrumentos);
	} catch (err) {
		console.error(err);
		lista.innerHTML = `
      <div class="alert alert-danger text-center">
        Erro ao carregar instrumentos
      </div>
    `;
	} finally {
		liberarUI();
	}
}

/* Paleta de cores para tipos dinâmicos */
const _tipoCores = [
	'bg-primary',
	'bg-success',
	'bg-warning text-dark',
	'bg-danger',
	'bg-info text-dark',
	'bg-secondary',
];
const _tipoCorMap = { corda: 'bg-primary', sopro: 'bg-success' };
let _tipoCorIdx = 2; // começa após corda/sopro

function _getCorTipo(tipo) {
	const chave = (tipo || '').toLowerCase();
	if (!_tipoCorMap[chave]) {
		_tipoCorMap[chave] = _tipoCores[_tipoCorIdx % _tipoCores.length];
		_tipoCorIdx++;
	}
	return _tipoCorMap[chave];
}

function _formatarTipo(tipo) {
	if (!tipo) return '';

	const chave = tipo.toLowerCase();

	// Casos especiais
	if (chave === 'corda') return 'Cordas';
	if (chave === 'sopro') return 'Sopros';

	// Padrão normal
	return chave.charAt(0).toUpperCase() + chave.slice(1);
}

function _getIconeTipo(tipo) {
	const chave = (tipo || '').toLowerCase();

	const mapa = {
		corda: 'bi-music-note-beamed',
		sopro: 'bi-wind',
		teclas: 'bi-keyboard',
		outros: 'bi-music-note',
	};

	return mapa[chave] || 'bi-music-note';
}

function _getEstiloIconeTipo(tipo) {
	const chave = (tipo || '').toLowerCase();

	const mapa = {
		corda: { bg: '#dbeafe', color: '#1d4ed8' }, // azul
		sopro: { bg: '#dcfce7', color: '#15803d' }, // verde
		teclas: { bg: '#ede9fe', color: '#6d28d9' }, // amarelo
	};

	return mapa[chave] || { bg: '#f3f4f6', color: '#6b7280' };
}

function renderTabelaInstrumentos(instrumentos) {
	renderCardsInstrumentos(instrumentos);
}

function renderCardsInstrumentos(instrumentos) {
	const lista = document.getElementById('listaInstrumentos');

	// Agrupar por tipo para seções visuais
	const grupos = {};
	instrumentos.forEach((i) => {
		const tipo = (i.tipo || 'outros').toLowerCase();
		if (!grupos[tipo]) grupos[tipo] = [];
		grupos[tipo].push(i);
	});

	let html = '';

	Object.entries(grupos).forEach(([tipo, itens]) => {
		const tipoLabel = _formatarTipo(tipo);
		const iconeGrupo = _getIconeTipo(tipo);
		const estilo = _getEstiloIconeTipo(tipo);

		html += `
      <div class="grupo-secao">
        <div class="grupo-secao-header">
          <i class="bi ${iconeGrupo}"></i>
          <span>${tipoLabel}</span>
          <span class="grupo-secao-count">Total: ${itens.length}</span>
        </div>
        <div class="d-flex flex-column gap-2">`;

		itens.forEach((i) => {
			html += `
          <div class="item-card item-card-compacto">
            <div class="item-card-body d-flex align-items-center justify-content-between gap-3">
              <div class="d-flex align-items-center gap-2">
                <div class="item-card-icon-circle" style="background:${estilo.bg}">
                  <i class="bi ${_getIconeTipo(tipo)}" style="color:${estilo.color}"></i>
                </div>
                <span class="fw-semibold">${i.nome}</span>
              </div>
              <div class="d-flex gap-2 flex-shrink-0">
                <button class="btn btn-sm btn-outline-dark editar-btn" onclick="editarInstrumento(${i.id}, this)">
                  <i class="bi bi-pencil"></i>
				  <span class="btn-text">Editar</span>
                </button>
                <button class="btn btn-sm btn-outline-danger excluir-btn" onclick="excluirInstrumento(${i.id}, this)">
                  <i class="bi bi-trash"></i>
				  <span class="btn-text">Excluir</span>
                </button>
              </div>
            </div>
          </div>`;
		});

		html += `</div></div>`;
	});

	lista.innerHTML = `<div class="d-flex flex-column gap-4">${html}</div>`;
}

async function reloadInstrumentos() {
	mostrarLoading('listaInstrumentos');
	carregarInstrumentos();
}

/* =========================
   TIPOS DINÂMICOS
========================= */

function _getTiposDisponiveis() {
	const instrumentos = dataStore.instrumentos || [];
	const tiposDados = [
		...new Set(instrumentos.map((i) => (i.tipo || '').toLowerCase()).filter(Boolean)),
	];
	const padrao = ['corda', 'sopro'];
	const extras = tiposDados.filter((t) => !padrao.includes(t)).sort();
	return [...padrao, ...extras];
}

function _renderTiposRadio(tipoSelecionado = '') {
	const container = document.getElementById('instrumentoTipoRadios');
	if (!container) return;

	const tipos = _getTiposDisponiveis();
	const sel = (tipoSelecionado || '').toLowerCase();

	// Se tipoSelecionado não está na lista, adiciona
	if (sel && !tipos.includes(sel)) tipos.push(sel);

	container.innerHTML = tipos
		.map((tipo) => {
			const id = `tipoRadio_${tipo}`;
			const checked = tipo === sel ? 'checked' : '';
			return `
      <div class="form-check d-flex align-items-center gap-1 me-3">
        <input class="form-check-input mt-0" type="radio"
          name="instrumentoTipo" id="${id}" value="${tipo}" ${checked}>
        <label class="form-check-label" for="${id}">${_formatarTipo(tipo)}</label>
      </div>
    `;
		})
		.join('');
}

function toggleNovoTipo() {
	const container = document.getElementById('novoTipoContainer');
	const btn = document.getElementById('btnNovoTipo');
	container.classList.remove('d-none');
	btn.classList.add('d-none');
	const input = document.getElementById('inputNovoTipo');
	if (input) {
		input.value = '';
		input.focus();
	}
	limparErroCampo('erroNovoTipo');
}

function cancelarNovoTipo() {
	document.getElementById('novoTipoContainer')?.classList.add('d-none');
	document.getElementById('btnNovoTipo')?.classList.remove('d-none');
	limparErroCampo('erroNovoTipo');
}

function confirmarNovoTipo() {
	const input = document.getElementById('inputNovoTipo');
	const valor = (input?.value || '').trim().toLowerCase();

	if (!valor) {
		mostrarErroCampo('erroNovoTipo', 'Digite um nome para o tipo');
		return;
	}

	const tiposExistentes = _getTiposDisponiveis();
	if (tiposExistentes.includes(valor)) {
		mostrarErroCampo('erroNovoTipo', 'Este tipo já existe');
		return;
	}

	// Re-renderiza com o novo tipo e o seleciona
	_renderTiposRadio(valor);
	cancelarNovoTipo();
}

/* =========================
   HELPERS DE FORMULÁRIO
========================= */

function montarPayloadInstrumento() {
	const id = document.getElementById('instrumentoId').value;
	const nome = document.getElementById('instrumentoNome').value.trim();
	const tipo = document.querySelector('input[name="instrumentoTipo"]:checked')?.value;

	if (!nome || !tipo) {
		mostrarErroCampo('erroValidacaoCamposInstrumento', 'Preencha todos os campos corretamente');
		return null;
	}

	return { id: id ? Number(id) : null, nome, tipo };
}

function preencherFormularioInstrumento(instrumento) {
	document.getElementById('instrumentoId').value = instrumento.id ?? '';
	document.getElementById('instrumentoNome').value = instrumento.nome ?? '';
	_renderTiposRadio(instrumento.tipo || '');
	cancelarNovoTipo();
}

function limparFormularioInstrumento() {
	document.getElementById('instrumentoId').value = '';
	document.getElementById('instrumentoNome').value = '';
	_renderTiposRadio();
	cancelarNovoTipo();
}

/* =========================
   MODAL • NOVO
========================= */

function abrirModalNovoInstrumento() {
	limparErrosCamposInstrumento();
	limparFormularioInstrumento();

	document.getElementById('modalInstrumentoTitulo').innerText = 'Novo Instrumento';
	document.getElementById('btnSalvarInstrumento').onclick = salvarInstrumento;

	new bootstrap.Modal(document.getElementById('modalInstrumento')).show();
}

/* =========================
   SALVAR
========================= */

async function salvarInstrumento() {
	limparErrosCamposInstrumento();

	const btn = document.getElementById('btnSalvarInstrumento');
	const textoOriginal = btn.innerHTML;

	const payload = montarPayloadInstrumento();
	if (!payload) return;

	_travarModal('modalInstrumento');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalInstrumento');

		const r = payload.id
			? await instrumentosService.atualizar(payload, senhaDigitada, signal)
			: await instrumentosService.criar(payload, senhaDigitada, signal);

		if (signal.aborted) return;

		if (r?.error) {
			limparErrosCamposInstrumento();
			mostrarErroCampo('erroInstrumentoNome', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalInstrumento')).hide();

		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Instrumento editado com sucesso' : 'Instrumento criado com sucesso',
		);

		await reloadInstrumentos();
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar instrumento');
	} finally {
		_liberarModal('modalInstrumento');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EDITAR
   BUG FIX: removido travarUI/liberarUI daqui.
   O botão editar fica desabilitado apenas enquanto
   carrega os dados. A trava da UI global não é usada
   para não interferir no contador _uiLockDepth.
========================= */

async function editarInstrumento(id, btnEditar) {
	limparErrosCamposInstrumento();

	const textoOriginal = btnEditar.innerHTML;
	btnEditar.disabled = true;
	btnEditar.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

	try {
		const instrumentos = await instrumentosService.listar();
		const instrumento = (instrumentos || []).find((i) => Number(i.id) === Number(id));

		if (!instrumento) {
			abrirModalAviso('Erro', 'Instrumento não encontrado');
			return;
		}

		preencherFormularioInstrumento(instrumento);
		document.getElementById('modalInstrumentoTitulo').innerText = 'Editar Instrumento';
		document.getElementById('btnSalvarInstrumento').onclick = salvarInstrumento;

		new bootstrap.Modal(document.getElementById('modalInstrumento')).show();
	} catch (err) {
		console.error(err);
		abrirModalAviso('Erro', 'Erro ao carregar instrumento');
	} finally {
		btnEditar.disabled = false;
		btnEditar.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */

function excluirInstrumento(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Instrumento';
	document.getElementById('confirmMessage').innerText =
		'Deseja realmente excluir este instrumento?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = null;

	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;

		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;

			const signal = _getModalSignal('confirmModal');
			const r = await instrumentosService.excluir(id, senhaDigitada, signal);

			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}

			abrirModalAviso('Sucesso', 'Instrumento excluído com sucesso');
			await reloadInstrumentos();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.error(err);
			abrirModalAviso('Não foi possível excluir', err.message);
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

// Mantidos para compatibilidade com ui-locais.js (filtro de tipos)
function desabilitarBotaoInstrumentos() {
	travarUI();
}
function habilitarBotaoInstrumentos() {
	liberarUI();
}

function limparErrosCamposInstrumento() {
	limparErroCampo('erroInstrumentoNome');
	limparErroCampo('erroValidacaoCamposInstrumento');
}
