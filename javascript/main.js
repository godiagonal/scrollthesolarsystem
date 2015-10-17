var planetData,
    hcContainerElem,
    exContainerElem,
    sunElem,
    viewboxWidth,
    toScale = false,
    isMobile = false,
    isExplorationMode = false,
    starCoverage = 0,
    scrollController,
    scrollDownDelta = 0;

// Constants
var planetMin = 3,
    planetMax = 10,
    sunMin = 2,
    sunMax = 25,
    controlsOffset = 25,
    controlsHiddenOffset = -300,
    starCoverageStep = 2000;

$(function() {
    
    hcContainerElem = $('#heliocentric_container');
    exContainerElem = $('#exploration_container');
    sunElem = $('#hc_sun');
    viewboxWidth = hcContainerElem[0].getAttribute('viewBox').split(' ')[2];
    
    scrollController = new ScrollMagic.Controller();
    
    $(window).resize(onResize);
    $(window).scroll(onScroll);
    $(window).mousewheel(onMouseWheel);
    $('#btn_toscale').click(setScale);
    $('#btn_explore').click(explorationMode);
    $('#btn_overview').click(overviewMode);
    
    // 2 year time span divided into weeks, today in the middle
    $('#slider_date').slider({
        orientation: 'vertical',
        min: 0,
        max: 104,
        value: 52,
        slide: setTimeFrame
    });
    
    onResize();
    onScroll();
    getPlanetData();
    
    // Don't add parallax effect in safari, the results are devestating
    if (bowser.safari)
        return;
    
    // Add parallax scroll effect to planets
    $('.row').each(function(index, elem) {
        
        var planetElem = $(elem).find('.ex-planet');
        var descElem = $(elem).find('.ex-description')
        
        var tl = new TimelineMax();
            tl.fromTo(planetElem, 1, { top: 0, left: -50 }, { top: 300, left: 50 })
              .to(descElem, 1, { top: 300 }, '0')
              .fromTo(descElem, 0.5, { opacity: 0 }, { opacity: 1 }, '0')
              .to(descElem, 0.2, { opacity: 0 }, '0.8')
              .from(descElem.find('.headline'), 0.8, { marginBottom: 100 }, '0');

        new ScrollMagic.Scene({ triggerElement: elem, duration: 1300, offset: -250 })
                .setTween(tl)
                //.addIndicators()
                .addTo(scrollController);
            
    });
    
    // Add parallax effect to sun description
    var tl = new TimelineMax();
        tl.fromTo('#ex_sun_container .ex-description', 1, { opacity: 1 }, { opacity: 0 });

    new ScrollMagic.Scene({ triggerElement: '#ex_sun_container .ex-description', duration: 1300, offset: 0 })
            .setTween(tl)
            //.addIndicators()
            .addTo(scrollController);
    
});

