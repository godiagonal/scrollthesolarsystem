var api = {

	planetData: null,
	
	getPlanetData: function () {

		$.getJSON('data.php', function (data) {

			api.planetData = data;
			guiOverview.updateData();
			guiExploration.updateData();

		}).fail(function () {

			alert('An error occured when loading planetary data.');

		});

	}

}