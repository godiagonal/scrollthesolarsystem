var api = {

	planetData: null,
	url: 'data.php',

	getPlanetData: function () {

		$.getJSON(api.url, function (data) {

			api.planetData = data;
			guiOverview.updateData();
			guiExploration.updateData();

		}).fail(function () {

			alert('An error occured when loading planetary data.');

		});

	}

}