var round = function(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

// Reset scrolling position to prevent heliocentric view from 
// being out of view on page reload
$(window).on('beforeunload', function() {
    $(window).scrollTop(0);
});

var onResize = function() {

    var maxWidth = $(window).height() > $(window).width() ? $(window).width() : $(window).height();
    hcContainerElem.width(maxWidth);
    
    // Make page mobile friendly if height > width
    if ($(window).height() > $(window).width() - 300) {
        
        isMobile = true;
        
        $('body').addClass('mobile');
        $('.controls').css('height', 'auto');
        $('.ui-slider').slider('option', 'orientation', 'horizontal');
        
        if (isExplorationMode)
            overviewMode();
        
    }
    else {
        
        isMobile = false;
        
        $(window).scrollTop(0);
        $('body').removeClass('mobile');
        $('.controls').css('height', $(window).height() - controlsOffset * 2);
        $('.ui-slider').slider('option', 'orientation', 'vertical');
        
    }
    
}

// Generate new stars for background when scrolling down
var onScroll = function() {
    
    var scrollTop = $(this).scrollTop();
    
    if (scrollTop >= starCoverage - starCoverageStep) {
        addStars(starCoverage);
        starCoverage += starCoverageStep;
    }
    
}

var addStars = function(offset) {
    
    //console.log('Added stars from ' + offset + 'px to ' + (offset + starCoverageStep) + 'px');
    //console.log('Current offset is ' + $(window).scrollTop() + 'px');
    
    $('<div />')
        .attr('id', 'stars_' + offset)
        .addClass('stars layer1 parallax')
        .css('transform', 'translateY(' + offset + 'px)')
        .data('parallax-top', 200)
        .appendTo('#star_container');
    $('<div />')
        .addClass('stars layer2')
        .css('transform', 'translateY(' + offset + 'px)')
        .data('parallax-top', 200)
        .appendTo('#star_container');
    $('<div />')
        .addClass('stars layer3 parallax')
        .css('transform', 'translateY(' + offset + 'px)')
        .data('parallax-top', 300)
        .appendTo('#star_container');
    
    // Don't add parallax effect in safari, the results are devestating
    if (bowser.safari)
        return;
    
    $('#star_container .parallax').each(function(index, elem) {
        
        $(elem).removeClass('parallax');
        
        new ScrollMagic.Scene({ triggerElement: '#star_container', duration: starCoverageStep, offset: offset })
            .setTween(elem, { top: $(elem).data('parallax-top') })
            //.addIndicators()
            .addTo(scrollController);
        
    });
    
}

// Init exploration mode when scrolling down in overview mode
var onMouseWheel = function(event) {

    if (!isExplorationMode && !isMobile) {

        var down = event.deltaY < 0;

        if (down)
            scrollDownDelta++;

        if (scrollDownDelta > 50) {
            scrollDownDelta = 0;
            explorationMode();
        }

    }

}

var getPlanetData = function() {
    
    $.getJSON('data.php', function(data) {
        
        planetData = data;
        updatePlanetElements();
        
    }).fail(function() {
        
        alert('An error occured when loading planetary data.');
        
    });
    
}

var updatePlanetElements = function(week, noTransition) {
    
    if (!planetData)
        return;
    
    week = typeof week !== 'undefined' ? week : 52;
    
    // The value a planets orbit in AU should be multiplied by to get
    // a correct pixel radius on the page. maxDistance is the orbit radius
    // of Neptune which is about 30 AU.
    var maxDistance = Math.ceil(planetData[planetData.length - 1].records[week].distance) + 2;
    var orbitRatio = viewboxWidth / 2 / maxDistance;
    
    for (var i = 0; i < planetData.length; i++) {
        
        var planetElem = $('#hc_' + planetData[i].selector);
        var orbitElem = $('#hc_' + planetData[i].selector + '_orbit');
        
        var radius = orbitRatio * planetData[i].records[week].distance;
        
        // This assumes there are 8 planets and compensates for the radius of the sun
        var normalizedRadius = viewboxWidth / 2 / 9 * planetData[i].order + sunMax;
        
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
    
    updatePlanetModel(noTransition);
    
}

// Every animation is covered both by a css transition (chrome) and a velocity
// transition (firefox, safari) to cover functionality in all major browsers. 
var updatePlanetModel = function(noTransition) {
    
    // Used by slider
    if (noTransition) {
        
        hcContainerElem[0].classList.add('no-transition');
        
        sunElem.attr({ r: toScale ? sunMin : sunMax });
        
        hcContainerElem.find('.orbit').each(function(index, elem) {
            
            $(elem).attr({ r: toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius') });
            
        });
        
        hcContainerElem.find('.planet').each(function(index, elem) {
            
            var radius = toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
            var angle = $(elem).data('angle');
            
            $(elem)
                .attr({ r: toScale ? planetMin : planetMax })
                .css({ transform: 'rotate(-' + angle + 'deg) translateX(' + radius + 'px) rotate(' + angle + 'deg)' });
            
        });

    }
    
    // Used on startup and scale change
    else {
        
        hcContainerElem[0].classList.remove('no-transition');
    
        sunElem
            .css({
                r: toScale ? sunMin : sunMax
            })
            .velocity({
                r: toScale ? sunMin : sunMax
            }, { duration: 1000, easing: 'ease-in-out', queue: false });

        hcContainerElem.find('.orbit').each(function(index, elem) {

            $(elem)
                .css({
                    r: toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius')
                })
                .velocity({
                    r: toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius')
                }, { duration: 1000, easing: 'ease-in-out', queue: false });

        });

        hcContainerElem.find('.planet').each(function(index, elem) {

            var radius = toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
            var angle = $(elem).data('angle');

            $(elem)
                .css({
                    transform: 'rotate(-' + angle + 'deg) translateX(' + radius + 'px) rotate(' + angle + 'deg)',
                    r: toScale ? planetMin : planetMax
                })
                .velocity({
                    r: toScale ? planetMin : planetMax
                }, { duration: 1000, easing: 'ease-in-out', queue: false });

        });
        
    }
    
}

var setTimeFrame = function(event, ui) {
    
    updatePlanetElements(ui.value, true);
    
}

var setScale = function() {
    
    var text = $(this).val();
    $(this).val($(this).data('toggle-value')).data('toggle-value', text);
    
    toScale = !toScale;
    updatePlanetModel();
    
}

var explorationMode = function() {
    
    isExplorationMode = true;
    
    $('#heliocentric_controls').css('right', controlsHiddenOffset);
    $('#intro').css('opacity', 0);
    $('#title').css('opacity', 0);
    
    hcContainerElem
        .velocity({
            scale: 30,
            opacity: 0
        }, { duration: 1000, easing: 'easeInSine', queue: false, complete: initExplorationMode });
    
}

var initExplorationMode = function() {
    
    hcContainerElem.hide();
    exContainerElem.css('opacity', 1);
    $('#exploration_controls').css('right', controlsOffset);
    $('body').addClass('scrollable');
    
    // Animate sun from top
    $('#ex_sun_desktop').velocity({
        cy: -1850
    }, { duration: 1000, easing: 'ease-out', queue: false });
    
}

var overviewMode = function() {
    
    isExplorationMode = false;
    
    $(window).scrollTop(0);
    $('body').removeClass('scrollable');
    $('#exploration_controls').css('right', controlsHiddenOffset);
    $('#title').css('opacity', 1);
    exContainerElem.css('opacity', 0);
    
    hcContainerElem
        .show()
        .velocity({
            scale: 1,
            opacity: 1
        }, { duration: 1000, easing: 'easeInSine', queue: false, complete: initOverviewMode });
    
}

var initOverviewMode = function() {
    
    $('#heliocentric_controls').css('right', controlsOffset);
    
}
