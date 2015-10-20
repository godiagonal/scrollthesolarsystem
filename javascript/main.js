var planetData,
    distanceLimits = [],
    hcContainerElem,
    exContainerElem,
    viewboxWidth,
    isMobile = false,
    isExplorationMode = false,
    orbitsToScale = false,
    starCoverage = 0,
    scrollController,
    scrollDownDelta = 0,
    browserCanAnimateRadius,
    browserCanUseParallax,
    hintScaleShown = false;

// Constants
var planetMinRadius = 3,
    planetMaxRadius = 10,
    sunMinRadius = 2,
    sunMaxRadius = 25,
    maxDistance = 32, // The approximate orbit radius of Neptune in AU
    triggerMobileOffset = 300,
    controlsOffset = 25,
    controlsHiddenOffset = -300,
    starCoverageStep = 2000,
    auKm = 149597871, // The km distance equal to 1 AU
    hintScaleOffset = 750;

$(function() {
    
    hcContainerElem = $('#heliocentric_container');
    exContainerElem = $('#exploration_container');
    viewboxWidth = hcContainerElem[0].getAttribute('viewBox').split(' ')[2];
    
    scrollController = new ScrollMagic.Controller();
    
    browserCanAnimateRadius = bowser.chrome && !bowser.mobile;
    browserCanUseParallax = !bowser.safari && !bowser.mobile;
    
    // Bind UI events
    $(window).resize(onResize);
    $(window).scroll(onScroll);
    $(window).mousewheel(onMouseWheel);
    $('#btn_explore').click(initExplorationMode);
    $('#btn_overview').click(initOverviewMode);
    $('#btn_orbit_scale').click(setOrbitScale);
    
    // Init slider with 2 year time span divided into weeks (today in the middle)
    $('#slider_date').slider({
        orientation: 'vertical',
        min: 0,
        max: 104,
        value: 52,
        slide: onSlide
    });
    
    onResize();
    onScroll();
    getPlanetData();
    
    // Fade in intro hint
    setTimeout(function() {
        $('#hint_intro').css('opacity', 1);
    }, 1500);
    
});



/* EVENT CALLBACKS */



// Reset scrolling position to prevent overview mode from 
// being out of view on page reload
$(window).on('beforeunload', function() {
    
    $(window).scrollTop(0);
    
});

var onResize = function() {
    
    var maxWidth = $(window).height() > $(window).width() ? $(window).width() : $(window).height();
    hcContainerElem.width(maxWidth);
    
    // Make page mobile friendly if height > width
    if ($(window).height() > $(window).width() - triggerMobileOffset) {
        
        if (!isMobile) {
            
            isMobile = true;

            $('body').addClass('mobile');
            $('#heliocentric_controls').css('height', 'auto');
            $('.ui-slider').slider('option', 'orientation', 'horizontal');

            if (isExplorationMode)
                initOverviewMode();
            
        }
        
    }
    else {
        
        if (isMobile) {
        
            isMobile = false;

            $(window).scrollTop(0);
            $('body').removeClass('mobile');
            $('.ui-slider').slider('option', 'orientation', 'vertical');

        }
        
        $('#heliocentric_controls').css('height', $(window).height() - controlsOffset * 2);
        
    }
    
    // Update distance limits for scrolling
    calcDistanceLimits();
    
}

var onScroll = function() {
    
    var scrollTop = $(this).scrollTop();
    
    // Generate new stars for background when scrolling down
    if (scrollTop >= starCoverage - starCoverageStep) {
        
        addStarElements(starCoverage);
        starCoverage += starCoverageStep;
        
    }
    
    // Set scrolling distance for fading in planet click hint
    if (!hintScaleShown && scrollTop > hintScaleOffset) {
        $('#hint_scale').css('opacity', 1);
        hintScaleShown = true;
    }
    else if (hintScaleShown && distanceLimits.length > 0 && scrollTop > distanceLimits[0].top + 1000) {
        $('#hint_scale').css('opacity', 0);
    }
    
    // Update distance from the sun
    updateDistanceMeter(scrollTop);
    
}

