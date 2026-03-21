function formatarData(d) {
	return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatarHorario(horario) {
	if (horario && typeof horario === 'string' && horario.startsWith("'")) {
		return horario.slice(1);
	}
	return horario;
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
