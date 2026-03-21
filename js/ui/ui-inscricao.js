async function showEscolherLocal() {
	setTitle('Selecione o local');

	if (!dataStore.locais || dataStore.locais.length === 0) {
		conteudo.innerHTML = `
        <div class="alert alert-secondary text-center">
        Nenhum local encontrado
        </div>
      `;
		return;
	}

	// ── Resolver nome de integração ────────────────────────────────────────────
	// Prioridade: ?nome= da URL (já capturado em nomeIntegracao) → localStorage
	const nomeIntegracaoAtivo = nomeIntegracao || localStorage.getItem('nome_integracao');

	// IDs de TODOS os locais vinculados a este nome (pode ser mais de um)
	let idsLocaisIntegracao = [];

	if (nomeIntegracaoAtivo) {
		try {
			const registros = dataStore.nomes_integracao ?? (await integracoesService.listar());
			dataStore.nomes_integracao = registros || [];

			// filter (não find) → todos os locais do nome
			const registrosDoNome = registros.filter(
				(r) => r.nome?.toLowerCase().trim() === nomeIntegracaoAtivo.toLowerCase().trim(),
			);

			idsLocaisIntegracao = registrosDoNome.map((r) => Number(r.id_local));
		} catch (err) {
			console.warn('Aviso ao buscar integração:', err);
		}
	}

	const temIntegracao = idsLocaisIntegracao.length > 0;

	// Função: local NÃO é de integração
	const semIntegracao = (l) =>
		!l.integracoes ||
		l.integracoes === false ||
		String(l.integracoes).toUpperCase() === 'FALSE';

	// Função: local é um dos locais de integração deste nome
	const ehLocalDoNome = (l) => idsLocaisIntegracao.includes(Number(l.id));

	let locaisExibidos;

	if (!nomeIntegracaoAtivo || !temIntegracao) {
		// Sem integração ativa: exibe só locais normais
		locaisExibidos = dataStore.locais.filter(semIntegracao);
	} else {
		// Com integração: locais normais + TODOS os locais vinculados ao nome
		locaisExibidos = dataStore.locais.filter((l) => semIntegracao(l) || ehLocalDoNome(l));
	}

	if (locaisExibidos.length === 0) {
		conteudo.innerHTML = `
      <div class="alert alert-secondary text-center">
        Nenhum local disponível no momento
      </div>
    `;
		return;
	}

	conteudo.innerHTML = '';

	if (nomeIntegracaoAtivo && temIntegracao) {
		const info = document.createElement('div');
		info.className = 'alert alert-info text-center mb-3 col-md-6 mx-auto';
		info.innerHTML = `<i class="bi bi-info-circle me-2"></i>Bem-vindo, <strong>${nomeIntegracaoAtivo}</strong>! Os locais com integração que você pode acessar estão destacados.`;
		conteudo.appendChild(info);
	}

	const g = document.createElement('div');
	g.className = 'grade-escolha';

	locaisExibidos.forEach((l) => {
		const btn = document.createElement('button');
		const ehDestacado = temIntegracao && ehLocalDoNome(l);

		if (ehDestacado) {
			btn.className = 'btn btn-dark';
			btn.innerHTML = `<i class="bi bi-geo-alt-fill"></i><span>${l.nome} <span class="badge bg-warning text-dark ms-1">Integração</span></span>`;
		} else {
			btn.className = 'btn btn-outline-dark';
			btn.innerHTML = `<i class="bi bi-geo-alt"></i><span>${l.nome}</span>`;
		}

		btn.onclick = () => selecionarLocal(l);
		g.appendChild(btn);
	});

	conteudo.appendChild(g);
}

