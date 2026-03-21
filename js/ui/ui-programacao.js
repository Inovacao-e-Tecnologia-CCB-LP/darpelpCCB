/* =========================
   UI • PROGRAMAÇÃO
========================= */

let _calMeses = [];
let _calIdx = 0;
let _calDados = [];
let _calModoSomenteLeitura = false;

/* =========================
   PALETA DE CORES DO CALENDÁRIO
   OBS: Hospital recebe uma cor fixa
========================= */
const _COR_HOSPITAL = {
	bg: '#ffd6d6' /* fundo célula calendário — vermelho bem claro   */,
	border: '#8b0000' /* borda/dot — vermelho sangue escuro              */,
	dot: '#8b0000' /* bolinha da legenda                              */,
	text: '#5c0000' /* texto nos cards de detalhe                     */,
	bgCard: '#ffe4e4' /* fundo card de detalhe — rosinha suave           */,
};

const _CAL_PALETA = [
	{
		bg: '#fde8e8',
		border: '#c0392b',
		dot: '#c0392b',
		text: '#7b241c',
		bgCard: '#fff0f0',
	},
	{
		bg: '#d6eaf8',
		border: '#1a5276',
		dot: '#1a5276',
		text: '#0d2b3e',
		bgCard: '#eaf4fb',
	},
	{
		bg: '#d5f5e3',
		border: '#1e8449',
		dot: '#1e8449',
		text: '#145a32',
		bgCard: '#eafaf1',
	},
	{
		bg: '#f9e4b7',
		border: '#b7770d',
		dot: '#b7770d',
		text: '#784212',
		bgCard: '#fef9ec',
	},
	{
		bg: '#e8daef',
		border: '#6c3483',
		dot: '#6c3483',
		text: '#4a235a',
		bgCard: '#f5eef8',
	},
	{
		bg: '#d1f2eb',
		border: '#148f77',
		dot: '#148f77',
		text: '#0e6655',
		bgCard: '#e8f8f5',
	},
	{
		bg: '#fce4ec',
		border: '#ad1457',
		dot: '#ad1457',
		text: '#880e4f',
		bgCard: '#fce4ec',
	},
	{
		bg: '#fff3e0',
		border: '#e65100',
		dot: '#e65100',
		text: '#bf360c',
		bgCard: '#fff8f0',
	},
	{
		bg: '#e8eaf6',
		border: '#283593',
		dot: '#283593',
		text: '#1a237e',
		bgCard: '#ede7f6',
	},
	{
		bg: '#fbe9e7',
		border: '#bf360c',
		dot: '#bf360c',
		text: '#8d1c06',
		bgCard: '#fbe9e7',
	},
	{
		bg: '#e0f2f1',
		border: '#00695c',
		dot: '#00695c',
		text: '#004d40',
		bgCard: '#e0f7f4',
	},
	{
		bg: '#fff8e1',
		border: '#f57f17',
		dot: '#f57f17',
		text: '#e65100',
		bgCard: '#fff8e1',
	},
];

let _calCoresLocais = {};

function _carregarCoresSalvas() {
	try {
		const raw = localStorage.getItem('darpe_cores_locais');
		if (raw) _calCoresLocais = JSON.parse(raw);
	} catch {
		_calCoresLocais = {};
	}
}

function _salvarCores() {
	try {
		localStorage.setItem('darpe_cores_locais', JSON.stringify(_calCoresLocais));
	} catch {}
}

function _getCorLocal(localId) {
	const key = String(localId);

	// Força vermelho sangue em qualquer local cujo nome contenha "hospital"
	const localObj = (dataStore.locais || []).find((l) => String(l.id) === key);
	const nomeLocal = (localObj?.nome || '').toLowerCase();
	if (nomeLocal.includes('hospital')) {
		_calCoresLocais[key] = { ..._COR_HOSPITAL };
		_salvarCores();
		return _calCoresLocais[key];
	}

	if (!_calCoresLocais[key]) {
		const usadas = new Set(Object.values(_calCoresLocais).map((c) => c.dot));
		const livres = _CAL_PALETA.filter((c) => !usadas.has(c.dot));
		const fonte = livres.length ? livres : _CAL_PALETA;
		_calCoresLocais[key] = {
			...fonte[Math.floor(Math.random() * fonte.length)],
		};
		_salvarCores();
	}
	return _calCoresLocais[key];
}

