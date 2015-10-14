var planetData,
    hcContainerElem,
    exContainerElem,
    sunElem,
    viewboxWidth,
    toScale = false,
    isExplorationMode = false,
    starCoverage = 0;

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
    
    $(window).resize(onResize);
    $(window).scroll(onScroll);
    $('#btn_toscale').click(setScale);
    $('#btn_explore').click(explorationMode);
    $('#btn_overview').click(overviewMode);
    
    $('#slider_date').slider({
        orientation: 'vertical',
        min: 0,
        max: 730,
        value: 365,
        slide: setTimeFrame
    });
    
    onResize();
    onScroll();
    getPlanetData();
    
});

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
        $('body').addClass('mobile');
        $('.controls').css('height', 'auto');
        $('.ui-slider').slider('option', 'orientation', 'horizontal');
        
        if (isExplorationMode)
            overviewMode();
    }
    else {
        $(window).scrollTop(0);
        $('body').removeClass('mobile');
        $('.controls').css('height', $(window).height() - controlsOffset * 2);
        $('.ui-slider').slider('option', 'orientation', 'vertical');
    }
    
}

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
        .addClass('stars layer1')
        .css('transform', 'translateY(' + offset + 'px)')
        .appendTo('#star_container');
    $('<div />')
        .addClass('stars layer2')
        .css('transform', 'translateY(' + offset + 'px)')
        .appendTo('#star_container');
    $('<div />')
        .addClass('stars layer3')
        .css('transform', 'translateY(' + offset + 'px)')
        .appendTo('#star_container');
    
}

var getPlanetData = function() {
    
    $.getJSON('data.php', function(data) {
        
        planetData = data;
        updatePlanetElements();
        
    }).fail(function() {
        
        alert('An error occured when loading planetary data.');
        
    });
    
}

var updatePlanetElements = function(day, noTransition) {
    
    if (!planetData)
        return;
    
    day = typeof day !== 'undefined' ? day : 365;
    
    // The value a planets orbit in AU should be multiplied by to get
    // a correct pixel radius on the page. maxDistance is the orbit radius
    // of Neptune which is about 30 AU.
    var maxDistance = Math.ceil(planetData[planetData.length - 1].records[day].distance) + 2;
    var orbitRatio = viewboxWidth / 2 / maxDistance;
    
    for (var i = 0; i < planetData.length; i++) {
        
        var planetElem = $('#hc_' + planetData[i].selector);
        var orbitElem = $('#hc_' + planetData[i].selector + '_orbit');
        
        var radius = orbitRatio * planetData[i].records[day].distance;
        
        // This assumes there are 8 planets and compensates for the radius of the sun
        var normalizedRadius = viewboxWidth / 2 / 9 * planetData[i].order + sunMax;
        
        planetElem.data({
            radius: radius,
            normalizedRadius: normalizedRadius,
            angle: planetData[i].records[day].elon
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
    
}

var overviewMode = function() {
    
    isExplorationMode = false;
    
    $(window).scrollTop(0);
    $('body').removeClass('scrollable');
    $('#exploration_controls').css('right', controlsHiddenOffset);
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
