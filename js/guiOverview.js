var guiOverview = {

	containerElem: null,
	controlsOffset: 25,
	controlsHiddenOffset: -300,
	planetMinRadius: 3,
	planetMaxRadius: 10,
	sunMinRadius: 2,
	sunMaxRadius: 25,
	maxDistance: 32, // The approximate orbit radius of Neptune in AU
	scrollDownDelta: 0,
	viewboxWidth: 0,
	orbitsToScale: false,

	init: function () {

		guiExploration.isActive = false;

		$(window).scrollTop(0);
		$('body').removeClass('scrollable');

		$('#exploration_controls').css('right', guiOverview.controlsHiddenOffset);
		$('#ex_sun_desktop').attr('cy', -2000);
		$('#title').css('opacity', 1);
		guiOverview.containerElem.show();

		if (!browser.isMobile)
			guiExploration.containerElem.css('opacity', 0);

		TweenMax.to(guiOverview.containerElem, 1, {
			scale: 1,
			opacity: 1,
			ease: Quad.easeInOut,
			onComplete: function () {

				$('#overview_controls').css('right', guiOverview.controlsOffset);

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

	onMouseWheel: function (event) {

		// Init exploration mode when scrolling down in overview mode
		if (!guiExploration.isActive && !browser.isMobile) {

			var down = event.deltaY < 0;

			if (down)
				guiOverview.scrollDownDelta++;

			if (guiOverview.scrollDownDelta > 50) {
				guiOverview.scrollDownDelta = 0;
				guiExploration.init();
			}

		}

	},

	onSlide: function (event, ui) {

		// Move planets to new location based on selected week
		guiOverview.updateData(ui.value, true);

	},

	// Add data properties to planet elements in overview mode
	updateData: function (week, noTransition) {

		if (!api.planetData)
			return;

		week = typeof week !== 'undefined' ? week : 52;

		var orbitRatio = guiOverview.viewboxWidth / 2 / guiOverview.maxDistance;

		for (var i = 0; i < api.planetData.length; i++) {

			// Only add attributes to planets that are shown in overview mode
			if (api.planetData[i].is_planet == 1) {

				var planetElem = $('#ov_' + api.planetData[i].selector);
				var orbitElem = $('#ov_' + api.planetData[i].selector + '_orbit');

				var radius = orbitRatio * api.planetData[i].records[week].distance;

				// This assumes there are 8 planets and compensates for the radius of the sun
				var normalizedRadius = guiOverview.viewboxWidth / 2 / 9 * api.planetData[i].order + guiOverview.sunMaxRadius;

				planetElem.data({
					radius: radius,
					normalizedRadius: normalizedRadius,
					angle: api.planetData[i].records[week].elon
				});

				orbitElem.data({
					radius: radius,
					normalizedRadius: normalizedRadius
				});

			}

		}

		guiOverview.updateModel(noTransition);

	},

	// Animate the overview model to it's scale/non-scale version
	// Every animation is covered both by a css transition (chrome) and a GSAP
	// tween (firefox, safari) to cover functionality in all major browsers
	updateModel: function (noTransition) {

		// Don't do any transitioning effects if the update was triggered by the slider
		if (noTransition) {

			// jQuery's .addClass doesn't work here, don't know why...
			guiOverview.containerElem[0].classList.add('no-transition');

			// Update sun
			$('#ov_sun').attr({
				r: guiOverview.orbitsToScale ? guiOverview.sunMinRadius : guiOverview.sunMaxRadius
			});

			// Update orbits
			guiOverview.containerElem.find('.orbit').each(function (index, elem) {

				var newRadius = guiOverview.orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
				$(elem).attr({
					r: newRadius
				});

			});

			// Update planets
			guiOverview.containerElem.find('.planet').each(function (index, elem) {

				var newOrbitRadius = guiOverview.orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
				var newRadius = guiOverview.orbitsToScale ? guiOverview.planetMinRadius : guiOverview.planetMaxRadius;
				var newAngle = $(elem).data('angle');

				$(elem)
					.attr({
						r: newRadius
					})
					.css({
						transform: 'rotate(-' + newAngle + 'deg) translateX(' + newOrbitRadius + 'px) rotate(' + newAngle + 'deg)'
					});

			});

		}

		// Do transitioning effects
		else {

			guiOverview.containerElem[0].classList.remove('no-transition');

			// Update sun
			if (browser.canAnimateRadius)
				$('#ov_sun').css({
					r: guiOverview.orbitsToScale ? guiOverview.sunMinRadius : guiOverview.sunMaxRadius
				});
			else
				TweenMax.to($('#ov_sun'), 1, {
					attr: {
						r: guiOverview.orbitsToScale ? guiOverview.sunMinRadius : guiOverview.sunMaxRadius
					},
					ease: Quad.easeInOut
				});

			// Update orbits
			guiOverview.containerElem.find('.orbit').each(function (index, elem) {

				var newRadius = guiOverview.orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');

				if (browser.canAnimateRadius)
					$(elem).css({
						r: newRadius
					});
				else
					TweenMax.to($(elem), 1, {
						attr: {
							r: newRadius
						},
						ease: Quad.easeInOut
					});

			});

			// Update planets
			guiOverview.containerElem.find('.planet').each(function (index, elem) {

				var newOrbitRadius = guiOverview.orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
				var newRadius = guiOverview.orbitsToScale ? guiOverview.planetMinRadius : guiOverview.planetMaxRadius;
				var newAngle = $(elem).data('angle');

				// Transform can be transitioned by css in all browsers
				$(elem).css({
					transform: 'rotate(-' + newAngle + 'deg) translateX(' + newOrbitRadius + 'px) rotate(' + newAngle + 'deg)'
				});

				if (browser.canAnimateRadius)
					$(elem).css({
						r: newRadius
					});
				else
					TweenMax.to($(elem), 1, {
						attr: {
							r: newRadius
						},
						ease: Quad.easeInOut
					});

			});

		}

	},

	setOrbitScale: function () {

		var text = $(this).val();
		$(this).val($(this).data('toggle-value')).data('toggle-value', text);

		guiOverview.orbitsToScale = !guiOverview.orbitsToScale;
		guiOverview.updateModel();

	},

}