var onMouseWheel = function(event) {

    // Init exploration mode when scrolling down in overview mode
    if (!isExplorationMode && !isMobile) {

        var down = event.deltaY < 0;

        if (down)
            scrollDownDelta++;

        if (scrollDownDelta > 50) {
            scrollDownDelta = 0;
            initExplorationMode();
        }

    }

}

var onSlide = function(event, ui) {
    
    // Move planets to new location based on selected week
    updateOverviewElements(ui.value, true);
    
}

var setOrbitScale = function() {
    
    var text = $(this).val();
    $(this).val($(this).data('toggle-value')).data('toggle-value', text);
    
    orbitsToScale = !orbitsToScale;
    updateOverviewModel();
    
}

var setPlanetScale = function() {
    
    var objElem = $(this).find('.planet');
    objElem.data('toScale', !objElem.data('toScale'));
    
    updatePlanetModel(this);
    
}

var getPlanetData = function() {
    
    $.getJSON('data.php', function(data) {
        
        planetData = data;
        updateOverviewElements();
        updateExplorationElements();
        
    }).fail(function() {
        
        alert('An error occured when loading planetary data.');
        
    });
    
}



/* DOM MANIPULATION */



// Add data properties to planet elements in overview mode
var updateOverviewElements = function(week, noTransition) {
    
    if (!planetData)
        return;
    
    week = typeof week !== 'undefined' ? week : 52;
    
    var orbitRatio = viewboxWidth / 2 / maxDistance;
    
    for (var i = 0; i < planetData.length; i++) {
        
        // Only add attributes to planets that are shown in overview mode
        if (planetData[i].is_planet == 1) {

            var planetElem = $('#hc_' + planetData[i].selector);
            var orbitElem = $('#hc_' + planetData[i].selector + '_orbit');

            var radius = orbitRatio * planetData[i].records[week].distance;

            // This assumes there are 8 planets and compensates for the radius of the sun
            var normalizedRadius = viewboxWidth / 2 / 9 * planetData[i].order + sunMaxRadius;

            planetElem.data({
                radius: radius,
                normalizedRadius: normalizedRadius,
                angle: planetData[i].records[week].elon
            });

            orbitElem.data({
                radius: radius,
                normalizedRadius: normalizedRadius
            });
            
        }
        
    }
    
    updateOverviewModel(noTransition);
    
}

