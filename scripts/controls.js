/**
 * NOTE: All Controls should implement the following functions:
 * getTemplate - returns the HTML template the will be used to create the control
 * getValue - returns the status of the control (i.e., lights on/off or curtains open/closed)
 * updateHouse - call this function update API and animate the SVG
 */

 const ControlsEnum = {
	Dropdown: 'dropdown',
	Slider: 'slider',
	Checkbox: 'checkbox',
	// or maybe
	Temp: 'temp',
	RoomSelector: 'rooms',
	Room: 'room',
	Light: 'light',
	Curtain: 'curtain',

 }

class Dropdown  {
	constructor() {};

	getTemplate(featureType, features, domID) {
		'use strict';

		var newHTML = '';
		newHTML = '<select id="' + domID + '">';
		newHTML += '<option value="">Choose Room</option>';
		features["current-value"].forEach((room) => {
			newHTML += '<option value="' + room.id + '">' + room.displayName + '</option>';
		});
		newHTML += `</select>`

		return newHTML;
	};
	getValue(featureType, feature, domID) {
		'use strict';
		return $('#' + domID).val();
	};
	updateHouse(featureType, feature, domID, controlValue, svgElement) {
		'use strict';
		
		$('.room').remove();
		if (!controlValue) return; // occurs when "Choose Room" is selected
		// todo: this.$doc.trigger( "update-room", [$name.text(), newRoom] );
		// get the room features from the API
		$.get('API/homes/whitehouse/rooms/' + controlValue + '.json', (room) => {
			var roomHTML = '';
			var roomID = JAHOME.homeID + JAHOME.idDelimiter + controlValue;
			// use a div & h3 heading for styling
			roomHTML += '<div id="' + roomID + '" class="room"><h3>' + room.name + '</h3>';
			roomHTML += JAHOME.featureControlsHTML(JAHOME.featureTypes, room.features, roomID);
			roomHTML += '</div>';

			$('#' + JAHOME.containerID).append(roomHTML);
			// listen for changes on the added room
			$('#' + JAHOME.containerID + ' input').change(JAHOME.updateFeature);
		}, 'json');

	};
}

class Light  {
	constructor(roomId) {
		this.roomId = roomId;
	};
	getTemplate (featureType, feature, domID) {
		'use strict';

		var checked = feature['current-value'] === 'On'	? ' checked="checked" ' : '';
		return `<label class="switch"><input type="checkbox" id="` + domID + `" class="boolean" value="` + featureType['true-value'] + `" ` + checked + `/><span class="slider"></span></label>
			<label for="` + domID + `">` + feature.name + ` - On</label>`;
	};
	getValue(featureType, feature, domID) {
		'use strict';
		return $('#' + domID).prop('checked') ? 'On' : 'Off';
	}
	updateHouse(featureType, feature, domID, controlValue, svgElement) {
		'use strict';

		updateLight(svgElement, controlValue);
		// call API to update room with the changes
		$.post('API/homes/whitehouse/rooms/' + this.roomId + '.json', {
			light: feature.name,
			value: controlValue
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	}
}

class Curtain  {
	constructor(roomId) {
		this.roomId = roomId;
	};
	getTemplate (featureType, feature, domID) {
		'use strict';
		var checked = feature['current-value'] === 'Closed'	? ' checked="checked" ' : '';
		return `<label class="switch"><input type="checkbox" id="` + domID + `" class="boolean" value="` + featureType['true-value'] + `" ` + checked + `/><span class="slider"></span></label>
			<label for="` + domID + `">` + feature.name + ` - Drawn</label>`;
	};	
	getValue(featureType, feature, domID) {
		'use strict';
		return $('#' + domID).prop('checked') ? 'Closed' : 'Open';
	}
	updateHouse(featureType, feature, domID, controlValue, svgElement) {
		'use strict';

		updateCurtains(svgElement, controlValue);
		// call API to update room with the changes
		$.post('API/homes/whitehouse/rooms/' + this.roomId + '.json', {
			curtain: feature.name,
			value: controlValue
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	}
}

class Temp  {
	constructor() {};
	getTemplate (featureType, feature, domID) {
		'use strict';

		var newHTML = '<label for="' + domID + '" class="integer"> ' + feature.name + ':' 
			+ '<span id="' + domID + '-temp" style="padding: 5px">' + feature['current-value'] + featureType.units + '</span>' 
			+ '</label>';
		newHTML += '<input type="range" class="integer" min="' + featureType.min + '" max="' + featureType.max + '" ';
		newHTML += 'id="' + domID + '" value="' + feature['current-value'] + '" />';
		return newHTML;
	};	
	getValue(featureType, feature, domID) {
		'use strict';
		return $('#' + domID).val();
	}
	updateHouse(featureType, feature, domID, controlValue, svgElement) {
		'use strict';
		// update the house SVG
		$('#' + domID + '-temp').html(controlValue + featureType.units);
		var warmth = 255 - ((controlValue - 70) * 5);
		var cold = 255 - ((70 - controlValue) * 5);
		svgElement.style.background = 'rgba(' + cold + ', ' + warmth + ',' + warmth + ', 0.5)';

		// call API to update house temp
		$.post('API/homes/whitehouse/home.json', {
			temp: controlValue,
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	}
}

const CONTROLS = {
		// TODO: instead of boolean, integer, etc.
		// let's use dropdown, checkbox, slider, etc.
		"boolean": {
			// this function should return the HTML needed to create the control on the page
			// why not just add it to the dom here?  
			// save everything up & add it at once, for better performance.
		},
		
		// the integer data type powers the temperature control
		"temp": {

			// this function should return the HTML needed to create the control on the page
			// why not just add it to the dom here?  
			// save everything up & add it at once, for better performance.
			"getTemplate": function (featureType, feature, domID) {
				'use strict';

			},

			// return the feature control’s actual value,
			// here we have abstraction! it may or may not be what is in the form field
			"getValue": function (featureType, feature, domID) {
				'use strict';

				
			},

			// call this function to animate the feature in the SVG
			"updateHouse": function (featureType, feature, domID, controlValue, svgElement) {
				'use strict';

				// update the visible value //℉
			}
		}
};