function showEscolherData() {
	setTitle('Selecione a data');

	const programacoesFiltradas = dataStore.programacao
		.filter((p) => p.local_id == escolha.local.id)
		.sort((a, b) => {
			const dataA = new Date(a.data);
			const dataB = new Date(b.data);

			if (dataA.getTime() !== dataB.getTime()) {
				return dataA - dataB;
			}

			return a.horario.localeCompare(b.horario);
		});

	if (programacoesFiltradas.length === 0) {
		conteudo.innerHTML = `
        <div class="alert alert-secondary text-center">
          Nenhuma data disponível para este local
        </div>
      `;
		return;
	}

	const g = document.createElement('div');
	g.className = 'grade-escolha mb-4';

	programacoesFiltradas.forEach((p) => {
		const btn = document.createElement('button');
		btn.className = 'btn btn-outline-dark';

		const iconesTipoVisita = {
			Evangelização: 'bi bi-book',
			Música: 'bi bi-music-note-beamed',
		};

		const icone = iconesTipoVisita[p.tipo_visita] || 'bi bi-calendar-event';

		btn.innerHTML = `
    <i class="${icone}"></i>
    <span>
      <strong>${p.tipo_visita} &bull; ${formatarData(p.data)} </strong><br>
      <small class="text-muted">${p.descricao} &bull; ${formatarHorario(p.horario)}</small>
    </span>
  `;

		btn.style.alignItems = 'flex-start';
		btn.onclick = () => selecionarData(p);

		g.appendChild(btn);
	});

	const obs = document.createElement('div');
	obs.className = 'traje-card col-12 col-sm-10 col-md-8 mx-auto';
	obs.innerHTML = Ui.ObservacaoTrajes();

	conteudo.innerHTML = '';
	conteudo.appendChild(g);
	conteudo.appendChild(obs);
}

function showEscolherInstrumento() {
	setTitle('Selecione o instrumento');

	const local = escolha.local;

	let instrumentosEspecificos = null;
	if (local.instrumentos_permitidos) {
		try {
			const parsed =
				typeof local.instrumentos_permitidos === 'string'
					? JSON.parse(local.instrumentos_permitidos)
					: local.instrumentos_permitidos;

			if (Array.isArray(parsed) && parsed.length) {
				instrumentosEspecificos = parsed.map(Number);
			}
		} catch (e) {
			/* ignora */
		}
	}

	// Ordem personalizada de tipos
	const ordemTipos = {
		corda: 1,
		sopro: 2,
		percussao: 3, // se existir
	};

	const instrumentosDisponiveis = dataStore.instrumentos
		.filter((i) => {
			const liberadoPorTipo =
				(i.tipo === 'corda' && local.permite_cordas) ||
				(i.tipo === 'sopro' && local.permite_sopros);

			const ehEspecifico = instrumentosEspecificos
				? instrumentosEspecificos.includes(Number(i.id))
				: false;

			return liberadoPorTipo || ehEspecifico;
		})
		.sort((a, b) => {
			// 1️⃣ Ordena por tipo
			const ordemA = ordemTipos[a.tipo] || 99;
			const ordemB = ordemTipos[b.tipo] || 99;

			if (ordemA !== ordemB) {
				return ordemA - ordemB;
			}

			// 2️⃣ Ordena alfabeticamente pelo nome
			return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
		});

	if (instrumentosDisponiveis.length === 0) {
		conteudo.innerHTML = `
      <div class="alert alert-secondary text-center">
        Não há instrumentos compatíveis com as regras deste local.
      </div>
    `;
		return;
	}

	const g = document.createElement('div');
	g.className = 'grade-escolha';

	let tipoAtual = null;

	instrumentosDisponiveis.forEach((i) => {
		// Se mudou o tipo, cria um título
		if (i.tipo !== tipoAtual) {
			tipoAtual = i.tipo;

			const titulo = document.createElement('div');
			titulo.className = 'fw-bold mt-4 mb-2 d-flex align-items-center gap-2';

			const span = document.createElement('span');
			span.textContent = _formatarTipo(tipoAtual);

			titulo.appendChild(span);
			g.appendChild(titulo);
		}

		const btn = document.createElement('button');
		btn.className = 'btn btn-outline-dark';

		const estilo = _getEstiloIconeTipo(i.tipo);

		btn.innerHTML = `
  <div class="d-flex align-items-center gap-2">
    <div style="background:${estilo.bg}; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
      <i class="bi ${_getIconeTipo(i.tipo)}" style="color:${estilo.color}; font-size:0.9rem;"></i>
    </div>
    <span>${i.nome}</span>
  </div>
`;

		btn.onclick = () => selecionarInstrumento(i);

		g.appendChild(btn);
	});

	conteudo.innerHTML = '';
	conteudo.appendChild(g);
}

