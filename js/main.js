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

	browser.canAnimateRadius = bowser.chrome && !bowser.mobile;
	browser.canUseParallax = !bowser.safari && !bowser.mobile;

	// Bind UI events
	$(window).mousewheel(guiOverview.onMouseWheel);
	$('#btn_overview').click(guiOverview.init);
	$('#btn_orbit_scale').click(guiOverview.setOrbitScale);
	$(window).resize(guiExploration.onResize);
	$(window).scroll(guiExploration.onScroll);
	$('#btn_explore').click(guiExploration.init);

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
	guiExploration.onResize();
	guiExploration.onScroll();
	api.getPlanetData();

	// Fade in intro hint
	setTimeout(function () {
		$('#hint_intro').css('opacity', 1);
	}, 1500);

});

// Reset scrolling position to prevent overview mode from 
// being out of view on page reload
$(window).on('beforeunload', function () {
	$(window).scrollTop(0);
});
