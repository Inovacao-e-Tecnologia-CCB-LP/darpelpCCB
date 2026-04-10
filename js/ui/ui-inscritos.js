let estruturaInscritos = {};

/* =========================
   LISTAGEM
========================= */

function renderAccordionInscritos(grupos) {
	const { locaisMap, programacaoMap, instrumentosMap } = estruturaInscritos;

	let html = '<div class="accordion" id="accordionInscritos">';
	let index = 0;

	Object.entries(grupos).forEach(([local, programacoes]) => {
		const pidsValidos = Object.keys(programacoes).filter((pid) => programacaoMap[pid]);

		if (pidsValidos.length === 0) {
			console.warn('Nenhuma programação válida nesse grupo:', local);
			return;
		}

		const currentIndex = index;
		const pRef = programacaoMap[pidsValidos[0]];
		const localObj = locaisMap[pRef.local_id];

		if (!localObj) {
			console.warn('Local não encontrado:', pRef.local_id);
		}

		html += `
      <div class="accordion-item border-dark">

        <h2 class="accordion-header" id="heading-${currentIndex}">
          <button class="accordion-button collapsed bg-dark text-white"
            data-bs-toggle="collapse"
            data-bs-target="#collapse-${currentIndex}"
            aria-expanded="false">
            ${local}
          </button>
        </h2>

        <div id="collapse-${currentIndex}" 
             class="accordion-collapse collapse"
             data-bs-parent="#accordionInscritos">

          <p class="link-mapa copy-text"
            data-localid="${pRef.local_id}"
            title="Copiar endereço e abrir mapa">
            <i class="bi bi-geo-alt-fill me-1"></i>
            ${localObj?.endereco ?? 'Endereço não informado'}
          </p>

          <div class="accordion-body bg-light">
    `;

		pidsValidos.forEach((pid) => {
			const inscritosLista = programacoes[pid];
			const p = programacaoMap[pid];

			html += `
        <div class="card mb-3 border-dark">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center gap-2 py-3">
            <div class="text-start">
              <div class="fw-semibold fs-6">
                ${p.tipo_visita} • ${formatarData(p.data)}
              </div>
              <div class="small opacity-75">
                ${p.descricao} • ${formatarHorario(p.horario)}
              </div>
            </div>

            <button class="btn btn-sm btn-success flex-shrink-0"
              onclick="compartilhar(${pid})">
              <i class="bi bi-whatsapp"></i>
              <span class="d-none d-md-inline ms-1">Compartilhar</span>
            </button>
          </div>

          <ul class="list-group list-group-flush">
      `;

			inscritosLista.forEach((i) => {
				const auth = localStorageService.buscarAutorizacao(i.id);

				const instNome = instrumentosService.obterNomeInstrumento(i, instrumentosMap);

				html += `
          <li class="list-group-item d-flex justify-content-between align-items-center gap-2 py-3">
            <span class="d-flex flex-column align-items-start">
              <span class="fw-semibold">${i.nome}</span>
              <span class="text-muted small">${instNome}</span>
            </span>

            ${
				auth
					? `<button class="btn btn-sm btn-outline-danger excluir-btn"
                    onclick="excluirInscricao(${i.id}, this)">
                    <i class="bi bi-trash"></i>
					<span class="btn-text">Excluir</span>
                  </button>`
					: ''
			}
          </li>
        `;
			});

			html += `</ul></div>`;
		});

		html += `
          </div>
        </div>
      </div>
    `;

		index++;
	});

	if (index === 0) {
		conteudo.innerHTML = `
      <div class="alert alert-secondary text-center">
        Nenhuma programação válida encontrada
      </div>`;
		return;
	}

	html += '</div>';
	conteudo.innerHTML = html;
}

/* =========================
   VISUALIZAR INSCRIÇÕES
========================= */

async function showInscritos() {
	setTitle('Inscrições');

	conteudo.innerHTML = `
    <div class="spinner-border text-dark" role="status">
      <span class="visually-hidden">Carregando...</span>
    </div>`;

	travarUI();

	try {
		const inscritos = (await inscricoesService.listar()) || [];

		dataStore.inscritos = inscritos;

		if (!inscritos.length) {
			conteudo.innerHTML = `
        <div class="alert alert-secondary text-center">
          Nenhuma inscrição encontrada
        </div>`;
			return;
		}

		estruturaInscritos = inscricoesService.montarEstrutura(
			inscritos,
			dataStore.locais,
			dataStore.programacao,
			dataStore.instrumentos || [],
		);

		renderAccordionInscritos(estruturaInscritos.grupos);

		copiarTexto(conteudo);
	} catch (err) {
		console.error(err);

		conteudo.innerHTML = `
      <div class="alert alert-dark text-center">
        Erro ao carregar inscrições
      </div>`;
	} finally {
		liberarUI();
	}
}

/* =========================
   COMPARTILHAR MENSAGEM WHATSAPP
========================= */

function compartilhar(pid) {
	const { locaisMap, programacaoMap, instrumentosMap, inscritosPorProgramacao } =
		estruturaInscritos;

	const p = programacaoMap[pid];
	if (!p) {
		abrirModalAviso('Erro', 'Programação não encontrada');
		return;
	}

	const localObj = locaisMap[p.local_id];
	if (!localObj) {
		abrirModalAviso('Erro', 'Local não encontrado');
		return;
	}

	const inscritosProg = inscritosPorProgramacao[pid] || [];

	const dataFormatada = formatarData(p.data);

	let mensagem = `*${localObj.nome}*\n\n`;
	mensagem += ` _${localObj.endereco}_\n`;
	mensagem += ` *${p.tipo_visita}*\n`;
	mensagem += ` ${dataFormatada}\n`;
	mensagem += ` ${formatarHorario(p.horario)}\n\n`;
	mensagem += `*Inscritos(${inscritosProg.length}/${localObj.limite}):*\n`;

	inscritosProg.forEach((i) => {
		const instNome = instrumentosService.obterNomeInstrumento(i, instrumentosMap);

		mensagem += `• ${i.nome} _(${instNome})_\n`;
	});

	mensagem = encodeURIComponent(mensagem);

	window.open(`https://wa.me/?text=${mensagem}`, '_blank', 'noopener,noreferrer');
}