/* =========================
   ABRIR TELA PROGRAMAÇÕES
========================= */
async function abrirTelaProgramacoes() {
	_calModoSomenteLeitura = false;
	setTitle('Programações');
	conteudo.innerHTML = Ui.PainelProgramacoes();
	carregarProgramacoes(true);
}

async function abrirTelaCalendarioPublico() {
	setTitle('Calendário');
	conteudo.innerHTML = Ui.PainelProgramacoes();
	_calModoSomenteLeitura = true;
	await carregarProgramacoes(true);
	const btnNova = document.getElementById('novaProgramacaoBtn'); // Esconde botão Nova Programação
	if (btnNova) btnNova.remove();
}

/* =========================
   LISTAGEM
========================= */
async function carregarProgramacoes(firstTime = false) {
	travarUI();
	try {
		mostrarLoading('listaProgramacoes');

		let programacao = firstTime ? dataStore.programacao : await programacaoService.listar();

		if (programacao?.error) throw new Error(programacao.error);

		programacao = programacao || [];
		dataStore.programacao = programacao;
		_calDados = programacao;

		if (!programacao.length) {
			document.getElementById('listaProgramacoes').innerHTML = `
        <div class="alert alert-secondary text-center mt-3">
          Nenhuma programação cadastrada
        </div>`;
			return;
		}

		_carregarCoresSalvas();
		// Garante que todos os locais conhecidos tenham cor atribuída
		(dataStore.locais || []).forEach((l) => _getCorLocal(l.id));
		programacao.forEach((p) => _getCorLocal(p.local_id));

		_construirMeses(programacao);
		_calIdx = 0;
		_renderCalendario();
	} catch (err) {
		console.error(err);
		document.getElementById('listaProgramacoes').innerHTML = `
      <div class="alert alert-danger text-center mt-3">
        Erro ao carregar programações
      </div>`;
	} finally {
		liberarUI();
	}
}

function _construirMeses(programacao) {
	const map = new Map();
	programacao.forEach((p) => {
		if (!p.data) return;
		const d = _parseDataProgramacao(p.data);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		if (!map.has(key)) map.set(key, { ano: d.getFullYear(), mes: d.getMonth() });
	});
	_calMeses = Array.from(map.values()).sort((a, b) =>
		a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes,
	);
}

/* =========================
    RENDERS
========================= */
function _renderCalendario() {
	const container = document.getElementById('listaProgramacoes');
	if (!_calMeses.length) return;

	const { ano, mes } = _calMeses[_calIdx];
	const temAnterior = _calIdx > 0;
	const temProximo = _calIdx < _calMeses.length - 1;

	const pgMes = _calDados.filter((p) => _eventoEhDoMes(p, ano, mes));

	const porDia = {};
	pgMes.forEach((p) => {
		const dia = parseInt(p.data.split('-')[2], 10);
		if (!porDia[dia]) porDia[dia] = [];
		porDia[dia].push(p);
	});

	const nomeMes = new Date(ano, mes, 1).toLocaleDateString('pt-BR', {
		month: 'long',
		year: 'numeric',
	});

	container.innerHTML = `
    <div class="cal-wrapper">

      <div class="cal-nav">
        <button class="cal-nav-btn" ${!temAnterior ? 'disabled' : ''} onclick="_calNavegar(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <div class="cal-mes-titulo">
          <span class="cal-mes-nome">${_capitalizar(nomeMes)}</span>
          <span class="cal-mes-badge">${pgMes.length} evento${pgMes.length !== 1 ? 's' : ''}</span>
        </div>
        <button class="cal-nav-btn" ${!temProximo ? 'disabled' : ''} onclick="_calNavegar(1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      ${_renderMiniNav()}

      <div class="cal-grid-wrapper" id="calGridWrapper">
        ${_renderGrade(ano, mes, porDia)}
      </div>

      ${_renderLegenda()}

      ${_calModoSomenteLeitura ? _renderAcoesPublico() : ''}

    </div>
  `;
}