// Add data properties to object elements in exploration mode
var updateExplorationElements = function() {
    
    if (!planetData)
        return;
    
    for (var i = 0; i < planetData.length; i++) {
            
        // Add attributes to all objects for exploration mode
        var objContainerElem = $('#ex_' + planetData[i].selector + '_container');
        var objDistance = planetData[i].is_planet == 1 && planetData[i].records
                                ? planetData[i].records[52].distance
                                : planetData[i].distance;
        var tooltipAlign = { my: 'left top', at: 'left+50 bottom' };
        
        $('<h1 />')
            .text(planetData[i].name)
            .addClass('headline')
            .appendTo(objContainerElem.find('.info'));
        
        $('<p />')
            .text(planetData[i].description)
            .addClass('description')
            .appendTo(objContainerElem.find('.info'));
        
        $('<div />')
            .addClass('summary')
            .appendTo(objContainerElem.find('.info'));
        
        if (objDistance > 0) {
            
            $('<div />')
                .text(round(objDistance, 1) + ' au')
                .addClass('distance')
                .appendTo(objContainerElem.find('.summary'))
                .attr('title', '')
                .tooltip({
                    content: 'Distance from the sun<br>' + formatNumber(round(auToKm(objDistance), 0)) + ' km',
                    position: tooltipAlign
                });
            
        }
        
        if (planetData[i].radius > 0) {
            
            $('<div />')
                .text(formatNumber(round(planetData[i].radius, 0)) + ' km')
                .addClass('radius')
                .appendTo(objContainerElem.find('.summary'))
                .attr('title', '')
                .tooltip({
                    content: 'Equitorial radius',
                    position: tooltipAlign
                });
            
        }
        
        if (planetData[i].orbital_period > 0) {
            
            $('<div />')
                .text(formatDays(planetData[i].orbital_period))
                .addClass('orbital-period')
                .appendTo(objContainerElem.find('.summary'))
                .attr('title', '')
                .tooltip({
                    content: 'Orbital period',
                    position: tooltipAlign
                });
            
        }
        
        if (planetData[i].surface_temperature_min != 0) {
            
            var tempRangeC = planetData[i].surface_temperature_min;
            var tempRangeF = round(cToF(planetData[i].surface_temperature_min), 0);
            var tempRangeK = round(cToK(planetData[i].surface_temperature_min), 0);
            
            if (planetData[i].surface_temperature_max != 0) {
                tempRangeC += ' - ' + planetData[i].surface_temperature_max + ' °C';
                tempRangeF += ' - ' + round(cToF(planetData[i].surface_temperature_max), 0) + ' °F';
                tempRangeK += ' - ' + round(cToK(planetData[i].surface_temperature_max), 0) + ' °K';
            }
            else {
                tempRangeC += ' °C';
                tempRangeF += ' °F';
                tempRangeK += ' °K';
            }
            
            $('<div />')
                .text(tempRangeC)
                .addClass('radius')
                .appendTo(objContainerElem.find('.summary'))
                .attr('title', '')
                .tooltip({
                    content: 'Temperature<br>' + tempRangeF + '<br>' + tempRangeK,
                    position: tooltipAlign
                });
            
        }
        
        
        
        // Make object scaleable if it has a set relative radius. relative_radius
        // is relative to the radius of Jupiter since it's the largest planet.
        if (planetData[i].relative_radius > 0) {
            
            var objElem = objContainerElem.find('.planet');
            var objSvgElem = objContainerElem.find('.planet-container');
            var objViewboxWidth = objSvgElem[0].getAttribute('viewBox').split(' ')[2];
            var objNormalizedRadius = objViewboxWidth / 2;
            var objRadius = objNormalizedRadius * planetData[i].relative_radius;
            
            objElem
                .attr({
                    r: objNormalizedRadius
                })
                .data({
                    radius: objRadius,
                    normalizedRadius: objNormalizedRadius,
                    toScale: false
                });
            
            objSvgElem[0].classList.add('scalable');
            
            // Bind click event to object for scaling
            objSvgElem.click(setPlanetScale);
            
        }
        
    }
    
    if (browserCanUseParallax && !isMobile)
        addExplorationParallax();
    
}

// Add new star elements to the DOM
var addStarElements = function(offset) {
    
    //console.log('Added stars from ' + offset + 'px to ' + (offset + starCoverageStep) + 'px');
    //console.log('Current offset is ' + $(window).scrollTop() + 'px');
    
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
    
    if (browserCanUseParallax)
        addStarsParallax(offset);
    
}

// Calculate current distance from the sun and update the distance meter
var updateDistanceMeter = function(scrollTop) {
    
    var distance = 0;
         
    for (var i = 0; i < distanceLimits.length; i++) {
        
        var prevTop = i > 0 ? distanceLimits[i-1].top : 0;
        var prevDistance = i > 0 ? distanceLimits[i-1].distance : 0;
        var newTop = distanceLimits[i].top;
        var newDistance = distanceLimits[i].distance;
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
        $('#distance_meter .value').attr('title','').tooltip('destroy');
    }
    
    $('#distance_meter .value').tooltip({
        content: formatNumber(round(auToKm(distance), 0)) + ' km<br><span class="text-small">(1 astronomical unit = ' + formatNumber(auKm) + ' km)</span>',
        position: { my: 'center bottom-50', at: 'center top' }
    });
    
    $('#distance_au').text(round(distance, 1));
    
}



/* ANIMATION AND PARALLAX EFFECTS */



