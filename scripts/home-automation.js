/* jslint browser: true, white: true */

// Set up home framework
// in a production site we would use real caching of data
var RoomsCache = {};
var HomeCache = {};
var featureTypes = {};
const idDelimiter = '_';
const homeID = 'home';
const containerID = 'control-panel-content';
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
		
		HomeCache = data[homeID];
		var featureData = data[featureID];
		
		// set up the feature types allowed in this home
		featureTypes = initFeatureTypes(featureData);
		
		initControlPanel(featureTypes, data.home, containerID);
    }, 'json');
};

function updateMapToReflectRoomStatuses() {
	$.get('API/homes/whitehouse/rooms.json', function (rooms) {
        Rooms = rooms;
        for (var roomIndex in rooms) {
            var room = rooms[roomIndex];
            var features = room.features;
			if (features) {
                for (var featureIndex in features) {
                    var feature = features[featureIndex];

                    var doc = document.getElementById('home-map').contentDocument;
                    var svgElement = doc.getElementById('g-' + roomIndex);
                
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

function updateLight(svgElement, currVal) {
    if (!svgElement) return;
    svgElement.style.fill = currVal === 'On' ? '#FFFF00' : '#A9A9A9';
}

function updateCurtains(svgElement, currVal) {
    if (!svgElement) return;
    svgElement.style.fillOpacity = currVal === 'Open' 
        ? parseFloat(svgElement.style.fillOpacity) + .3
        : parseFloat(svgElement.style.fillOpacity) - .3;
}

// set up the control panel, using the data already read in
function initControlPanel(featureTypes, homeData, containerID) {
	'use strict';
    
    // build control panel HTML block into a string, then append to the DOM at the end
    // for better performance.
    var controlHTML = '<div id="home">';
    // features at the whole home level
    var homeHTML = featureControlsHTML(featureTypes, homeData.features, homeID);
    // finish that new HTML block & append it to the DOM in containerID
    controlHTML += homeHTML;
    controlHTML += '</div>';
    $('#' + containerID).append(controlHTML);

    // add the "update feature" listener to all control panel form elements
    $('#' + containerID + ' input').change(updateFeature);
    $('#' + containerID + ' select').change(updateFeature);
    $('#' + containerID + ' textarea').change(updateFeature);
    $('#' + containerID + ' button').change(updateFeature);
};

// here, we take a JSON object describing the different home features available, then
// add functions; functionality won't/shouldn't be part of the actual JSON data,
// using the different supported data types offered in JADATA 
// (an extensible object initialized first in data-types.js)
function initFeatureTypes(featureTypeData) {
	'use strict';
	
	// add the functions & whatnot from the JS data type object	
	$.each(featureTypeData, function (index, element) {
		featureTypeData[index]['data-type-object'] = element['controller'];
	});
		   
	return featureTypeData;
};

// set up features for a space (house or room) in control panel
function featureControlsHTML(featureTypes, featureList, parentID) {
	'use strict';
	
	var newHTML = '';
		
	// load an array of features - child of either the overall home or one room
	$.each(featureList, function (index, element) {
		var elementId = parentID + idDelimiter + index;
		newHTML += featureControlHTML(featureTypes[element['feature-type']], element, elementId, parentID.split('_').pop());
	});
	
	return newHTML;
};

// set up one single feature
// this function will replace an existing feature on the page, or will create a new one
function featureControlHTML(featureType, feature, elementId, roomId) {
	'use strict';
	
    var newHTML = '<div class="feature">';
    switch(featureType.controller) {
        case ControlsEnum.RoomsSelector:
            var dropdown = new RoomsSelector(elementId);
            newHTML += dropdown.getTemplate(featureType, feature);
            featureType['data-type-object'] = dropdown;
            break;
        case ControlsEnum.Light:
            var lightCtrl = new Light(roomId, elementId);
            newHTML += lightCtrl.getTemplate(featureType, feature);
            featureType['data-type-object'] = lightCtrl;
            break;
        case ControlsEnum.Curtain:
            var curtainCtrl = new Curtain(elementId);
            newHTML += curtainCtrl.getTemplate(featureType, feature);
            featureType['data-type-object'] = curtainCtrl;
            break;
        case ControlsEnum.Temp:
            var tempCtrl = new Temp(elementId);
            newHTML += tempCtrl.getTemplate(featureType, feature);
            featureType['data-type-object'] = tempCtrl;
            break;
        default:
            console.error('No matching controller was found: ', featureType.controller);
    }
	newHTML += '</div>';

	return newHTML;
};

// onclick event, to save one single feature
// uses initialized JAHOME variables to figure out what needs saving
function updateFeature(str) {
	'use strict';
    var featureTree = this.id.split(idDelimiter);
    var featureKey = featureTree[featureTree.length - 1];
    // the ID tells the "parentage" story... 
    var feature = (featureKey === 'room')
        ? RoomsCache[featureRoom].features[featureKey]
        : feature = HomeCache.features[featureKey];

    var featureType = featureTypes[feature['feature-type']];
    featureType['data-type-object'].updateHouse(feature, this.id);
    featureType['data-type-object'].save(feature);
};