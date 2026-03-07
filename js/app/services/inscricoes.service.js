class InscricoesService {
  entity = "inscricoes";

  async listar() {
    return await appScriptApi.view(this.entity);
  }

  async criar(payload) {
    return await appScriptApi.create(this.entity, payload);
  }

  async excluir(id, delete_token) {
    return await appScriptApi.deleteWithToken(this.entity, id, delete_token);
  }

  /* =========================
     ESTRUTURA
  ========================= */

  montarEstrutura(inscritos, locais, programacao, instrumentos) {
    const locaisMap = {};
    const programacaoMap = {};
    const instrumentosMap = {};
    const inscritosPorProgramacao = {};
    const grupos = {};

    locais.forEach((l) => (locaisMap[l.id] = l));
    programacao.forEach((p) => (programacaoMap[p.id] = p));
    instrumentos.forEach((i) => (instrumentosMap[i.id] = i));

    inscritos.forEach((i) => {
      (inscritosPorProgramacao[i.programacao_id] ??= []).push(i);

      let localNome = null;

      if (i.local_id && locaisMap[i.local_id]) {
        localNome = locaisMap[i.local_id].nome;
      } else if (i.local) {
        localNome = i.local;
      }

      if (!localNome) return;

      grupos[localNome] ??= {};
      (grupos[localNome][i.programacao_id] ??= []).push(i);
    });

    return {
      grupos,
      locaisMap,
      programacaoMap,
      instrumentosMap,
      inscritosPorProgramacao,
    };
  }
}

const inscricoesService = new InscricoesService();