// Animate the overview model to it's scale/non-scale version
// Every animation is covered both by a css transition (chrome) and a GSAP
// tween (firefox, safari) to cover functionality in all major browsers
var updateOverviewModel = function(noTransition) {
    
    // Don't do any transitioning effects if the update was triggered by the slider
    if (noTransition) {
        
        // jQuery's .addClass doesn't work here, don't know why...
        hcContainerElem[0].classList.add('no-transition');
        
        // Update sun
        $('#hc_sun').attr({ r: orbitsToScale ? sunMinRadius : sunMaxRadius });
        
        // Update orbits
        hcContainerElem.find('.orbit').each(function(index, elem) {
            
            var newRadius = orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
            $(elem).attr({ r: newRadius });
            
        });
        
        // Update planets
        hcContainerElem.find('.planet').each(function(index, elem) {
            
            var newOrbitRadius = orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
            var newRadius = orbitsToScale ? planetMinRadius : planetMaxRadius;
            var newAngle = $(elem).data('angle');
            
            $(elem)
                .attr({ r: newRadius })
                .css({ transform: 'rotate(-' + newAngle + 'deg) translateX(' + newOrbitRadius + 'px) rotate(' + newAngle + 'deg)' });
            
        });

    }
    
    // Do transitioning effects
    else {
        
        hcContainerElem[0].classList.remove('no-transition');
    
        // Update sun
        if (browserCanAnimateRadius)
            $('#hc_sun').css({ r: orbitsToScale ? sunMinRadius : sunMaxRadius });
        else
            TweenMax.to($('#hc_sun'), 1, { attr: { r: orbitsToScale ? sunMinRadius : sunMaxRadius }, ease: Quad.easeInOut });

        // Update orbits
        hcContainerElem.find('.orbit').each(function(index, elem) {

            var newRadius = orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
            
            if (browserCanAnimateRadius)
                $(elem).css({ r: newRadius });
            else
                TweenMax.to($(elem), 1, { attr: { r: newRadius }, ease: Quad.easeInOut });

        });
        
        // Update planets
        hcContainerElem.find('.planet').each(function(index, elem) {

            var newOrbitRadius = orbitsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
            var newRadius = orbitsToScale ? planetMinRadius : planetMaxRadius;
            var newAngle = $(elem).data('angle');

            // Transform can be transitioned by css in all browsers
            $(elem).css({ transform: 'rotate(-' + newAngle + 'deg) translateX(' + newOrbitRadius + 'px) rotate(' + newAngle + 'deg)' });
            
            if (browserCanAnimateRadius)
                $(elem).css({ r: newRadius });
            else
                TweenMax.to($(elem), 1, { attr: { r: newRadius }, ease: Quad.easeInOut });

        });
        
    }
    
}

// Animate the planet model to it's scale/non-scale version
var updatePlanetModel = function(elem) {
    
    var objElem = $(elem).find('.planet')
    var newRadius = objElem.data('toScale') ? objElem.data('radius') : objElem.data('normalizedRadius');

    if (browserCanAnimateRadius)
        objElem.css({ r: newRadius });
    else
        TweenMax.to(objElem, 1, { attr: { r: newRadius }, ease: Quad.easeInOut });
    
}

// Add parallax effect to star elements
var addStarsParallax = function(offset) {
    
    $('#star_container .add-parallax').each(function(index, elem) {
        
        $(elem).removeClass('add-parallax');
        
        new ScrollMagic.Scene({
                triggerElement: '#star_container',
                duration: starCoverageStep,
                offset: offset
            })
            .setTween(elem, { top: $(elem).data('parallax-top') })
            //.addIndicators()
            .addTo(scrollController);
        
    });
    
}