// ── Estado interno da tela de confirmação ────────────────────────────────────
// Guarda qual modo está ativo: 'integracao_local' | 'nome_salvo' | 'input'
let _confirmarModo = null;
// Nome escolhido da lista de integração (modo integracao_local)
let _nomeSelecionadoIntegracao = null;

async function showConfirmar() {
	setTitle('Digite o nome');
	_confirmarModo = null;
	_nomeSelecionadoIntegracao = null;

	const nomeIntegracaoAtivo = nomeIntegracao || localStorage.getItem('nome_integracao');
	const localTemIntegracao =
		escolha.local?.integracoes === true ||
		String(escolha.local?.integracoes).toUpperCase() === 'TRUE';

	// ── CENÁRIO C: local tem integração ──────────────────────────────────────
	if (localTemIntegracao) {
		_confirmarModo = 'integracao_local';

		if (nomeIntegracaoAtivo) {
			// Tem nome salvo → mostra direto com opção de trocar
			_nomeSelecionadoIntegracao = nomeIntegracaoAtivo;
			_renderConfirmarIntegracaoComNome(nomeIntegracaoAtivo);
		} else {
			// Sem nome salvo → vai direto para a lista
			await _showListaNomesIntegracao();
		}
		return;
	}

	// ── CENÁRIO A: local normal + navegador tem nome_integracao ──────────────
	if (nomeIntegracaoAtivo) {
		_confirmarModo = 'nome_salvo';
		conteudo.innerHTML = Ui.ConfirmarPresenca();
		const cardSalvo = document.getElementById('nomeSalvoCard');
		const textoSalvo = document.getElementById('nomeSalvoTexto');
		const inputCard = document.getElementById('inputNomeCard');
		if (cardSalvo && textoSalvo) {
			// Rótulo específico para nome de integração
			const rotulo = cardSalvo.querySelector('p.text-muted.small');
			if (rotulo) rotulo.textContent = 'Nome vinculado ao seu link';
			textoSalvo.textContent = nomeIntegracaoAtivo;
			cardSalvo.classList.remove('d-none');
			inputCard.classList.add('d-none');
		}
		return;
	}

	// ── CENÁRIO B: local normal + usuário comum ───────────────────────────────
	_confirmarModo = 'input';
	conteudo.innerHTML = Ui.ConfirmarPresenca();
	const nomeSalvoLocal = localStorageService.buscarNome();
	if (nomeSalvoLocal) {
		_confirmarModo = 'nome_salvo';
		const cardSalvo = document.getElementById('nomeSalvoCard');
		const textoSalvo = document.getElementById('nomeSalvoTexto');
		const inputCard = document.getElementById('inputNomeCard');
		if (cardSalvo && textoSalvo) {
			textoSalvo.textContent = nomeSalvoLocal;
			cardSalvo.classList.remove('d-none');
			inputCard.classList.add('d-none');
		}
	}
}

// ── Cenário C — passo 1: mostra nome salvo com botão de trocar ───────────────
function _renderConfirmarIntegracaoComNome(nome) {
	conteudo.innerHTML = '';

	const wrapper = document.createElement('div');
	wrapper.className = 'row justify-content-center';

	const col = document.createElement('div');
	col.className = 'col-12 col-sm-10 col-md-6';

	col.innerHTML = `
    <div class="card border-dark mb-3">
      <div class="card-body p-3 text-center">
        <p class="mb-1 text-muted small fw-semibold text-uppercase" style="letter-spacing:.05em">
          Confirmando presença como
        </p>
        <p class="fw-bold fs-5 mb-3">${nome}</p>
        <div class="d-grid gap-2">
          <button id="btnConfirmar" type="button" class="btn btn-dark btn-lg" onclick="salvarInscricao(this)">
            <i class="bi bi-check2-circle me-2"></i>Confirmar
          </button>
          <button type="button" class="btn btn-outline-dark btn-lg" onclick="_showListaNomesIntegracao()">
            <i class="bi bi-person-plus me-2"></i>Cadastrar novo nome
          </button>
        </div>
      </div>
    </div>`;

	wrapper.appendChild(col);
	conteudo.appendChild(wrapper);
}

