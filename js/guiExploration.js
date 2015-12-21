var guiExploration = {

	containerElem: null,
	controlsOffset: 25,
	controlsHiddenOffset: -300,
	triggerMobileOffset: 300,
	hintScaleOffset: 750,
	starCoverage: 0,
	starCoverageStep: 2000,
	distanceLimits: [],
	scrollController: null,
	isActive: false,
	hintScaleShown: false,

	init: function () {

		guiExploration.isActive = true;

		$('#overview_controls').css('right', guiExploration.controlsHiddenOffset);
		$('#hint_intro').hide();
		$('#title').css('opacity', 0);

		TweenMax.to(guiOverview.containerElem, 1, {
			scale: 40,
			opacity: 0,
			ease: Quad.easeIn,
			onComplete: function () {

				$('#exploration_controls').css('right', guiExploration.controlsOffset);
				guiExploration.containerElem.css('opacity', 1);
				guiOverview.containerElem.hide();

				// Animate sun from top
				TweenMax.to($('#ex_sun_desktop'), 1, {
					attr: {
						cy: -1850
					},
					ease: Quad.easeOut,
					onComplete: function () {

						// Make page scrollable
						$('body').addClass('scrollable');

						// Update distance limits for scrolling
						guiExploration.calcDistanceLimits();

					}
				});

			}
		});

	},

	onResize: function () {

		var maxWidth = $(window).height() > $(window).width() ? $(window).width() : $(window).height();
		guiOverview.containerElem.width(maxWidth);

		// Make page mobile friendly if height > width
		if ($(window).height() > $(window).width() - guiExploration.triggerMobileOffset) {

			if (!browser.isMobile) {

				browser.isMobile = true;

				$('body').addClass('mobile');
				$('#overview_controls').css('height', 'auto');
				$('.ui-slider').slider('option', 'orientation', 'horizontal');

				if (guiExploration.isActive)
					guiOverview.init();

			}

		} else {

			if (browser.isMobile) {

				browser.isMobile = false;

				$(window).scrollTop(0);
				$('body').removeClass('mobile');
				$('.ui-slider').slider('option', 'orientation', 'vertical');

			}

			$('#overview_controls').css('height', $(window).height() - guiExploration.controlsOffset * 2);

		}

		// Update distance limits for scrolling
		guiExploration.calcDistanceLimits();

	},

	onScroll: function () {
		
		var scrollTop = $(window).scrollTop();

		// Generate new stars for background when scrolling down
		if (scrollTop >= guiExploration.starCoverage - guiExploration.starCoverageStep) {

			guiExploration.addStars(guiExploration.starCoverage);
			guiExploration.starCoverage += guiExploration.starCoverageStep;

		}

		// Set scrolling distance for fading in planet click hint
		if (!guiExploration.hintScaleShown && scrollTop > guiExploration.hintScaleOffset) {
			$('#hint_scale').css('opacity', 1);
			guiExploration.hintScaleShown = true;
		} else if (guiExploration.hintScaleShown && guiExploration.distanceLimits.length > 0 && scrollTop > guiExploration.distanceLimits[0].top + 1000) {
			$('#hint_scale').css('opacity', 0);
		}

		// Update distance from the sun
		guiExploration.updateDistanceMeter(scrollTop);

	},

	// Add data properties to object elements in exploration mode
	updateData: function () {

		if (!api.planetData)
			return;

		for (var i = 0; i < api.planetData.length; i++) {

			// Add attributes to all objects for exploration mode
			var objContainerElem = $('#ex_' + api.planetData[i].selector + '_container');
			var objDistance = api.planetData[i].is_planet == 1 && api.planetData[i].records ? api.planetData[i].records[52].distance : api.planetData[i].distance;
			var tooltipAlign = {
				my: 'left top',
				at: 'left+50 bottom'
			};

			$('<h1 />')
				.text(api.planetData[i].name)
				.addClass('headline')
				.appendTo(objContainerElem.find('.info'));

			$('<p />')
				.text(api.planetData[i].description)
				.addClass('description')
				.appendTo(objContainerElem.find('.info'));

			$('<div />')
				.addClass('summary')
				.appendTo(objContainerElem.find('.info'));

			if (objDistance > 0) {

				$('<div />')
					.text(helpers.round(objDistance, 1) + ' au')
					.addClass('distance')
					.appendTo(objContainerElem.find('.summary'))
					.attr('title', '')
					.tooltip({
						content: 'Distance from the sun<br>' + helpers.formatNumber(helpers.round(helpers.auToKm(objDistance), 0)) + ' km',
						position: tooltipAlign
					});

			}

			if (api.planetData[i].radius > 0) {

				$('<div />')
					.text(helpers.formatNumber(helpers.round(api.planetData[i].radius, 0)) + ' km')
					.addClass('radius')
					.appendTo(objContainerElem.find('.summary'))
					.attr('title', '')
					.tooltip({
						content: 'Equitorial radius',
						position: tooltipAlign
					});

			}

			if (api.planetData[i].orbital_period > 0) {

				$('<div />')
					.text(helpers.formatDays(api.planetData[i].orbital_period))
					.addClass('orbit')
					.appendTo(objContainerElem.find('.summary'))
					.attr('title', '')
					.tooltip({
						content: 'Orbital period',
						position: tooltipAlign
					});

			}

			if (api.planetData[i].surface_temperature_min != 0) {

				var tempRangeC = api.planetData[i].surface_temperature_min;
				var tempRangeF = helpers.round(helpers.cToF(api.planetData[i].surface_temperature_min), 0);
				var tempRangeK = helpers.round(helpers.cToK(api.planetData[i].surface_temperature_min), 0);

				if (api.planetData[i].surface_temperature_max != 0) {
					tempRangeC += ' - ' + api.planetData[i].surface_temperature_max + ' °C';
					tempRangeF += ' - ' + helpers.round(helpers.cToF(api.planetData[i].surface_temperature_max), 0) + ' °F';
					tempRangeK += ' - ' + helpers.round(helpers.cToK(api.planetData[i].surface_temperature_max), 0) + ' °K';
				} else {
					tempRangeC += ' °C';
					tempRangeF += ' °F';
					tempRangeK += ' °K';
				}

				$('<div />')
					.text(tempRangeC)
					.addClass('temperature')
					.appendTo(objContainerElem.find('.summary'))
					.attr('title', '')
					.tooltip({
						content: 'Temperature<br>' + tempRangeF + '<br>' + tempRangeK,
						position: tooltipAlign
					});

			}

			// Make object scaleable if it has a set relative radius. relative_radius
			// is relative to the radius of Jupiter since it's the largest planet.
			if (api.planetData[i].relative_radius > 0) {

				var objElem = objContainerElem.find('.planet');
				var objNormalizedWidth = objElem.width();
				var objWidth = objNormalizedWidth * api.planetData[i].relative_radius;
				var objMarginTop = objElem.attr('data-margin-top') ? objElem.attr('data-margin-top') : 0;

				objElem
					.css({
						maxWidth: objNormalizedWidth,
						marginTop: objMarginTop + 'px'
					})
					.data({
						width: objWidth,
						normalizedWidth: objNormalizedWidth,
						toScale: false
					});

				objElem[0].classList.add('scalable');


				// Bind click event to object for scaling
				objElem.click(guiExploration.setPlanetScale);

			}

		}

		if (browser.canUseParallax && !browser.isMobile)
			guiExploration.addParallax();

	},

	addParallax: function () {

		// Add parallax effect to the planets and planet descriptions
		$('.row').each(function (index, elem) {

			var isPlanet = $(elem).find('.planet').length > 0;

			var objElem = isPlanet ? $(elem).find('.planet') : $(elem).find('.belt');
			var infoElem = $(elem).find('.info');
			var rowHeight = $(elem).height();

			var tl = new TimelineMax();
			tl.fromTo(objElem, 1, {
					top: 0,
					left: -50
				}, {
					top: 400,
					left: isPlanet ? 0 : 50,
					ease: Power0.easeNone
				})
				.fromTo(infoElem, 1, {
					top: 0
				}, {
					top: 400,
					ease: Power0.easeNone
				}, '0')
				.fromTo(infoElem, 0.3, {
					opacity: 0
				}, {
					opacity: 1,
					ease: Power0.easeNone
				}, '0.1')
				.fromTo(infoElem.find('.headline'), 0.3, {
					marginBottom: 100
				}, {
					marginBottom: 20,
					ease: Power0.easeNone
				}, '0')
				.to(infoElem, 0.3, {
					opacity: 0,
					ease: Power0.easeNone
				}, '0.7');

			new ScrollMagic.Scene({
					triggerElement: elem,
					duration: 850 + rowHeight,
					offset: -250
				})
				.setTween(tl)
				//.addIndicators()
				.addTo(guiExploration.scrollController);

		});

		// Add parallax effect to sun description
		var tl = new TimelineMax();
		tl.fromTo($('#ex_sun_container .info'), 1, {
			top: 0
		}, {
			top: 200,
			ease: Power0.easeNone
		})
		tl.fromTo($('#ex_sun_container .info'), 0.4, {
			opacity: 1
		}, {
			opacity: 0,
			ease: Power0.easeNone
		}, '0.3');

		new ScrollMagic.Scene({
				triggerElement: '#ex_sun_container',
				duration: 1000,
				offset: 400
			})
			.setTween(tl)
			//.addIndicators()
			.addTo(guiExploration.scrollController);

	},

	// Add new star elements to the DOM
	addStars: function (offset) {

		$('<div />')
			.attr('id', 'stars_' + offset)
			.addClass('stars layer1 add-parallax')
			.css('transform', 'translateY(' + offset + 'px)')
			.data('parallax-top', 200)
			.appendTo('#star_container');

		$('<div />')
			.addClass('stars layer2')
			.css('transform', 'translateY(' + offset + 'px)')
			.data('parallax-top', 200)
			.appendTo('#star_container');

		$('<div />')
			.addClass('stars layer3 add-parallax')
			.css('transform', 'translateY(' + offset + 'px)')
			.data('parallax-top', 300)
			.appendTo('#star_container');

		var starContainer = $('#star_container');
		
		// Animate bg on startup
		if (starContainer.css('opacity') !== 1)
			starContainer.animate({ opacity: 1 }, 250);
		
		if (browser.canUseParallax)
			guiExploration.addStarsParallax(offset);

	},

	// Add parallax effect to star elements
	addStarsParallax: function (offset) {

		$('#star_container .add-parallax').each(function (index, elem) {

			$(elem).removeClass('add-parallax');

			new ScrollMagic.Scene({
					triggerElement: '#star_container',
					duration: guiExploration.starCoverageStep,
					offset: offset
				})
				.setTween(elem, {
					top: $(elem).data('parallax-top')
				})
				//.addIndicators()
				.addTo(guiExploration.scrollController);

		});

	},

	setPlanetScale: function () {

		var objElem = $(this);
		objElem.data('toScale', !objElem.data('toScale'));

		guiExploration.updatePlanetModel(objElem);

	},

	// Animate the planet model to it's scale/non-scale version
	updatePlanetModel: function (objElem) {

		var newWidth = objElem.data('toScale') ? objElem.data('width') : objElem.data('normalizedWidth');
		var marginTop = objElem.attr('data-margin-top') ? objElem.attr('data-margin-top') : 0;
		var marginTopScaled = newWidth / objElem.data('normalizedWidth') * marginTop;

		objElem.css({
			maxWidth: newWidth,
			marginTop: objElem.data('normalizedWidth') / 2 - newWidth / 2 + marginTopScaled
		});

	},

	calcDistanceLimits: function () {

		if (!api.planetData)
			return;

		guiExploration.distanceLimits = [];

		for (var i = 0; i < api.planetData.length; i++) {

			var objContainerElem = $('#ex_' + api.planetData[i].selector + '_container');

			// Get todays distance for planets that we have records for,
			// otherwise get the "static" distance
			var objTop = objContainerElem.offset().top;
			var objDistance = api.planetData[i].is_planet == 1 && api.planetData[i].records ? api.planetData[i].records[52].distance : api.planetData[i].distance;

			if (objDistance > 0)
				guiExploration.distanceLimits.push({
					top: objTop,
					distance: objDistance
				});

		}

		// Sort by top offset
		guiExploration.distanceLimits.sort(function (a, b) {
			if (a.top < b.top) return -1;
			if (a.top > b.top) return 1;
			return 0;
		});

	},

	// Calculate current distance from the sun and update the distance meter
	updateDistanceMeter: function (scrollTop) {

		var distance = 0;

		for (var i = 0; i < guiExploration.distanceLimits.length; i++) {

			var prevTop = i > 0 ? guiExploration.distanceLimits[i - 1].top : 0;
			var prevDistance = i > 0 ? guiExploration.distanceLimits[i - 1].distance : 0;
			var newTop = guiExploration.distanceLimits[i].top;
			var newDistance = guiExploration.distanceLimits[i].distance;
			var deltaScrollTop = scrollTop - prevTop;
			var deltaTop = newTop - prevTop;
			var deltaDistance = newDistance - prevDistance;

			if (scrollTop <= newTop) {
				distance += deltaDistance / deltaTop * deltaScrollTop;
				break;
			}

			distance += deltaDistance;

		}

		if ($('#distance_meter .value').tooltip('instance')) {
			$('#distance_meter .value').attr('title', '').tooltip('destroy');
		}

		$('#distance_meter .value').tooltip({
			content: helpers.formatNumber(helpers.round(helpers.auToKm(distance), 0)) + ' km<br><span class="text-small">(1 astronomical unit = ' + helpers.formatNumber(helpers.auKm) + ' km)</span>',
			position: {
				my: 'center bottom-50',
				at: 'center top'
			}
		});

		$('#distance_au').text(helpers.round(distance, 1));

	}

}