var planetData,
    hcContainerElem,
    exContainerElem,
    viewboxWidth,
    isMobile = false,
    isExplorationMode = false,
    orbitsToScale = false,
    planetsToScale = false,
    starCoverage = 0,
    scrollController,
    scrollDownDelta = 0,
    browserCanAnimateRadius,
    browserCanUseParallax;

// Constants
var planetMinRadius = 3,
    planetMaxRadius = 10,
    sunMinRadius = 2,
    sunMaxRadius = 25,
    maxDistance = 32, // The approximate orbit radius of Neptune in AU
    triggerMobileOffset = 300,
    controlsOffset = 25,
    controlsHiddenOffset = -300,
    starCoverageStep = 2000;

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
    $('#btn_orbit_scale').click(setOrbitScale);
    $('#btn_planet_scale').click(setPlanetScale);
    $('#btn_explore').click(initExplorationMode);
    $('#btn_overview').click(initOverviewMode);
    
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
    
});

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
            $('.controls').css('height', 'auto');
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
            $('.controls').css('height', $(window).height() - controlsOffset * 2);
            $('.ui-slider').slider('option', 'orientation', 'vertical');

        }
        
    }
    
}

var onScroll = function() {
    
    var scrollTop = $(this).scrollTop();
    
    // Generate new stars for background when scrolling down
    if (scrollTop >= starCoverage - starCoverageStep) {
        
        addStars(starCoverage);
        starCoverage += starCoverageStep;
        
    }
    
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
    
    updateOverviewElements(ui.value, true);
    
}

var setOrbitScale = function() {
    
    var text = $(this).val();
    $(this).val($(this).data('toggle-value')).data('toggle-value', text);
    
    orbitsToScale = !orbitsToScale;
    updateOverviewModel();
    
}

var setPlanetScale = function() {
    
    var text = $(this).val();
    $(this).val($(this).data('toggle-value')).data('toggle-value', text);
    
    planetsToScale = !planetsToScale;
    updateExplorationModel();
    
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



// Add new star elements to the DOM
var addStars = function(offset) {
    
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

// Add data properties to object elements in exploration mode
var updateExplorationElements = function() {
    
    if (!planetData)
        return;
    
    for (var i = 0; i < planetData.length; i++) {
            
        // Add attributes to all objects for exploration mode
        var objContainerElem = $('#ex_' + planetData[i].selector + '_container');
        
        $('<h1 />')
            .text(planetData[i].name)
            .addClass('headline')
            .appendTo(objContainerElem.find('.info'));
        
        $('<p />')
            .text(planetData[i].description)
            .addClass('description')
            .appendTo(objContainerElem.find('.info'));
        
        $('<div />')
            .text(planetData[i].distance + ' / ' + planetData[i].orbital_period + ' / ' + planetData[i].radius + ' / ' + planetData[i].surface_temperature)
            .addClass('summary')
            .appendTo(objContainerElem.find('.info'));
        
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
                    normalizedRadius: objNormalizedRadius
                });
            
            objElem[0].classList.add('scalable');
            
        }
        
    }
    
    if (browserCanUseParallax)
        addExplorationParallax();
    
}

var addExplorationParallax = function() {
    
    // Add parallax effect to the planets and planet descriptions
    $('.row').each(function(index, elem) {
        
        var planetElem = $(elem).find('.planet-container');
        var infoElem = $(elem).find('.info')
        
        var tl = new TimelineMax();
            tl.fromTo(planetElem, 1, { top: 0, left: -50 }, { top: 300, left: 0 })
              .fromTo(infoElem, 1, { top: 0 }, { top: 300 }, '0')
              .fromTo(infoElem.find('.headline'), 0.5, { marginBottom: 100 }, { marginBottom: 20 }, '0')
              .fromTo(infoElem.find('.headline'), 0.3, { opacity: 0 }, { opacity: 1 }, '0')
              .fromTo(infoElem.find('.description'), 0.5, { opacity: 0 }, { opacity: 1 }, '0')
              .to(infoElem, 0.2, { opacity: 0 }, '0.8');

        new ScrollMagic.Scene({
                triggerElement: elem,
                duration: 1300,
                offset: -250
            })
            .setTween(tl)
            //.addIndicators()
            .addTo(scrollController);
            
    });
    
    // Add parallax effect to sun description
    var tl = new TimelineMax();
        tl.fromTo($('#ex_sun_container .info'), 1, { opacity: 1, top: 0 }, { opacity: 0, top: 100 });

    new ScrollMagic.Scene({
            triggerElement: '#ex_sun_container',
            duration: 1000,
            offset: 400
        })
        .setTween(tl)
        //.addIndicators()
        .addTo(scrollController);
    
}

// Animate the exploration model to it's scale/non-scale version
var updateExplorationModel = function() {
    
    exContainerElem.find('.scalable').each(function(index, elem) {
        
        var newRadius = planetsToScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
        
        if (browserCanAnimateRadius)
            $(elem).css({ r: newRadius });
        else
            TweenMax.to($(elem), 1, { attr: { r: newRadius }, ease: Quad.easeInOut });
        
    });
    
}




// Init exploration mode
var initExplorationMode = function() {
    
    isExplorationMode = true;
    
    $('#heliocentric_controls').css('right', controlsHiddenOffset);
    $('#intro').css('opacity', 0);
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
                    $('body').addClass('scrollable');
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
    $('#title').css('opacity', 1);
    $('#ex_sun_desktop').attr('cy', -2000);
    exContainerElem.css('opacity', 0);
    hcContainerElem.show();
    
    TweenMax.to(hcContainerElem, 1, {
        scale: 1,
        opacity: 1,
        ease: Quad.easeInOut,
        onComplete: function() {
            
            $('#heliocentric_controls').css('right', controlsOffset);
            
        }
    });
    
}

var round = function(value, decimals) {
    
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    
}
