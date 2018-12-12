// Set up home framework
// In a production site we would use real caching of data
var RoomsCache = {};
var HomeCache = {};
// used to map element IDs to controllers
var controllerMap = new Map();
const homeID = 'home';
const containerID = 'control-panel-content';

$.getScript("scripts/controls.js")
    .done(function (script, textStatus) {
        initHomeData();
    });

$('#home-map').context.addEventListener('load', function () {
    if (!document.getElementById('home-map')) return;
    updateMapToReflectRoomStatuses();
}, true);

var initHomeData = function () {
    'use strict';

    $.get('API/homes/whitehouse/home.json', function (data) {
        HomeCache = data[homeID];
        initControlPanel(data.home);
    }, 'json');
};

function updateMapToReflectRoomStatuses() {
    $.get('API/homes/whitehouse/rooms.json', function (rooms) {
        RoomsCache = rooms;
        for (var roomIndex in rooms) {
            var room = rooms[roomIndex];
            var features = room.features;
            if (!features) continue;
            for (var featureIndex in features) {
                var feature = features[featureIndex];
                var doc = document.getElementById('home-map').contentDocument;
                var svgElement = doc.getElementById('g-' + roomIndex);

                if (feature['controller'] === 'light') {
                    updateLight(svgElement, feature['current-value']);
                } else if (feature['controller'] === 'curtain') {
                    updateCurtains(svgElement, feature['current-value']);
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
function initControlPanel(homeData) {
    'use strict';

    // build control panel HTML block into a string, then append to the DOM at the end
    // for better performance.
    var controlHTML = '<div id="home">';
    // features at the whole home level
    var homeHTML = featureControlsHTML(homeData.features, homeID);
    // finish that new HTML block & append it to the DOM in containerID
    controlHTML += homeHTML;
    controlHTML += '</div>';
    $('#' + containerID).append(controlHTML);
    // add the "update feature" listener to all control panel form elements
    $('#' + containerID + ' input').change(updateFeature);
    $('#' + containerID + ' select').change(updateFeature);
};

// set up features for a space (house or room) in control panel
function featureControlsHTML(featureList, parentID) {
    'use strict';
    var newHTML = '';
    // load an array of features - child of either the overall home or one room
    $.each(featureList, function (index, element) {
        var elementId = parentID + '_' + index;
        newHTML += featureControlHTML(element, elementId, parentID.split('_').pop());
    });

    return newHTML;
};

// set up one single feature
// this function will replace an existing feature on the page, or will create a new one
function featureControlHTML(feature, elementId, roomId) {
    'use strict';
    var controller;
    var newHTML = '<div class="feature">';
    switch (feature.controller) {
        case ControlsEnum.RoomsSelector:
            controller = new RoomsSelector(elementId);
            break;
        case ControlsEnum.Light:
            controller = new Light(feature, roomId, elementId, RoomsCache[roomId]);
            break;
        case ControlsEnum.Curtain:
            controller = new Curtain(feature, roomId, elementId, RoomsCache[roomId]);
            break;
        case ControlsEnum.Temp:
            controller = new Temp(elementId);
            break;
        default:
            console.error('No matching controller was found: ', feature.controller);
            return '';
    }
    controllerMap.set(elementId, controller);
    newHTML += controller.getTemplate(feature);
    newHTML += '</div>';
    return newHTML;
};

function updateFeature(str) {
    'use strict';
    if (controllerMap.has(this.id)) {
        var controller = controllerMap.get(this.id);
        controller.updateHouse();
        controller.save();
    }
};