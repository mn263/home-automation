"use strict";

/**
 * @file contains logic to get API data and use that data to generate the control panel
 * It has a method (updateFeature) called by updates to any control where you can listen for specific events
 * 
 */

// In a production site we would use caching and polling of data instead simple object
let Rooms = {};
// controllerMap is used to map element IDs to controllers
let controllerMap = new Map();

const homeID = 'home';
const containerID = 'control-panel-content';

$.getScript("scripts/controls.js").done(function (script, textStatus) {
    initControlPanel();
});

/**
 * Once the House SVG has loaded we get the rooms in the house and
 * update the SVG colors to match the status of the lights/curtains
 * 
 * @listens Load - function is triggered when the house SVG loads
 */
$('#home-map').context.addEventListener('load', function () {
    if (!document.getElementById('home-map')) return;
    // get the rooms data and update SVG to match values from API
    $.get('API/homes/whitehouse/rooms.json', function (rooms) {
        Rooms = rooms;
        for (let roomIndex in rooms) {
            // features in a room are things like lights and curtains
            let features = rooms[roomIndex].features;
            for (let featureIndex in features) {
                // indiviual features things like lamps, or specific curtains
                let feature = features[featureIndex];
                let svgElement = document.getElementById('home-map').contentDocument.getElementById('g-' + roomIndex);
                if (feature['controller'] === ControlsEnum.Light) {
                    updateLight(svgElement, feature.status);
                } else if (feature['controller'] === ControlsEnum.Curtain) {
                    updateCurtains(svgElement, feature.status);
                }
            }
        }
    }, 'json');
}, true);

/**
 * Fetches the house object from the 'API' and builds the control panel
 * 
 * Adds the controls to the container element which we listen to for events on any of the controls
 * When any control is updated we call updateFeature - If you want to listen for any event that is we you'll add the logic
 * 
 * @listens input - triggered when a control with an 'input' element changes
 * @listens select - triggered when a control with a 'select' element changes
 */
function initControlPanel() {
    $.get('API/homes/whitehouse/house.json', function (data) {
        // use home object to initialize the control panel - get's rooms, temp, etc.
        let homeData = data.home;
        let controlsHTML = '<div id="home">' + featureControlsHTML(homeData.features, homeID) + '</div>';
        $('#' + containerID).append(controlsHTML);
        // add the "update feature" listener to control panel
        $('#' + containerID + ' input').change(updateFeature);
        $('#' + containerID + ' select').change(updateFeature);
    }, 'json');
};

/**
 * Handles clicks on rooms in the SVG to and updates the room contoller
 * 
 * @param {object} element - SVG element that was clicked 
 * @param {string} controllerId - ID for the room dropdown controller
 */
function handleRoomClick(element, controllerId) {
    $('#' + controllerId).val(element.id.substring(2));
    let controller = controllerMap.get(controllerId);
    controller.updateHouse();
}

/**
 * Runs through each feature in the featureList and gathers the HTML for the individual controls
 * 
 * @param {object} featureList - An object with the features (i.e., temp/rooms or lights/curtains) to build a control
 * @param {string} parentID - ID of parent object (i.e., 'home', 'kitchen', etc.)
 * 
 * @returns {string} html - The combined HTML of all the controls created for the given featureList
 */
function featureControlsHTML(featureList, parentID) {
    let html = '';
    $.each(featureList, function (index, element) {
        let elementId = parentID + '_' + index;
        html += featureControlHTML(element, elementId, parentID.split('_').pop());
    });

    return html;
};

/**
 * Creates a new Controller, adds it to the controllerMap, and returns the HTML needed to display the new controller
 * 
 * @param {object} feature - API object driving the control. Example: {name: "Temperature", element-id: "home-map", controller: "temp", status: 68}
 * @param {string} elementId The ID that will be used as the HTML element's ID property
 * @param {string} roomId - Null unless control is specific to a room. Useful for room-specific controls (i.e., the light is in the kitchen)
 * 
 * @returns {string} html - The HTML of the control that was created or an empty string in the case that a control was not created
 */
function featureControlHTML(feature, elementId, roomId) {
    let controller;
    let html = '<div class="feature">';
    switch (feature.controller) {
        case ControlsEnum.RoomsSelector:
            controller = new RoomsSelector(elementId);
            break;
        case ControlsEnum.Light:
            controller = new Light(feature, roomId, elementId, Rooms[roomId]);
            break;
        case ControlsEnum.Curtain:
            controller = new Curtain(feature, roomId, elementId, Rooms[roomId]);
            break;
        case ControlsEnum.Temp:
            controller = new Temp(elementId);
            break;
        default:
            console.error('No matching controller was found: ', feature.controller);
            return '';
    }
    controllerMap.set(elementId, controller);
    html += controller.getTemplate(feature);
    html += '</div>';
    return html;
};


/**
 * This method can be used for listening for Controller events as they all call back here on changes
 * The map uses the ID of the triggered element to get the corresponding controller.
 * 
 * You can add logic here to respond to events; however, leave the update and save calls as they will update
 * the UI and API with the updates that occurred.
 * 
 * @param str Defines the Event triggered the function call 
 */
function updateFeature(str) {
    if (controllerMap.has(this.id)) {
        let controller = controllerMap.get(this.id);
        controller.updateHouse();
        controller.save();
    }
};