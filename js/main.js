var browser = {
	isMobile: false,
	canAnimateRadius: false,
	canUseParallax: false,
}

$(function () {
	
	guiOverview.containerElem = $('#overview_container');
	guiOverview.viewboxWidth = guiOverview.containerElem[0].getAttribute('viewBox').split(' ')[2];
	guiExploration.containerElem = $('#exploration_container');
	guiExploration.scrollController = new ScrollMagic.Controller();
	guiAbout.containerElem = $('#about_container');

	browser.canAnimateRadius = bowser.chrome && !bowser.mobile;
	browser.canUseParallax = !bowser.safari && !bowser.mobile;

	// Bind UI events
	$(window).mousewheel(guiOverview.onMouseWheel);
	$(window).resize(guiOverview.onResize);
	$('#btn_overview').click(guiOverview.init);
	$('#btn_orbit_scale').click(guiOverview.setOrbitScale);
	$(window).scroll(guiExploration.onScroll);
	$('#btn_explore').click(guiExploration.init);
	$('.btn-show-about').click(guiAbout.init);
	$('#btn_hide_about').click(guiAbout.close);

	// Init slider with 2 year time span divided into weeks (today in the middle)
	$('#slider_date').slider({
		orientation: 'vertical',
		min: 0,
		max: 104,
		value: 52,
		slide: guiOverview.onSlide
	});

	// Setup planet tooltips
	$(document).tooltip({
		position: {
			my: 'left top',
			at: 'left bottom+30'
		}
	});

	// Trigger background stars and get planet data
	guiOverview.onResize();
	guiExploration.onScroll();
	api.getPlanetData();
	
	// Slide in controls
	$('#overview_controls').css('right', guiOverview.controlsOffset);

	// Fade in intro hint
	setTimeout(function () {
		$('#hint_intro').css('opacity', 1);
	}, 2000);

});

// Reset scrolling position to prevent overview mode from 
// being out of view on page reload
$(window).on('beforeunload', function () {
	$(window).scrollTop(0);
});