// ── Cenário C — passo 2: lista de nomes do local para trocar ─────────────────
async function _showListaNomesIntegracao() {
	conteudo.innerHTML = `<div class="text-center my-4"><div class="spinner-border text-dark"></div></div>`;

	let nomes = [];
	try {
		const registros = dataStore.nomes_integracao ?? (await integracoesService.listar());
		dataStore.nomes_integracao = registros || [];
		nomes = registros
			.filter((r) => Number(r.id_local) === Number(escolha.local.id))
			.map((r) => r.nome)
			.filter(Boolean)
			.sort((a, b) => a.localeCompare(b, 'pt-BR'));
	} catch (err) {
		console.warn('Aviso ao buscar nomes de integração:', err);
	}

	if (!nomes.length) {
		conteudo.innerHTML = `
      <div class="alert alert-warning text-center col-md-6 mx-auto">
        Nenhum nome cadastrado para este local de integração
      </div>`;
		return;
	}

	conteudo.innerHTML = '';

	const wrapper = document.createElement('div');
	wrapper.className = 'row justify-content-center';

	const col = document.createElement('div');
	col.className = 'col-12 col-sm-10 col-md-6';

	col.innerHTML = `
    <p class="text-muted small fw-semibold text-uppercase mb-2" style="letter-spacing:.05em">
      Selecione seu nome
    </p>`;

	const grid = document.createElement('div');
	grid.className = 'd-grid gap-2';

	nomes.forEach((nome) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		const ehAtivo =
			_nomeSelecionadoIntegracao &&
			nome.toLowerCase().trim() === _nomeSelecionadoIntegracao.toLowerCase().trim();
		btn.className = ehAtivo ? 'btn btn-dark btn-lg' : 'btn btn-outline-dark btn-lg';
		btn.textContent = nome;
		btn.dataset.nome = nome;
		btn.onclick = () => _selecionarNomeIntegracao(nome, grid);
		grid.appendChild(btn);
	});

	const btnConfirmar = document.createElement('button');
	btnConfirmar.id = 'btnConfirmar';
	btnConfirmar.type = 'button';
	btnConfirmar.className = `btn btn-dark btn-lg mt-3${_nomeSelecionadoIntegracao ? '' : ' d-none'}`;
	btnConfirmar.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Confirmar';
	btnConfirmar.onclick = function () {
		salvarInscricao(this);
	};

	col.appendChild(grid);
	col.appendChild(btnConfirmar);
	wrapper.appendChild(col);
	conteudo.appendChild(wrapper);
}

function _selecionarNomeIntegracao(nome, grid) {
	_nomeSelecionadoIntegracao = nome;

	// Salva imediatamente como nome_integracao permanente neste navegador
	localStorage.setItem('nome_integracao', nome);

	// Atualiza visual dos botões
	grid.querySelectorAll('button[data-nome]').forEach((b) => {
		const ativo = b.dataset.nome === nome;
		b.className = ativo ? 'btn btn-dark btn-lg' : 'btn btn-outline-dark btn-lg';
	});

	// Mostra o botão confirmar
	const btnConfirmar = document.getElementById('btnConfirmar');
	if (btnConfirmar) btnConfirmar.classList.remove('d-none');
}

// Chamado quando usuário clica "Usar este nome" (cenários A e B)
function usarNomeSalvo(btn) {
	const nomeIntegracaoAtivo = nomeIntegracao || localStorage.getItem('nome_integracao');
	// Cenário A: usa nome de integração
	if (nomeIntegracaoAtivo && _confirmarModo === 'nome_salvo') {
		salvarInscricao(btn || null);
		return;
	}
	// Cenário B: usa darpe_ultimo_nome
	const nomeSalvo = localStorageService.buscarNome();
	if (!nomeSalvo) return;
	const inputNome = document.getElementById('nome');
	if (inputNome) inputNome.value = nomeSalvo;
	salvarInscricao(btn || null);
}

// Chamado quando usuário clica "Usar outro nome" (cenários A e B)
function digitarNovoNome() {
	_confirmarModo = 'input';
	const cardSalvo = document.getElementById('nomeSalvoCard');
	const inputCard = document.getElementById('inputNomeCard');
	if (cardSalvo) cardSalvo.classList.add('d-none');
	if (inputCard) {
		inputCard.classList.remove('d-none');
		setTimeout(() => {
			const inputNome = document.getElementById('nome');
			if (inputNome) inputNome.focus();
		}, 100);
	}
}

