"use strict";

/**
 * NOTE: All Controls should implement the following functions:
 * 
 * getTemplate - Returns the HTML template the will be used to create the control
 * getValue - Returns the status of the control (i.e., lights on/off or curtains open/closed)
 * updateHouse - Updates the UI based on action performed on the control
 * save - Calls the API to save changes made on the controller
 * 
 * @file - Contains all Controllers and Enums to support developement
 * 
 * Current controls give ability to select room, change temp, lights, and curtains
 * 
 * NEW CONTROLS: should be added to this file and can run off of current API values
 * or may require updates to the API in order to support additional features (i.e., cieling fans, sprinkler systems, etc). 
 */


/**
 * A dropdown with each room in the house
 * 
 * @prop getTemplate - Returns HTML to display control
 * @prop getValue - Returns the selected room's ID
 * @prop updateHouse - Updates control panel to give controls specific to the selected room
 * @prop save - Not used in this class
 */
class RoomsSelector {
	constructor(elementId) {
		this.elementId = elementId;
	};

	getTemplate(features) {
		let html = `<select id="${this.elementId}"><option value="">Choose Room</option>`;
		features.status.forEach((room) => {
			html += `<option value="${room.id}">${room.displayName}</option>`;
		});
		html += `</select>`
		return html;
	};

	getValue() {
		return $('#' + this.elementId).val();
	};

	updateHouse() {
		let controlValue = this.getValue();
		$('.room').remove();
		if (!controlValue) return; // occurs when "Choose Room" is selected

		// get the room features from the API
		$.get('API/homes/whitehouse/rooms/' + controlValue + '.json', (room) => {
			let roomID = homeID + '_' + controlValue;
			let roomHTML = `<div id="${roomID}" class="room">
					<h3>${room.name}</h3>
					${featureControlsHTML(room.features, roomID)}
				</div>`;

			$('#' + containerID).append(roomHTML);
			// add a listener for changes to the control on the container element
			$('#' + containerID + ' input').change(updateFeature);
		}, 'json');
	};

	save() {
		// nothing to save as we are simply updating the room dropdown
	};
}

/**
 * A Checkbox for a room's lights
 * 
 * @prop getTemplate - Returns HTML to display control
 * @prop getValue - Returns the LightValue 'On' or 'Off'
 * @prop updateHouse - Updates room's SVG element to reflect the light's status
 * @prop save - Saves the current value of the control's light
 */
class Light {
	constructor(light, roomId, elementId, room) {
		this.elementId = elementId;
		this.roomId = roomId;
		this.room = room;
		this.light = light;
		this.svgId = 'g-' + roomId;
	};

	getTemplate() {
		let checked = this.light.status === LightValues.On ? ' checked="checked" ' : '';
		return `<input type="checkbox" id="${this.elementId}" value="${this.light.status}" ${checked}/>
			<label for="${this.elementId}">${this.light.name} - On</label>`;
	};

	getValue() {
		return $('#' + this.elementId).prop('checked') ? LightValues.On : LightValues.Off;
	};

	updateHouse() {
		let svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
		updateLight(svgElement, this.getValue());
	};

	save() {
		// call API to update room with the changes
		$.post('API/homes/whitehouse/rooms/' + this.roomId + '.json', {
			light: this.room.name,
			value: this.getValue()
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	}
}

/**
 * A Checkbox for a room's curtains
 * 
 * @prop getTemplate - Returns HTML to display control
 * @prop getValue - Returns the CurtainValue 'Open' or 'Closed'
 * @prop updateHouse - Updates room's SVG element to reflect the curtain's status
 * @prop save - Saves the current value of the control's curtain position
 */
class Curtain {
	constructor(curtain, roomId, elementId, room) {
		this.elementId = elementId;
		this.roomId = roomId;
		this.room = room;
		this.curtain = curtain;
		this.svgId = 'g-' + roomId;
	};

	getTemplate() {
		let checked = this.curtain.status === CurtainValues.Closed ? ' checked="checked" ' : '';
		return `<input type="checkbox" id="${this.elementId}" class="boolean" value="${this.curtain.status}" ${checked}/>
			<label for="${this.elementId}">${this.curtain.name} - Drawn</label>`;
	};

	getValue() {
		return $('#' + this.elementId).prop('checked') ? CurtainValues.Closed : CurtainValues.Open;
	};

	updateHouse() {
		let svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
		updateCurtains(svgElement, this.getValue());
	};

	save() {
		// call API to update room with the changes
		$.post('API/homes/whitehouse/rooms/' + this.roomId + '.json', {
			curtain: this.room.name,
			value: this.getValue()
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	};
}

/**
 * An input slider for a house's tempurature
 * 
 * @prop getTemplate - Returns HTML to display control
 * @prop getValue - Returns the tempurature of the house
 * @prop updateHouse - Updates the background of the house SVG with red/blud to reflect warm/cold temps
 * @prop save - Saves the selected value for the house's tempurature
 */
class Temp {
	constructor(elementId) {
		this.elementId = elementId;
		this.svgId = 'home-map';
	};

	getTemplate(feature) {
		return `<label for="${this.elementId}" class="integer">
			${feature.name}:<span id="${this.elementId}-temp" style="padding: 5px">${feature.status}&#8457; </span>
			</label>
			<input type="range" class="integer" min="60" max="80" id="${this.elementId}" value="${feature.status}" />`;
	};

	getValue() {
		return $('#' + this.elementId).val();
	};

	updateHouse() {
		// update the house SVG
		let controlValue = this.getValue();
		$('#' + this.elementId + '-temp').html(controlValue + '&#8457;');
		let warmth = 255 - ((controlValue - 70) * 5);
		let cold = 255 - ((70 - controlValue) * 5);
		let svgElement = document.getElementById(this.svgId);
		svgElement.style.background = 'rgba(' + cold + ', ' + warmth + ',' + warmth + ', 0.5)';
	};

	save() {
		// call API to update house temp
		$.post('API/homes/whitehouse/house.json', {
			temp: this.getValue(),
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	}
}

/**
 * Updates the room room color when the light is turned on/off
 * 
 * @param {object} svgElement - SVG element that will be updated
 * @param {string} currVal - Value of the light control in the current room
 */
function updateLight(svgElement, currVal) {
	if (!svgElement) return;
	svgElement.style.fill = currVal === LightValues.On ? '#FFFF00' : '#A9A9A9';
}

/**
 * Updates the room room color when the light is turned on/off
 * 
 * @param {object} svgElement - SVG element that will be updated
 * @param {string} currVal - Value of the curtain control in the current room
 */
function updateCurtains(svgElement, currVal) {
	if (!svgElement) return;
	svgElement.style.fillOpacity = currVal === CurtainValues.Open
		? parseFloat(svgElement.style.fillOpacity) + .3
		: parseFloat(svgElement.style.fillOpacity) - .3;
}

/**
 * Enums used for tracking control types and value types
 * 
 */
const ControlsEnum = {
	RoomsSelector: 'rooms',
	Temp: 'temp',
	Light: 'light',
	Curtain: 'curtain',
};
const LightValues = {
	On: 'On',
	Off: 'Off'
};
const CurtainValues = {
	Open: 'Open',
	Closed: 'Closed'
};
