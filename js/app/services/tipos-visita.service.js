class TiposVisitaService {
	entity = 'tipos_visita';

	async listar() {
		return await appScriptApi.view(this.entity);
	}

	async criar(payload, password) {
		return await appScriptApi.create(this.entity, payload, password);
	}

	async atualizar(payload, password) {
		return await appScriptApi.update(this.entity, payload, password);
	}

	async excluir(id, password) {
		return await appScriptApi.deleteWithPassword(this.entity, id, password);
	}

	/* =========================
	   HELPER
	========================= */
	obterNomeTipoVisita(item, tiposVisitaMap) {
		return tiposVisitaMap?.[item.tipo_visita_id]?.nome || item.tipo_visita || '';
	}

	montarMap(tiposVisita) {
		return Object.fromEntries((tiposVisita || []).map((t) => [t.id, t]));
	}
}
const tiposVisitaService = new TiposVisitaService();
