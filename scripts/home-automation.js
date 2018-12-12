/* jslint browser: true, white: true */

// Set up home framework

var Rooms = {};
var JAHOME = {};
JAHOME.idDelimiter = '_';
JAHOME.homeID = 'home';
JAHOME.containerID = 'control-panel-content';

$.getScript( "scripts/controls.js" )
.done(function( script, textStatus ) {
    // todo: try getting the homeId from the url
    var featureTypeID = 'feature-types';
    var containerID = 'control-panel-content';

    // set up the home data from the JSON object
    initHomeData(featureTypeID, containerID);
});

$('#home-map').context.addEventListener('load', function() {
    if (!document.getElementById('home-map')) return;
    updateMapToReflectRoomStatuses();
}, true);

var initHomeData = function (featureID, containerID) {
	'use strict';
	
	$.get('API/homes/whitehouse/home.json', function (data) {
		
		JAHOME.homeData = data[JAHOME.homeID];
		JAHOME.featureData = data[featureID];
		
		// set up the feature types allowed in this home
		JAHOME.featureTypes = initFeatureTypes(JAHOME.featureData);
		
		initControlPanel(containerID);
    }, 'json');
};

var updateMapToReflectRoomStatuses = function () {
	$.get('API/homes/whitehouse/rooms.json', function (rooms) {
        Rooms = rooms;
        for (var roomIndex in rooms) {
            var room = rooms[roomIndex];
            var features = room.features;
			if (features) {
                for (var featureIndex in features) {
                    var feature = features[featureIndex];

                    var doc = document.getElementById('home-map').contentDocument;
                    var svgElement = doc.getElementById(room['svg-id']);
                
                    if (feature['feature-type'] === 'light') {
                        updateLight(svgElement, feature['current-value']);
                    } else if (feature['feature-type'] === 'curtain') {
                        updateCurtains(svgElement, feature['current-value']);

                    }
                }
            }
        }
    }, 'json');    
}

var updateLight = function(svgElement, currVal) {
    if (!svgElement) return;
    svgElement.style.fill = currVal === 'On' ? '#FFFF00' : '#A9A9A9';
}

var updateCurtains = function(svgElement, currVal) {
    if (!svgElement) return;
    svgElement.style.fillOpacity = currVal === 'Open' 
        ? parseFloat(svgElement.style.fillOpacity) + .3
        : parseFloat(svgElement.style.fillOpacity) - .3;
}

// set up the control panel, using the data already read in
var initControlPanel = function (containerID) {
	'use strict';
    
    // build control panel HTML block into a string, then append to the DOM at the end
    // for better performance.
    var controlHTML = '<div id="home">';
    // features at the whole home level
    var homeHTML = JAHOME.featureControlsHTML(JAHOME.featureTypes, JAHOME.homeData.features, JAHOME.homeID);
    // finish that new HTML block & append it to the DOM in containerID
    controlHTML += homeHTML;
    controlHTML += '</div>';
    $('#' + containerID).append(controlHTML);

    // add the "update feature" listener to all control panel form elements
    $('#' + containerID + ' input').change(JAHOME.updateFeature);
    $('#' + containerID + ' select').change(JAHOME.updateFeature);
    $('#' + containerID + ' textarea').change(JAHOME.updateFeature);
    $('#' + containerID + ' button').change(JAHOME.updateFeature);
};

// here, we take a JSON object describing the different home features available, then
// add functions; functionality won't/shouldn't be part of the actual JSON data,
// using the different supported data types offered in JADATA 
// (an extensible object initialized first in data-types.js)
var initFeatureTypes = function (featureTypeData) {
	'use strict';
	
	// add the functions & whatnot from the JS data type object	
	$.each(featureTypeData, function (index, element) {
		featureTypeData[index]['data-type-object'] = CONTROLS[element['controller']];
	});
		   
	return featureTypeData;
};

