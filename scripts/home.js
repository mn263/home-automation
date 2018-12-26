"use strict";

/**
 * @file contains logic to get API data and use that data to generate the control panel
 * It also handles the creation of new Controls along with a method that listens for 'house-update' events
 * 
 */

const homeID = 'home';
const containerID = 'control-panel-content';

$.getScript("scripts/controls.js").done(function (script, textStatus) {
    initControlPanel();
    listenForControlChanges();
});

/**
 * Once the House SVG has loaded we get the rooms in the house and
 * update the SVG colors to match the status of the lights/curtains
 * 
 * @listens Load - addEventListener is triggered when the house SVG loads
 */
$('#home-map').context.addEventListener('load', function () {
    if (!document.getElementById('home-map')) return;
    // get the rooms data and update SVG to match values from API
    $.get('API/homes/whitehouse/rooms.json', function (rooms) {
        // Rooms = rooms;
        for (let roomIndex in rooms) {
            // features in a room are things like lights and curtains
            let features = rooms[roomIndex].features;
            for (let featureIndex in features) {
                // indiviual features things like lamps, or specific curtains
                let feature = features[featureIndex];
                let svgElement = document.getElementById('home-map').contentDocument.getElementById('g-' + roomIndex);
                if (feature.controller === ControlsEnum.Light) {
                    updateLight(svgElement, feature.status);
                } else if (feature.controller === ControlsEnum.Curtain) {
                    updateCurtains(svgElement, feature.status);
                }
            }
        }
    }, 'json');
}, true);

/**
 * Fetches the house object from the 'API' and builds the control panel
 */
function initControlPanel() {
    $.get('API/homes/whitehouse/house.json', function (data) {
        // use home object to initialize the control panel - get's rooms, temp, etc.
        let homeData = data.home;
        let controls = parseFeatureControls(homeData.features, homeID);
        controls.forEach((control) => {
            control.display();
        });

    }, 'json');
};

/**
 * Handles clicks on rooms in the SVG element and updates the room selector contoller
 * 
 * @param {object} element - SVG element that was clicked 
 * @param {string} controllerId - ID for the room dropdown controller
 */
function handleRoomClick(element, controllerId) {
    let roomDropdown = $('#' + controllerId);
    roomDropdown.val(element.id.substring(2));
    roomDropdown.trigger('change');
}

/**
 * Runs through each feature in the featureList and gathers the controls based off the features
 * 
 * @param {object} featureList - An object with the features (i.e., temp/rooms or lights/curtains) to build a control
 * @param {string} parentID - HTML element ID of the parent object
 * 
 * @returns {string} html - The combined HTML of all the controls created for the given featureList
 */
function parseFeatureControls(featureList, parentID) {
    let controls = [];
    $.each(featureList, function (index, element) {
        let elementId = parentID + '_' + index;
        let control = createControl(element, elementId, parentID);
        if (!!control) controls.push(control);
    });

    return controls;
};

/**
 * Creates a new Controller
 * 
 * @param {object} feature - API object driving the control. Example: {name: "Temperature", element-id: "home-map", controller: "temp", status: 68}
 * @param {string} elementId The ID that will be used as the HTML element's ID property
 * @param {string} roomId - Null unless control tied to a room. Used for room-specific controls (i.e., a light in the kitchen)
 * 
 * @returns {object} controller - The control that was created
 */
function createControl(feature, elementId, roomId = null) {
    let controller;
    switch (feature.controller) {
        case ControlsEnum.RoomsSelector:
            controller = new RoomsSelector(containerID, feature, elementId);
            break;
        case ControlsEnum.Light:
            controller = new Light(roomId, feature, elementId);
            break;
        case ControlsEnum.Curtain:
            controller = new Curtain(roomId, feature, elementId);
            break;
        case ControlsEnum.Temperature:
            controller = new Temperature(containerID, feature, elementId);
            break;
        default:
            console.error('No matching controller was found: ', feature.controller);
    }
    
    return controller;
};

/**
 * This method listens for 'house-update' events.
 * You can either add reactionary logic to this method or add 'house-update' listeners where needed
 * 
 */
function listenForControlChanges() {
    document.addEventListener('house-update', function(e) {
        console.log(`house-update: { type: ${e.detail.controlType}, name: '${e.detail.controlName}', value: ${e.detail.value} }`);
    });
};