function _renderGrade(ano, mes, porDia) {
	const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
	const primeiroDia = new Date(ano, mes, 1).getDay();
	const totalDias = new Date(ano, mes + 1, 0).getDate();
	const hoje = new Date();
	const ehHoje = (d) =>
		hoje.getFullYear() === ano && hoje.getMonth() === mes && hoje.getDate() === d;

	let html = `<div class="cal-grid">`;

	diasSemana.forEach((d, i) => {
		const fds = i === 0 || i === 6 ? 'cal-fds' : '';
		html += `<div class="cal-header-dia ${fds}">${d}</div>`;
	});

	for (let i = 0; i < primeiroDia; i++) {
		html += `<div class="cal-cell cal-vazia"></div>`;
	}

	for (let dia = 1; dia <= totalDias; dia++) {
		const eventos = porDia[dia] || [];
		const temEvento = eventos.length > 0;
		const diaSemana = (primeiroDia + dia - 1) % 7;
		const fds = diaSemana === 0 || diaSemana === 6 ? 'cal-fds' : '';
		const hojeClass = ehHoje(dia) ? 'cal-hoje' : '';
		let cursor = '';

		if (temEvento) {
			cursor = 'cal-clicavel';
		} else if (!_calModoSomenteLeitura) {
			cursor = 'cal-clicavel';
		}

		// Cor da célula: cor do primeiro local do dia;
		// se tiver múltiplos locais distintos, fundo neutro
		let estiloCelula = '';
		if (temEvento) {
			const locaisUnicos = [...new Set(eventos.map((e) => e.local_id))];
			if (locaisUnicos.length === 1) {
				const cor = _getCorLocal(locaisUnicos[0]);
				estiloCelula = `background:${cor.bg}; border-color:${cor.border};`;
			} else {
				estiloCelula = `background:#f8f9fa; border-color:#6c757d;`;
			}
		}

		// Pílulas: bolinhas no mobile, barras com nome no desktop
		let pilulasHtml = '';

		if (temEvento) {
			const MAX = 3;

			eventos.slice(0, MAX).forEach((ev) => {
				const cor = _getCorLocal(ev.local_id);
				const local = _getLocalById(ev.local_id);
				const nome = local?.nome || 'Local';
				const horario = formatarHorario(ev.horario) || '-';
				const tipo = ev.tipo_visita || '-';

				if (_calModoSomenteLeitura) {
					// Público
					pilulasHtml += `
    <div class="cal-ev-publico-wrapper">
      <span class="cal-ev-pill"
        style="background:${cor.dot}">
      </span>

      <div class="cal-ev-publico">
        <div class="cal-ev-nome">${nome}</div>
        <div class="cal-ev-info">
          ${horario} • ${tipo}
        </div>
      </div>
    </div>
  `;
				} else {
					// Admin
					pilulasHtml += `
        <span class="cal-ev-pill"
          style="background:${cor.dot}"
          data-nome="${nome}">
        </span>
      `;
				}
			});

			if (eventos.length > MAX) {
				pilulasHtml += `<span class="cal-ev-mais">+${eventos.length - MAX}</span>`;
			}
		}

		const enc = encodeURIComponent(JSON.stringify(eventos));
		let click = '';

		if (temEvento) {
			click = `onclick="_abrirDetalhesDia(${dia}, decodeURIComponent('${enc}'))"`;
		} else if (!_calModoSomenteLeitura) {
			click = `onclick="_novaProgramacaoDoCalendario(${dia})"`;
		}

		html += `
      <div class="cal-cell ${fds} ${hojeClass} ${temEvento ? 'cal-tem-evento' : ''} ${cursor}"
        style="${estiloCelula}" ${click}>
        <span class="cal-num">${dia}</span>
        <div class="cal-ev-pills">${pilulasHtml}</div>
      </div>`;
	}

	html += `</div>`;
	return html;
}

