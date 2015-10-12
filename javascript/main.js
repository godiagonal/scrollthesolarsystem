var containerElem,
    viewboxWidth,
    sunElem;

$(function() {
    
    containerElem = $('#heliocentric_container');
    sunElem = $('#hc_sun');
    viewboxWidth = containerElem[0].getAttribute('viewBox').split(' ')[2];
    
    $(window).resize(setContainerSize);
    $('#cb_toscale').change(setScale);
    $('#btn_zoomin').click(zoomIn);
    $('#btn_zoomout').click(zoomOut);
    
    setContainerSize();
    getPlanetData();
    
});

var setContainerSize = function() {
    
    var maxWidth = $(window).height() < $(window).width() ? $(window).height() : $(window).width();
    
    containerElem.width(maxWidth);
    
}

var getPlanetData = function() {
    
    $.getJSON('data.php', updatePlanetElements).fail(function() {
        alert('An error occured when loading planetary data.');
    });
    
}

var updatePlanetElements = function(data) {
    
    // The value a planets orbit in AU should be multiplied by to get
    // a correct pixel radius on the page. 40 comes from the orbit radius
    // of Pluto which is about 34 AU.
    var orbitRatio = viewboxWidth / 2 / 34;
    
    for (var i = 0; i < data.length; i++) {
        
        var planetElem = $('#hc_' + data[i].selector);
        var orbitElem = $('#hc_' + data[i].selector + '_orbit');
        
        // Compensate for the sun by adding 50 px
        var radius = orbitRatio * data[i].range;
        
        // This assumes there are 9 planets
        var normalizedRadius = viewboxWidth / 2 / 10 * data[i].order + 25;
        
        planetElem.data({
            radius: radius,
            normalizedRadius: normalizedRadius,
            angle: data[i].elon
        });
        
        orbitElem.data({
            radius: radius,
            normalizedRadius: normalizedRadius
        });
        
    }
    
    updatePlanetModel(false);
    
}

// Every animation is covered both by a css transition (chrome) and a velocity
// transition (firefox, safari) to cover functionality in all major browsers. 
var updatePlanetModel = function(toScale) {
    
    toScale = typeof toScale !== 'undefined' ? toScale : true;
    
    sunElem
        .css({
            r: toScale ? 2 : 25
        })
        .velocity({
            r: toScale ? 2 : 25
        }, { duration: 1000, easing: 'ease-in-out', queue: false });
    
    containerElem.find('.orbit').each(function(index, elem) {
        
        $(elem)
            .css({
                r: toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius')
            })
            .velocity({
                r: toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius')
            }, { duration: 1000, easing: 'ease-in-out', queue: false });
        
    });
    
    containerElem.find('.planet').each(function(index, elem) {
        
        var radius = toScale ? $(elem).data('radius') : $(elem).data('normalizedRadius');
        var angle = $(elem).data('angle');
        
        $(elem)
            .css({
                transform: 'rotate(-' + angle + 'deg) translateX(' + radius + 'px) rotate(' + angle + 'deg)',
                r: toScale ? 3 : 10
            })
            .velocity({
                r: toScale ? 3 : 10
            }, { duration: 1000, easing: 'ease-in-out', queue: false });
        
    });
    
}

var setScale = function() {
    
    var toScale = $(this).is(':checked');
    
    updatePlanetModel(toScale);
    
}

var zoomIn = function() {
    
    containerElem
        .velocity({
            scale: 30,
            opacity: 0
        }, { duration: 1000, easing: 'easeInSine', queue: false });
    
}

var zoomOut = function() {
    
    containerElem
        .velocity({
            scale: 1,
            opacity: 1
        }, { duration: 1000, easing: 'easeInSine', queue: false });
    
}
