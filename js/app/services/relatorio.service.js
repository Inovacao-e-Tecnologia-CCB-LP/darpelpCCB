class RelatoriosService {
	async carregarBase() {
		const inscritos = await inscricoesService.listar();

		return {
			inscritos,
			locais: dataStore.locais || [],
			programacoes: dataStore.programacao || [],
		};
	}

	filtrarProgramacoesComInscritos(localId, inscritosPorProgramacao) {
		return dataStore.programacao.filter((p) => {
			if (p.local_id != localId) return false;
			return (inscritosPorProgramacao[p.id] || []).length > 0;
		});
	}

	obterMusicos(programacaoId, inscritosPorProgramacao) {
		return inscritosPorProgramacao[programacaoId] || [];
	}
}

const relatoriosService = new RelatoriosService();