function _renderLegenda() {
	// Pega apenas os locais que têm programação no mês atual
	const { ano, mes } = _calMeses[_calIdx];
	const locaisNoMes = new Set(
		_calDados.filter((p) => _eventoEhDoMes(p, ano, mes)).map((p) => p.local_id),
	);

	if (!locaisNoMes.size) return '';

	const items = Array.from(locaisNoMes)
		.map((localId) => {
			const local = _getLocalById(localId);
			const cor = _getCorLocal(localId);
			const nome = local?.nome || `Local ${localId}`;
			return `<span class="cal-leg-item">
      <span class="cal-leg-dot" style="background:${cor.dot}"></span>${nome}
    </span>`;
		})
		.join('');

	return `<div class="cal-legenda">${items}</div>`;
}

function _renderMiniNav() {
	if (_calMeses.length <= 1) return '';
	const pills = _calMeses
		.map((m, i) => {
			const nome = new Date(m.ano, m.mes, 1).toLocaleDateString('pt-BR', {
				month: 'short',
			});
			const ativo = i === _calIdx ? 'cal-pill-ativo' : '';
			return `<button class="cal-pill ${ativo}" onclick="_calIrPara(${i})">${_capitalizar(nome)}</button>`;
		})
		.join('');
	return `<div class="cal-pills">${pills}</div>`;
}

function _renderAcoesPublico() {
	return `
    <div class="mt-4 cal-acoes-publico no-print">
      <div class="d-flex flex-column flex-md-row gap-2 justify-content-md-end">

        <button class="btn btn-primary w-100 w-md-auto"
          onclick="_baixarImagemCalendario()">
          <i class="bi bi-image me-1"></i>
          Gerar imagem
        </button>

        <button class="btn btn-secondary w-100 w-md-auto"
          onclick="_baixarPdfCalendario()">
          <i class="bi bi-file-earmark-pdf me-1"></i>
          Gerar PDF
        </button>

        <button class="btn btn-success w-100 w-md-auto"
          onclick="_compartilharWhatsapp()">
          <i class="bi bi-whatsapp me-1"></i>
          Compartilhar
        </button>

      </div>
    </div>
  `;
}

/* =========================
    NAVEGAÇÃO
========================= */
function _calNavegar(delta) {
	const novo = _calIdx + delta;
	if (novo < 0 || novo >= _calMeses.length) return;
	_calIdx = novo;
	_renderCalendario();
	_animarCalendario(delta);
}

function _calIrPara(idx) {
	if (idx === _calIdx) return;
	const delta = idx > _calIdx ? 1 : -1;
	_calIdx = idx;
	_renderCalendario();
	_animarCalendario(delta);
}

/* =========================
   AÇÕES NO CALENDÁRIO
========================= */
function _novaProgramacaoDoCalendario(dia) {
	const { ano, mes } = _calMeses[_calIdx];

	// Monta data no formato yyyy-MM-dd
	const dataSelecionada = new Date(ano, mes, dia);
	const dataStr = dataSelecionada.toISOString().split('T')[0];

	_abrirModalProgramacao(); // abre como NOVO

	// Pequeno delay para garantir que modal já abriu
	setTimeout(() => {
		const inputData = document.getElementById('progData');
		inputData.value = dataStr;
		_atualizarDiaSemanaProgramacao();
	}, 50);
}

function _editarDoCalendario(id) {
	const p = _calDados.find((x) => Number(x.id) === Number(id));
	if (!p) return;

	_fecharModalEExecutar('modalCalDetalhe', () => {
		_abrirModalProgramacao(p);
	});
}

function _excluirDoCalendario(id, btn) {
	_fecharModalEExecutar('modalCalDetalhe', () => {
		excluirProgramacao(id, btn);
	});
}

