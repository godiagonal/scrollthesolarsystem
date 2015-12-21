var api = {

	planetData: null,
	url: 'data.php',

	getPlanetData: function () {
		
		// Start loading spinner
		$('#spinner').show();

		$.getJSON(api.url, function (data) {

			// Stop spinner
			$('#spinner').hide();
			
			api.planetData = data;
			guiOverview.updateData();
			guiExploration.updateData();

		}).fail(function () {

			$('#spinner').hide();
			alert('An error occured when loading planetary data.');

		});

	}

}