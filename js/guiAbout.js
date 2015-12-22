var guiAbout = {

	containerElem: null,
	
	init: function (event) {
		
		event.preventDefault();
		
		guiAbout.containerElem.show().animate({ opacity: 1 }, 500);
		
	},
	
	close: function () {
		
		guiAbout.containerElem.animate({ opacity: 0 }, 500, function () {
			$(this).hide();
		});
		
	}

}