function _abrirDetalhesDia(dia, eventosJson) {
	const eventos = JSON.parse(eventosJson);
	const { ano, mes } = _calMeses[_calIdx];

	const dataFmt = new Date(ano, mes, dia).toLocaleDateString('pt-BR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	const cards = eventos
		.map((p) => {
			const local = _getLocalById(p.local_id);
			const dataProg = new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
			const tipo = p.tipo_visita || '-';
			const tipoIcon = p.tipo_visita?.toLowerCase().includes('mús')
				? 'music-note-beamed'
				: 'book';
			const cor = _getCorLocal(p.local_id);

			return `
      <div class="cal-det-card" style="background:${cor.bgCard}; border:1.5px solid ${cor.border};">
        <div class="cal-det-tipo" style="color:${cor.text}; border-bottom:1px solid ${cor.border}55;">
          <span class="cal-det-local-dot" style="background:${cor.dot}"></span>
          <strong>${local?.nome || 'Local não identificado'}</strong>
        </div>
        <div class="cal-det-infos">
          <div class="cal-det-row">
            <p class="cal-link-mapa copy-text mb-0"
              data-localid="${p.local_id}"
              title="Copiar endereço e abrir mapa"
              style="cursor:pointer;">
              <i class="bi bi-geo-alt-fill me-1" style="color:${cor.dot}"></i>
              ${local?.endereco ?? 'Endereço não informado'}
              </p>
          </div>
          <div class="cal-det-row">
            <i class="bi bi-clock-fill" style="color:${cor.dot}"></i>
            <span>${formatarHorario(p.horario) || '-'}</span>
          </div>
          <div class="cal-det-row">
            <i class="bi bi-${tipoIcon}" style="color:${cor.dot}"></i>
            <span>${tipo}</span>
        </div>
      </div>
      ${
			!_calModoSomenteLeitura
				? `
        <button class="btn btn-outline-primary btn-sm w-100 mt-2"
          onclick="_editarDoCalendario(${p.id})">
          <i class="bi bi-pencil me-1"></i>Editar
        </button>
        <button class="btn btn-outline-danger btn-sm w-100 mt-3"
          onclick="_excluirDoCalendario(${p.id}, this)">
          <i class="bi bi-trash me-1"></i>Excluir
        </button>`
				: ''
		}
      </div>`;
		})
		.join('');

	const botaoNovo = !_calModoSomenteLeitura
		? `
  <div class="text-center mt-3">
    <button class="btn btn-dark btn-sm w-100 mt-2"
      onclick="_novaProgramacaoDoDetalhe(${dia})">
      <i class="bi bi-plus-circle"></i>
      Nova Programação
    </button>
  </div>`
		: '';

	const eventosHtml = cards + botaoNovo;

	document.getElementById('calDetData').innerHTML = `${_capitalizar(dataFmt)}`;
	document.getElementById('calDetBody').innerHTML = eventosHtml;

	const modal = new bootstrap.Modal(document.getElementById('modalCalDetalhe'));

	modal.show();

	document.querySelectorAll('.cal-link-mapa').forEach((el) => {
		el.addEventListener('click', function () {
			const localId = this.dataset.localid;
			const localObj = _getLocalById(localId);

			if (localObj?.endereco) {
				navigator.clipboard.writeText(localObj.endereco);
			}

			abrirModalMapa(localId);
		});
	});

	setTimeout(() => {
		document.activeElement?.blur();
	}, 100);
}

function _novaProgramacaoDoDetalhe(dia) {
	_fecharModalEExecutar('modalCalDetalhe', () => {
		_novaProgramacaoDoCalendario(dia);
	});
}

async function _baixarImagemCalendario() {
	const elemento = document.querySelector('.cal-wrapper');

	elemento.classList.add('exportando');

	const canvas = await _capturarCalendario();

	elemento.classList.remove('exportando');

	const link = document.createElement('a');
	link.download = 'calendarioMensalDARPE.png';
	link.href = canvas.toDataURL('image/png');
	link.click();
}

async function _baixarPdfCalendario() {
	const elemento = document.querySelector('.cal-wrapper');

	elemento.classList.add('exportando');

	const canvas = await _capturarCalendario();

	elemento.classList.remove('exportando');

	const imgData = canvas.toDataURL('image/png');

	const { jsPDF } = window.jspdf;
	const pdf = new jsPDF('p', 'mm', 'a4');

	const largura = 210;
	const altura = (canvas.height * largura) / canvas.width;

	pdf.addImage(imgData, 'PNG', 0, 10, largura, altura);
	pdf.save('calendarioMensalDARPE.pdf');
}

function _compartilharWhatsapp() {
	if (!_calMeses.length) return;

	const { ano, mes } = _calMeses[_calIdx];

	const nomeMes = new Date(ano, mes, 1).toLocaleDateString('pt-BR', {
		month: 'long',
		year: 'numeric',
	});

	const mensagem = `Calendário DARPE(Lençóis Paulista) - ${_capitalizar(nomeMes)}`;

	const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

	window.open(url, '_blank');
}

/* =========================
   ABRIR MODAL NOVA PROGRAMACAO
========================= */
function _abrirModalProgramacao(programacao = null) {
	limparErroCampo('erroValidacaoCamposProgramacao');

	const selectLocal = document.getElementById('progLocal');
	const btnSalvar = document.getElementById('btnSalvarProgramacao');

	btnSalvar.onclick = salvarProgramacao;

	selectLocal.innerHTML = '<option value="">Selecione o local</option>';
	(dataStore.locais || []).forEach((l) => {
		const opt = document.createElement('option');
		opt.value = l.id;
		opt.text = l.nome;
		selectLocal.appendChild(opt);
	});

	// 🔹 Define hoje antes de usar
	const inputData = document.getElementById('progData');
	const hoje = new Date();
	const hojeStr = hoje.toISOString().split('T')[0];

	// Sempre limpa primeiro
	document.getElementById('progId').value = '';
	document.getElementById('progTipo').value = '';
	inputData.value = '';
	document.getElementById('progDiaSemana').value = '';
	document.getElementById('progHorario').value = '';

	if (programacao) {
		// ===== EDITAR =====
		document.getElementById('progModalTitulo').innerText = 'Editar Programação';
		document.getElementById('progId').value = programacao.id ?? '';
		document.getElementById('progLocal').value = programacao.local_id ?? '';
		document.getElementById('progTipo').value = programacao.tipo_visita ?? '';
		inputData.value = programacao.data || '';
		document.getElementById('progHorario').value = (programacao.horario || '').replace("'", '');

		// Bloqueia inserção de data menores que a data atual
		inputData.setAttribute('min', hojeStr);
	} else {
		// ===== NOVO =====
		document.getElementById('progModalTitulo').innerText = 'Nova Programação';

		inputData.value = hojeStr;
		inputData.setAttribute('min', hojeStr);
	}

	_atualizarDiaSemanaProgramacao();

	inputData.removeEventListener('change', _atualizarDiaSemanaProgramacao);
	inputData.addEventListener('change', _atualizarDiaSemanaProgramacao);

	new bootstrap.Modal(document.getElementById('modalProgramacao')).show();
}

/* =========================
   SALVAR
========================= */
async function salvarProgramacao() {
	limparErroCampo('erroValidacaoCamposProgramacao');

	const btn = document.getElementById('btnSalvarProgramacao');
	const textoOriginal = btn.innerHTML;

	const payload = montarPayloadProgramacao();
	if (!payload) return;

	_travarModal('modalProgramacao');
	btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando`;

	try {
		const signal = _getModalSignal('modalProgramacao');

		let r;

		if (payload.id) {
			r = await programacaoService.editar(payload, senhaDigitada, signal);
		} else {
			r = await programacaoService.criar(payload, senhaDigitada, signal);
		}

		if (signal.aborted) return;

		if (r?.error) {
			mostrarErroCampo('erroValidacaoCamposProgramacao', r.error);
			return;
		}

		bootstrap.Modal.getInstance(document.getElementById('modalProgramacao')).hide();

		abrirModalAviso(
			'Sucesso',
			payload.id ? 'Programação editada com sucesso' : 'Programação criada com sucesso',
		);

		await carregarProgramacoes();
	} catch (err) {
		if (err?.name === 'AbortError') return;

		console.error(err);
		abrirModalAviso('Erro', 'Erro ao salvar programação');
	} finally {
		_liberarModal('modalProgramacao');
		btn.innerHTML = textoOriginal;
	}
}

/* =========================
   EXCLUIR
========================= */
function excluirProgramacao(id, btnTrash) {
	document.getElementById('confirmTitle').innerText = 'Excluir Programação';
	document.getElementById('confirmMessage').innerText =
		'Deseja realmente excluir esta programação?';

	const btnOk = document.getElementById('confirmOk');
	btnOk.onclick = async () => {
		const textoOk = btnOk.innerHTML;
		const textoTrash = btnTrash.innerHTML;
		_travarModal('confirmModal');
		try {
			btnOk.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo`;
			const signal = _getModalSignal('confirmModal');
			const r = await programacaoService.excluir(id, senhaDigitada, signal);
			if (signal.aborted) return;
			if (r?.error) {
				abrirModalAviso('Aviso', r.error);
				return;
			}
			abrirModalAviso('Sucesso', 'Programação excluída com sucesso');
			await carregarProgramacoes();
		} catch (err) {
			if (err?.name === 'AbortError') return;
			abrirModalAviso('Erro', 'Erro ao excluir programação');
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
   HELPERS
========================= */
function montarPayloadProgramacao() {
	const id = document.getElementById('progId').value;
	const local_id = document.getElementById('progLocal').value;
	const tipo_visita = document.getElementById('progTipo').value;
	const descricao = document.getElementById('progDiaSemana').value;
	const data_programacao = document.getElementById('progData').value;
	const horario = document.getElementById('progHorario').value;

	if (!local_id || !tipo_visita || !data_programacao || !horario) {
		mostrarErroCampo('erroValidacaoCamposProgramacao', 'Preencha todos os campos corretamente');

		return null;
	}

	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);

	const dataSelecionada = new Date(data_programacao + 'T00:00:00');

	if (dataSelecionada < hoje) {
		mostrarErroCampo(
			'erroValidacaoCamposProgramacao',
			'Não é permitido cadastrar programação em data anterior à atual',
		);
		return null;
	}

	return {
		id: id ? Number(id) : null,
		local_id: Number(local_id),
		tipo_visita,
		descricao,
		data_programacao,
		horario,
	};
}

function _atualizarDiaSemanaProgramacao() {
	const data = document.getElementById('progData').value;
	const inputDia = document.getElementById('progDiaSemana');

	if (!data) {
		inputDia.value = '';
		return;
	}

	const d = new Date(data + 'T00:00:00');
	const dias = [
		'Domingo',
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado',
	];

	inputDia.value = dias[d.getDay()];
}

function _animarCalendario(delta) {
	requestAnimationFrame(() => {
		const w = document.getElementById('calGridWrapper');
		if (!w) return;

		const classe = delta > 0 ? 'cal-anim-esq' : 'cal-anim-dir';
		w.classList.add(classe);
		setTimeout(() => w.classList.remove('cal-anim-esq', 'cal-anim-dir'), 380);
	});
}

function _eventoEhDoMes(p, ano, mes) {
	if (!p.data) return false;
	const d = _parseDataProgramacao(p.data);
	return d.getFullYear() === ano && d.getMonth() === mes;
}

function _getLocalById(id) {
	return dataStore.locais?.find((l) => l.id == id);
}

function _fecharModalEExecutar(modalId, callback) {
	const el = document.getElementById(modalId);
	if (!el) return callback();
	const modal = bootstrap.Modal.getInstance(el);
	if (modal) modal.hide();

	el.addEventListener(
		'hidden.bs.modal',
		function once() {
			el.removeEventListener('hidden.bs.modal', once);
			callback();
		},
		{ once: true },
	);
}

function _parseDataProgramacao(data) {
	return new Date(data + 'T12:00:00');
}

async function _capturarCalendario() {
	const elemento = document.querySelector('.cal-wrapper');

	elemento.classList.add('exportando');

	const canvas = await html2canvas(elemento, {
		scale: 2,
		backgroundColor: '#ffffff',
		ignoreElements: (el) => el.classList?.contains('no-print'),
	});

	elemento.classList.remove('exportando');
	return canvas;
}

function _capitalizar(str) {
	return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}
