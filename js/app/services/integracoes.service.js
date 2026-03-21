/**
 * integracoes.service.js
 * Serviço de integrações — compatível com AppScriptApi existente.
 *
 * Responsabilidades:
 *  - CRUD da tabela nomes_integracao (listar / criar / excluir)
 *  - Geração e persistência do link_usuario_permanente (frontend → backend)
 *  - Geração do link temporário (apenas no frontend, nunca salvo)
 *  - Compartilhamento via Web Share API ou clipboard
 *  - Captura e validação de ?nome= / &exp= na URL de entrada
 */

class IntegracoesService {
	entity = 'nomes_integracao';

	// ─── helpers internos ──────────────────────────────────────────────────────

	/** URL base limpa (sem query-string / hash) */
	_baseUrl() {
		const { origin, pathname } = window.location;
		return origin + pathname.replace(/\/+$/, '');
	}

	/** https://dominio/?nome=João%20Silva */
	_linkPermanente(nome) {
		return `${this._baseUrl()}/?nome=${encodeURIComponent(nome)}`;
	}

	/** https://dominio/?nome=João%20Silva&exp=<timestamp+24h> */
	_linkTemporario(nome) {
		const exp = Date.now() + 24 * 60 * 60 * 1000;
		return `${this._baseUrl()}/?nome=${encodeURIComponent(nome)}&exp=${exp}`;
	}

	// ─── CRUD ──────────────────────────────────────────────────────────────────

	/** Lista todos os registros de nomes_integracao */
	async listar() {
		return await appScriptApi.view(this.entity);
	}

	/**
	 * Cria um registro { nome, id_local } e, logo após,
	 * atualiza o campo link_usuario_permanente no backend.
	 */
	async criar(payload, password) {
		// 1. Salvar nome + id_local
		const r = await appScriptApi.create(
			this.entity,
			{
				nome: payload.nome,
				id_local: payload.id_local,
			},
			password,
		);

		if (r?.error) return r;

		// 2. Gerar link permanente e persistir
		const link = this._linkPermanente(payload.nome);
		const id = r?.id;

		if (id) {
			// Não bloqueia o fluxo principal em caso de falha aqui
			appScriptApi
				.update(this.entity, { id, link_usuario_permanente: link }, password)
				.catch((e) => console.warn('Aviso ao salvar link permanente:', e));
		}

		return { ...r, link_usuario_permanente: link };
	}

	/** Remove um registro por id */
	async excluir(id, password) {
		return await appScriptApi.deleteWithPassword(this.entity, id, password);
	}

	/**
	 * Remove todos os nomes vinculados a um id_local.
	 * Backend: excluirNomeIntegracao (via action=delete)
	 */
	async excluirPorLocal(idLocal, password) {
		return await fetch(`${appScriptApi.url}?action=delete&entity=${this.entity}`, {
			method: 'POST',
			body: JSON.stringify({ id_local: idLocal, password }),
		}).then((r) => r.json());
	}

	// ─── Link Temporário ───────────────────────────────────────────────────────

	/**
	 * Gera link temporário (24 h) e aciona compartilhamento nativo ou clipboard.
	 * NUNCA salva na tabela. NUNCA chama o backend.
	 */
	async compartilhar(nome) {
		const link = this._linkTemporario(nome);

		try {
			if (navigator.share) {
				await navigator.share({ title: 'Integração – ' + nome, url: link });
			} else {
				await navigator.clipboard.writeText(link);
				abrirModalAviso(
					'Sucesso',
					`O link foi copiado para a área de transferência\n\n${link}`,
				);
			}
		} catch (err) {
			// Usuário cancelou o share ou clipboard bloqueado
			if (err?.name !== 'AbortError') {
				console.warn('compartilhar:', err);
				// Fallback final: prompt
				window.prompt('Copie o link abaixo:', link);
			}
		}
	}

	// ─── Captura de URL de entrada ─────────────────────────────────────────────

	/**
	 * Lê ?nome= e &exp= da URL ao carregar a página.
	 * - Se exp existir: valida prazo de 24 h.
	 * - Se válido: salva nome no localStorage como 'nome_integracao'.
	 * - Retorna o nome (string) ou null se ausente/expirado.
	 */
	capturarNomeDaUrl() {
		const params = new URLSearchParams(window.location.search);
		const nomeRaw = params.get('nome');

		if (!nomeRaw) return null;

		// Validar expiração (link temporário)
		const expRaw = params.get('exp');
		if (expRaw !== null) {
			const exp = Number(expRaw);
			if (isNaN(exp) || Date.now() > exp) {
				setTimeout(() => {
					abrirModalAviso(
						'Aviso',
						'Link expirado, solicite um novo ao responsável pela integração',
					);
				}, 500);
				return null;
			}
		}

		const nome = decodeURIComponent(nomeRaw);

		// Salva o nome do link como nome permanente de integração.
		// NÃO apaga inscricoes_autorizadas nem darpe_ultimo_nome —
		// apenas grava/atualiza a identidade de integração deste navegador.
		localStorage.setItem('nome_integracao', nome);

		return nome;
	}
}

const integracoesService = new IntegracoesService();
