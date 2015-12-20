var helpers = {

	auKm: 149597871, // The km distance equal to 1 AU
	
	formatNumber: function (number) {
		return Math.max(0, number).toFixed(0).replace(/(?=(?:\d{3})+$)(?!^)/g, ' ');
	},

	formatDays: function (days) {
		return days > 730 ? helpers.formatNumber(helpers.round(days / 365, 1)) + ' years' : helpers.formatNumber(days) + ' days';
	},

	round: function (value, decimals) {
		return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
	},

	auToKm: function (au) {
		return au * helpers.auKm;
	},

	cToF: function (c) {
		return c * 9 / 5 + 32;
	},

	cToK: function (c) {
		return Number(c) + 273;
	}

}