// set up features for a space (house or room) in control panel
JAHOME.featureControlsHTML = function (featureTypes, featureList, parentID) {
	'use strict';
	
	var newHTML = '';
		
	// load an array of features - child of either the overall home or one room
	$.each(featureList, function (index, element) {
		var domID = parentID + JAHOME.idDelimiter + index;
		
		newHTML += JAHOME.featureControlHTML(featureTypes[element['feature-type']], element, domID, parentID.split('_').pop());
	});
	
	return newHTML;
};

// set up one single feature
// this function will replace an existing feature on the page, or will create a new one
JAHOME.featureControlHTML = function (featureType, feature, domID, roomId) {
	'use strict';
	
    var newHTML = '<div class="feature">';
    if (featureType.controller === "dropdown") {
        var dropdown = new Dropdown();
        newHTML += dropdown.getTemplate(featureType, feature, domID);
        featureType['data-type-object'] = dropdown;
    } else if (featureType.controller === "lights") {
        var lightCtrl = new Light(roomId);
        newHTML += lightCtrl.getTemplate(featureType, feature, domID);
        featureType['data-type-object'] = lightCtrl;
    } else if (featureType.controller === "curtain") {
        var curtainCtrl = new Curtain(roomId);
        newHTML += curtainCtrl.getTemplate(featureType, feature, domID);
        featureType['data-type-object'] = curtainCtrl;
    } else if (featureType.controller === "temp") {
        var tempCtrl = new Temp();
        newHTML += tempCtrl.getTemplate(featureType, feature, domID);
        featureType['data-type-object'] = tempCtrl;
    // } else {
    //     newHTML += featureType['data-type-object'].getTemplate(featureType, feature, domID);
    }
	newHTML += '</div>';

	return newHTML;
};

// onclick event, to save one single feature
// uses initialized JAHOME variables to figure out what needs saving
JAHOME.updateFeature = function (str) {
	'use strict';

    var featureTree = this.id.split(JAHOME.idDelimiter),
        featureKey = featureTree[featureTree.length - 1],
        featureRoom = '',
        featureValue,
        featureType,
        feature,
        doc,
        svgElement,
        elementId = '';

    // the dom ID tells the "parentage" story... 
    // a 3-item ID is inside a room
    if (featureTree.length > 2) {
        featureRoom = featureTree[1];
        feature = Rooms[featureRoom].features[featureKey];
        elementId = Rooms[featureRoom]['svg-id'];
        doc = document.getElementById('home-map').contentDocument;
        svgElement = doc.getElementById(elementId);
            
    // < 3 items, and it isn't inside a room 
    } else {
        // if the id is not home-map then we get the id from inside the house SVG
        feature = JAHOME.homeData.features[featureKey];
        elementId = feature['element-id'];
        if (elementId === 'home-map') {
            svgElement = document.getElementById(elementId);
        } else {
            doc = document.getElementById('home-map').contentDocument;
            svgElement = doc.getElementById(elementId);
        }
    }
    
    // get the SVG object so we can animate it
    // using JS dom selection because jQuery was problematic
	//svgElement.style.fillOpacity = 0.2;
    
    // the new value depends on the data type, state, & item selected
    // for extensibility yet still somewhat secure, this can be found in the function controlValue() 
    // originally in JADA.
    featureType = JAHOME.featureTypes[feature['feature-type']];
    featureValue = featureType['data-type-object'].getValue(featureType, feature, this.id);
    featureType['data-type-object'].updateHouse(featureType, feature, this.id, featureValue, svgElement);
    
    // since data persistent is not a requirement,
    // the "save" json file just a stub, and simply returns a success case for 
    // setting a particular feature on the server.    
    $.get('API/set-feature.json', {
        "room": featureRoom,
        "key": featureKey,
        "value": featureValue
    }).done(function (data) {
        if (data.success === false) {
            alert("Error saving adjustment: " + data.success);
        }
    }, 'json');
};