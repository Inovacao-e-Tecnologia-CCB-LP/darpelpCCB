function formatarData(d) {
	return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatarHorario(horario) {
	if (horario && typeof horario === 'string' && horario.startsWith("'")) {
		return horario.slice(1);
	}
	return horario;
}

function _capitalizar(str) {
	return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function isMobile() {
	return window.innerWidth < 768;
}

function carregarImagemBase64(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = function () {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0);
			resolve(canvas.toDataURL('image/png'));
		};
		img.onerror = reject;
		img.src = url;
	});
}

async function carregarTiposVisitaSelect(selectId) {
	try {
		const select = document.getElementById(selectId);

		let tipos = dataStore.tiposVisita || (await tiposVisitaService.listar());

		if (tipos?.error) throw new Error(tipos.error);

		tipos = tipos || [];

		// limpa mantendo o primeiro option
		select.innerHTML = `<option value="">Selecione o tipo</option>`;

		tipos
			.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
			.forEach((t) => {
				select.innerHTML += `<option value="${t.id}">${t.nome}</option>`;
			});
	} catch (err) {
		console.error('Erro ao carregar tipos de visita no select', err);
	}
}

function _getTipoVisitaById(id) {
	return (dataStore.tipos_visita || []).find((t) => String(t.id) === String(id));
}
