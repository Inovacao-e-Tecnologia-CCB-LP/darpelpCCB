class UiComponents {
	constructor() {
		this.getComponents();
	}

	async getComponents() {
		await fetch(`js/ui/components/painel-admin.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelAdmin = text;
			});
		await fetch(`js/ui/components/painel-instrumentos.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelInstrumentos = text;
			});
		await fetch(`js/ui/components/painel-tipos-visita.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelTiposVisita = text;
			});
		await fetch(`js/ui/components/painel-locais.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelLocais = text;
			});
		await fetch(`js/ui/components/painel-regras-datas.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelRegrasDatas = text;
			});
		await fetch(`js/ui/components/painel-programacoes.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelProgramacoes = text;
			});
		await fetch(`js/ui/components/relatorio.html`)
			.then((response) => response.text())
			.then((text) => {
				this.relatorio = text;
			});
		await fetch(`js/ui/components/integracoes.html`)
			.then((response) => response.text())
			.then((text) => {
				this.integracoes = text;
			});
		await fetch(`js/ui/components/observacoes.html`)
			.then((response) => response.text())
			.then((text) => {
				this.observacoes = text;
			});
		await fetch(`js/ui/components/confirmar-presenca.html`)
			.then((response) => response.text())
			.then((text) => {
				this.confirmarPresenca = text;
			});
		await fetch(`js/ui/components/home.html`)
			.then((response) => response.text())
			.then((text) => {
				this.home = text;
			});
	}

	Home() {
		return this.home;
	}

	ConfirmarPresenca() {
		return this.confirmarPresenca;
	}

	ModalObservacao() {
		return this.observacoes;
	}

	PainelAdmin() {
		return this.painelAdmin;
	}

	PainelInstrumentos() {
		return this.painelInstrumentos;
	}

	PainelLocais() {
		return this.painelLocais;
	}

	PainelRegrasDatas() {
		return this.painelRegrasDatas;
	}

	PainelProgramacoes() {
		return this.painelProgramacoes;
	}

	PainelRelatorio() {
		return this.relatorio;
	}

	PainelIntegracoes() {
		return this.integracoes;
	}

	PainelTiposVisita() {
		return this.painelTiposVisita;
	}
}