var addExplorationParallax = function() {
    
    // Add parallax effect to the planets and planet descriptions
    $('.row').each(function(index, elem) {
        
        var planetElem = $(elem).find('.planet-container');
        var infoElem = $(elem).find('.info');
        var rowHeight = $(elem).height();
        
        var tl = new TimelineMax();
            tl.fromTo(planetElem, 1, { top: 0, left: -50 }, { top: 400, left: 0, ease: Power0.easeNone })
              .fromTo(infoElem, 1, { top: 0 }, { top: 400, ease: Power0.easeNone }, '0')
              .fromTo(infoElem, 0.3, { opacity: 0 }, { opacity: 1, ease: Power0.easeNone }, '0.1')
              .fromTo(infoElem.find('.headline'), 0.3, { marginBottom: 100 }, { marginBottom: 20, ease: Power0.easeNone }, '0')
              .to(infoElem, 0.3, { opacity: 0, ease: Power0.easeNone }, '0.7');

        new ScrollMagic.Scene({
                triggerElement: elem,
                duration: 850 + rowHeight,
                offset: -250
            })
            .setTween(tl)
            //.addIndicators()
            .addTo(scrollController);
            
    });
    
    // Add parallax effect to sun description
    var tl = new TimelineMax();
        tl.fromTo($('#ex_sun_container .info'), 1, { top: 0 }, { top: 200, ease: Power0.easeNone })
        tl.fromTo($('#ex_sun_container .info'), 0.4, { opacity: 1 }, { opacity: 0, ease: Power0.easeNone }, '0.3');

    new ScrollMagic.Scene({
            triggerElement: '#ex_sun_container',
            duration: 1000,
            offset: 400
        })
        .setTween(tl)
        //.addIndicators()
        .addTo(scrollController);
    
}



/* UI STATE SWITCHING */



// Init exploration mode
var initExplorationMode = function() {
    
    isExplorationMode = true;
    
    $('#heliocentric_controls').css('right', controlsHiddenOffset);
    $('#hint_intro').hide();
    $('#title').css('opacity', 0);
    
    TweenMax.to(hcContainerElem, 1, {
        scale: 40,
        opacity: 0,
        ease: Quad.easeIn,
        onComplete: function() {
            
            $('#exploration_controls').css('right', controlsOffset);
            exContainerElem.css('opacity', 1);
            hcContainerElem.hide();

            // Animate sun from top
            TweenMax.to($('#ex_sun_desktop'), 1, {
                attr: { cy: -1850 },
                ease: Quad.easeOut,
                onComplete: function() {
                    
                    // Make page scrollable
                    $('body').addClass('scrollable');
                    
                    // Update distance limits for scrolling
                    calcDistanceLimits();
                    
                }
            });
            
        }
    });
    
}

var initOverviewMode = function() {
    
    isExplorationMode = false;
    
    $(window).scrollTop(0);
    $('body').removeClass('scrollable');
    
    $('#exploration_controls').css('right', controlsHiddenOffset);
    $('#ex_sun_desktop').attr('cy', -2000);
    $('#title').css('opacity', 1);
    hcContainerElem.show();
    
    if (!isMobile)
        exContainerElem.css('opacity', 0);
    
    TweenMax.to(hcContainerElem, 1, {
        scale: 1,
        opacity: 1,
        ease: Quad.easeInOut,
        onComplete: function() {
            
            $('#heliocentric_controls').css('right', controlsOffset);
            
        }
    });
    
}



/* EXTENSIONS */



var round = function(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

var formatNumber = function(number) {
    return Math.max(0, number).toFixed(0).replace(/(?=(?:\d{3})+$)(?!^)/g, ' ');
}

var formatDays = function(days) {
    return days > 730 ? formatNumber(round(days / 365, 1)) + ' years' : formatNumber(days) + ' days';
}

var auToKm = function(au) {
    return au * auKm;
}

var cToF = function(c) {
    return c * 9 / 5 + 32;
}

var cToK = function(c) {
    return Number(c) + 273;
}

var calcDistanceLimits = function() {

    if (!planetData)
        return;
    
    distanceLimits = [];
    
    for (var i = 0; i < planetData.length; i++) {
     
        var objContainerElem = $('#ex_' + planetData[i].selector + '_container');
        
        // Get todays distance for planets that we have records for,
        // otherwise get the "static" distance
        var objTop = objContainerElem.offset().top;
        var objDistance = planetData[i].is_planet == 1 && planetData[i].records
                                ? planetData[i].records[52].distance
                                : planetData[i].distance;
        
        if (objDistance > 0)
            distanceLimits.push({ top: objTop, distance: objDistance });
        
    }
    
    // Sort by top offset
    distanceLimits.sort(function(a, b) {
        if(a.top < b.top) return -1;
        if(a.top > b.top) return 1;
        return 0;
    });
    
}