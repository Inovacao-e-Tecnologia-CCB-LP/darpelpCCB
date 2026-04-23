class ProgramacaoService {
	entity = 'programacao';

	async listar() {
		return await appScriptApi.view(this.entity);
	}

	async listarTodas() {
		return await appScriptApi.view('programacao_all');
	}

	async excluir(id, password, signal) {
		return await appScriptApi.deleteWithPassword(this.entity, id, password, signal);
	}

	async criar(dados, password, signal) {
		return await appScriptApi.create(this.entity, dados, password, signal);
	}

	async editar(dados, password, signal) {
		return await appScriptApi.update(this.entity, dados, password, signal);
	}
}

const programacaoService = new ProgramacaoService();
