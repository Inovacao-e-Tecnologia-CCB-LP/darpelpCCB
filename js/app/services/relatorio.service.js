class RelatoriosService {
	async carregarBase() {
		const inscritos = await inscricoesService.listarTodas();
		const programacoes = await programacaoService.listarTodas();

		return {
			inscritos,
			programacoes,
			locais: dataStore.locais || [],
		};
	}

	filtrarProgramacoesComInscritos(localId, inscritosPorProgramacao, programacoes) {
		return programacoes.filter((p) => {
			if (p.local_id != localId) return false;
			return (inscritosPorProgramacao[String(p.id)] || []).length > 0;
		});
	}

	obterMusicos(programacaoId, inscritosPorProgramacao) {
		return inscritosPorProgramacao[programacaoId] || [];
	}
}

const relatoriosService = new RelatoriosService();
