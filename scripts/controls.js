"use strict";

/**
 * NOTE: All Controls should extend the BaseControl class
 * @file - Contains all Controllers and Enums to support developement
 * 
 * CURRENT CONTROLS: give ability to select room, change temp, lights, and curtains
 * NEW CONTROLS: should be added to this file
 */


 /**
  * @property parentId - ID of the HTML element the control will be appended to
  * @property feature - The house feature driving the control
  * @property elementId - The ID of the HTML element that this control uses
  * 
  * Methods on Base class:
  * @function display - Displays the control
  * @function _emitEvent - Emits 'house-update' events
  * 
  * Methods to be defined in sub-classes:
  * @function getValue - Returns the value represented by the control
  * @function _getTemplate - Returns HTML to display control
  * @function _renderChanges - Updates the UI based on action performed on the control
  * @function _save - Makes API calls to save changes made on the controller
  * 
  * @emits house-update - Contains information about the control that triggered the event along with the updated value
  */
 class BaseControl {
	constructor(parentId, feature, elementId) {
		this.parentId = parentId;
		this.feature = feature;
		this.elementId = elementId;
	};

	display() {
		// display the control under the parent element
		$('#' + this.parentId).append(this._getTemplate());
		// listen for changes to the control
		$('#' + this.elementId).change(() => {
			// display the change, emit an event, and save the change
			this._renderChanges();
			this._emitEvent();
			this._save();
		});
	};

	_emitEvent() {
		let event = new CustomEvent('house-update', { 
			'detail': { 
				'controlType': this.constructor.name,
				'controlName': this.feature.name,
				'value': this.getValue()
			}
		});
		document.dispatchEvent(event);
	};

	// handle and log when a sub-class method has not been implemented
	getValue() { handleFunctionNotImplemented('getValue') };
	_getTemplate(features) { handleFunctionNotImplemented('_getTemplate') };
	_renderChanges() { handleFunctionNotImplemented('_renderChanges') };
	_save() { handleFunctionNotImplemented('_save') };

	_handleFunctionNotImplemented(functionName) {
		// Before deploying to production we would remove all logging with a Grunt task (https://www.npmjs.com/package/grunt-remove-logging)
		console.log(`${this.constructor.name} should implement the ${functionName} function`);
	}
 }

/**
 * A dropdown with each room in the house
 * 
 * @function getValue - Returns the selected room's ID
 * @function _getTemplate - Returns HTML to display control
 * @function _renderChanges - Updates control panel to give controls specific to the selected room
 * @function _save - Implemented but not used in this class
 */
class RoomsSelector extends BaseControl {
	constructor(parentId, roomFeatures, elementId) {
		super(parentId, roomFeatures, elementId);
	};

	getValue() {
		return $('#' + this.elementId).val();
	};

	_getTemplate() {
		let html = `<select id="${this.elementId}"><option value="">Choose Room</option>`;
		let rooms = this.feature.status;
		rooms.forEach((room) => {
			html += `<option value="${room.id}">${room.displayName}</option>`;
		});
		html += `</select>`

		return html;
	};

	_renderChanges() {
		let controlValue = this.getValue();
		$('.room').remove();
		if (!controlValue) return; // occurs when "Choose Room" is selected

		// get the room features from the API
		$.get('API/homes/whitehouse/rooms/' + controlValue + '.json', (room) => {
			let roomId = homeID + '_' + controlValue;
			$('#' + containerID).append(`<div id="${roomId}" class="room"><h3>${room.name}</h3></div>`);

			// add all of the room-specific controls using the roomId as the parent elementId and display them
			let roomControls = parseFeatureControls(room.features, roomId);
			roomControls.forEach((control) => {
				control.display();
			});

		}, 'json');
	};

	_save() {
		// nothing to save as we are simply updating the room dropdown
	};
}

/**
 * A Checkbox for a room's lights
 * 
 * @function getValue - Returns the LightValue 'On' or 'Off'
 * @function _getTemplate - Returns HTML to display control
 * @function _renderChanges - Updates room's SVG element to reflect the light's status
 * @function _save - Saves the current value of the control's light
 */
class Light extends BaseControl {
	constructor(parentId, light, elementId) {
		super(parentId, light, elementId);
		this.room = parentId.split('_').pop();
		this.light = light;
		this.svgId = 'g-' + this.room;
	};

	getValue() {
		return $('#' + this.elementId).prop('checked') ? LightValues.On : LightValues.Off;
	};

	_getTemplate() {
		let checked = this.light.status === LightValues.On ? ' checked="checked" ' : '';
		return `<div>
			<input type="checkbox" id="${this.elementId}" value="${this.light.status}" ${checked}/>
			<label for="${this.elementId}">${this.light.name} - On</label>
		</div>`;
	};

	_renderChanges() {
		let svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
		updateLight(svgElement, this.getValue());
	};

	_save() {
		$.get('API/homes/whitehouse/rooms/' + this.room + '.json', {
			light: this.light.name,
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
 * @function getValue - Returns the CurtainValue 'Open' or 'Closed'
 * @function _getTemplate - Returns HTML to display control
 * @function _renderChanges - Updates room's SVG element to reflect the curtain's status
 * @function _save - Saves the current value of the control's curtain position
 */
class Curtain extends BaseControl {
	constructor(parentId, curtain, elementId) {
		super(parentId, curtain, elementId);
		this.curtain = curtain;
		this.room = parentId.split('_').pop();
		this.svgId = 'g-' + this.room;
	};

	getValue() {
		return $('#' + this.elementId).prop('checked') ? CurtainValues.Closed : CurtainValues.Open;
	};

	_getTemplate() {
		let checked = this.curtain.status === CurtainValues.Closed ? ' checked="checked" ' : '';
		return `<div>
			<input type="checkbox" id="${this.elementId}" class="checkbox" value="${this.curtain.status}" ${checked}/>
			<label for="${this.elementId}">${this.curtain.name} - Drawn</label>
		</div>`;
	};

	_renderChanges() {
		let svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
		updateCurtains(svgElement, this.getValue());
	};

	_save() {
		$.get('API/homes/whitehouse/rooms/' + this.room + '.json', {
			curtain: this.curtain.name,
			value: this.getValue()
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	};
}

/**
 * An input slider for a house's temperature
 * 
 * @function getValue - Returns the temperature of the house
 * @function _getTemplate - Returns HTML to display control
 * @function _renderChanges - Updates the background of the house SVG with red/blud to reflect warm/cold temps
 * @function _save - Saves the selected value for the house's temperature
 */
class Temperature extends BaseControl {
	constructor(parentId, feature, elementId) {
		super(parentId, feature, elementId);
		this.svgId = 'home-map';
	};

	getValue() {
		return $('#' + this.elementId).val();
	};

	_getTemplate() {
		return `
			<label for="${this.elementId}" class="integer">
				${this.feature.name}:<span id="${this.elementId}-temp" style="padding: 5px">${this.feature.status}&#8457; </span>
			</label>
			<input type="range" class="integer" min="60" max="80" id="${this.elementId}" value="${this.feature.status}" />
		`;
	};

	_renderChanges() {
		let controlValue = this.getValue();
		$('#' + this.elementId + '-temp').html(controlValue + '&#8457;');
		let warmth = 255 - ((controlValue - 70) * 5);
		let cold = 255 - ((70 - controlValue) * 5);
		let svgElement = document.getElementById(this.svgId);
		svgElement.style.background = 'rgba(' + cold + ', ' + warmth + ',' + warmth + ', 0.5)';
	};

	_save() {
		$.get('API/homes/whitehouse/house.json', {
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
	Temperature: 'temp',
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