async function salvarInscricao(btnEl) {
	// Aceita o botão passado diretamente (ex: usarNomeSalvo) ou busca pelo id
	const btn = btnEl || document.getElementById('btnConfirmar');

	const nomeIntegracaoAtivo = nomeIntegracao || localStorage.getItem('nome_integracao');
	const localTemIntegracao =
		escolha.local?.integracoes === true ||
		String(escolha.local?.integracoes).toUpperCase() === 'TRUE';

	let nome;

	// ── Resolver nome conforme o cenário ────────────────────────────────────
	if (localTemIntegracao) {
		// Cenário C: nome escolhido da lista
		nome = _nomeSelecionadoIntegracao;
	} else if (nomeIntegracaoAtivo && _confirmarModo !== 'input') {
		// Cenário A: nome de integração confirmado pelo usuário
		nome = nomeIntegracaoAtivo;
	} else {
		// Cenários A (outro nome) e B: vem do input
		const inputNome = document.getElementById('nome');
		nome = inputNome ? inputNome.value.trim() : '';
	}

	if (!nome) {
		abrirModalAviso('Aviso', 'Informe o seu nome');
		return;
	}

	// ── Processamento para usuários sem integração que digitaram o nome ──────
	const precisaProcessar =
		!localTemIntegracao && (!nomeIntegracaoAtivo || _confirmarModo === 'input');

	if (precisaProcessar) {
		nome = localStorageService.capitalizarNome(nome);

		const nomeProcessado = await NomeCorrector.processar(nome);
		if (nomeProcessado === null) {
			const inputNome = document.getElementById('nome');
			if (inputNome) {
				inputNome.value = '';
				inputNome.focus();
			}
			return;
		}
		nome = nomeProcessado;
		localStorageService.salvarNome(nome);
	}

	const originalHTML = btn ? btn.innerHTML : '';
	if (btn) {
		btn.disabled = true;
		btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
	}

	const payload = {
		local: escolha.local.id,
		local_id: escolha.local.id,
		programacao_id: escolha.programacao.id,
		tipo_visita: escolha.programacao.tipo_visita,
		instrumento: escolha.instrumento.id,
		instrumento_id: escolha.instrumento.id,
		nome,
	};

	try {
		const r = await inscricoesService.criar(payload);

		if (r?.error) {
			abrirModalAviso('Aviso', r.error);
			return;
		}

		if (r?.id && r?.delete_token) {
			localStorageService.salvarAutorizacao(r.id, r.delete_token);
		}

		abrirModalAviso('Sucesso', 'Inscrição confirmada! Deus abençoe');
		resetAndGoHome();
	} catch (e) {
		console.error(e);
		abrirModalAviso('Erro', 'Erro ao salvar inscrição');
	} finally {
		if (btn) {
			btn.disabled = false;
			btn.innerHTML = originalHTML;
		}
	}
}

async function excluirInscricao(id, btn) {
	const auth = localStorageService.buscarAutorizacao(id);

	if (!auth) {
		abrirModalAviso('Erro', 'Você não tem permissão para excluir esta inscrição');
		return;
	}

	const confirmou = await abrirModalConfirmacao(
		'Deseja realmente excluir esta inscrição?',
		'Excluir',
	);
	if (!confirmou) return;

	const originalHTML = btn.innerHTML;
	const originalClass = btn.className;

	btn.disabled = true;
	btn.className = 'btn btn-sm btn-danger';
	btn.innerHTML = '<span class="spinner-border spinner-border-sm text-light"></span>';

	try {
		const r = await inscricoesService.excluir(id, auth.token);

		if (!r?.success) throw r;

		localStorageService.removerAutorizacao(id);
		abrirModalAviso('Sucesso', 'Inscrição excluída com sucesso');
		showInscritos();
	} catch (e) {
		console.error(e);
		abrirModalAviso('Erro', 'Erro ao excluir inscrição');
	} finally {
		btn.disabled = false;
		btn.innerHTML = originalHTML;
	}
}
