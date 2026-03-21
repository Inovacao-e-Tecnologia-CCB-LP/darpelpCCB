async function mostrarAdmin() {
	setTitle('Área Administrativa');
	backButton.style.display = 'block';
	conteudo.innerHTML = Ui.PainelAdmin();
	window.adminAuth.authenticated = true;
}

function irParaTelaLocais() {
	navigateTo(() => guardAdmin(abrirTelaLocais));
}

function irParaTelaInstrumentos() {
	navigateTo(() => guardAdmin(abrirTelaInstrumentos));
}

function irParaTelaRegrasDatas() {
	navigateTo(() => guardAdmin(abrirTelaRegrasDatas));
}

function irParaTelaProgramacoes() {
	navigateTo(() => guardAdmin(abrirTelaProgramacoes));
}

function irParaTelaRelatorios() {
	navigateTo(() => guardAdmin(abrirTelaRelatorios));
}

function irParaTelaIntegracoes() {
	navigateTo(() => guardAdmin(abrirTelaIntegracoes));
}
