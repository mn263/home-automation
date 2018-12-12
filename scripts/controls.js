/**
 * NOTE: All Controls should implement the following functions:
 * getTemplate - returns the HTML template the will be used to create the control
 * getValue - returns the status of the control (i.e., lights on/off or curtains open/closed)
 * updateHouse - updates the UI
 * save - calls the API to save changes to the controller
 */

 const ControlsEnum = {
	RoomsSelector: 'rooms',
	Temp: 'temp',
	Light: 'lights',
	Curtain: 'curtain',
 }

class RoomsSelector  {
	constructor(elementId) {
		this.elementId = elementId;
	};
	getTemplate(featureType, features) {
		var html = `<select id="` + this.elementId + `">
			<option value="">Choose Room</option>`;
		features["current-value"].forEach((room) => {
			html += `<option value="` + room.id + `">` + room.displayName + `</option>`;
		});
		html += `</select>`
		return html;
	};
	getValue() {
		return $('#' + this.elementId).val();
	};
	updateHouse() {
		var controlValue = this.getValue();
		$('.room').remove();
		if (!controlValue) return; // occurs when "Choose Room" is selected
		// todo: this.$doc.trigger( "update-room", [$name.text(), newRoom] );
		// get the room features from the API
		$.get('API/homes/whitehouse/rooms/' + controlValue + '.json', (room) => {
			var roomHTML = '';
			var roomID = homeID + idDelimiter + controlValue;
			// use a div & h3 heading for styling
			roomHTML += '<div id="' + roomID + '" class="room"><h3>' + room.name + '</h3>';
			roomHTML += featureControlsHTML(featureTypes, room.features, roomID);
			roomHTML += '</div>';

			$('#' + containerID).append(roomHTML);
			// listen for changes on the added room
			$('#' + containerID + ' input').change(updateFeature);
		}, 'json');
	};
	save() {
		// nothing to save as we are simply updating the room dropdown
	};
}

class Light  {
	constructor(roomId, elementId) {
		this.elementId = elementId;
		this.roomId = roomId;
		this.svgId = 'g-' + elementId;
	};
	getTemplate (featureType, feature) {
		var checked = feature['current-value'] === 'On'	? ' checked="checked" ' : '';
		return `<label class="switch"><input type="checkbox" id="` + this.elementId + `" class="boolean" value="` + featureType['true-value'] + `" ` + checked + `/><span class="slider"></span></label>
			<label for="` + this.elementId + `">` + feature.name + ` - On</label>`;
	};
	getValue() {
		return $('#' + this.elementId).prop('checked') ? 'On' : 'Off';
	};
	updateHouse(feature) {
		var svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
		updateLight(svgElement, this.getValue());
	};
	save(feature) {
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
	constructor(roomId, elementId) {
		this.elementId = elementId;
		this.roomId = roomId;
		this.svgId = 'g-' + elementId;
	};
	getTemplate (featureType, feature) {
		var checked = feature['current-value'] === 'Closed'	? ' checked="checked" ' : '';
		return `<label class="switch"><input type="checkbox" id="` + this.elementId + `" class="boolean" value="` + featureType['true-value'] + `" ` + checked + `/><span class="slider"></span></label>
			<label for="` + this.elementId + `">` + feature.name + ` - Drawn</label>`;
	};	
	getValue() {
		return $('#' + this.elementId).prop('checked') ? 'Closed' : 'Open';
	};
	updateHouse() {
		var svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
		updateCurtains(svgElement, this.getValue());
	};
	save(feature) {
		this.updateHouse();
		// call API to update room with the changes
		$.post('API/homes/whitehouse/rooms/' + this.roomId + '.json', {
			curtain: feature.name,
			value: controlValue
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	};
}

class Temp  {
	constructor(elementId) {
		this.elementId = elementId;
		this.svgId = 'home-map';
	};
	getTemplate (featureType, feature) {
		return `<label for="` + this.elementId + `" class="integer"> ` + feature.name + `:
				<span id="` + this.elementId + `-temp" style="padding: 5px">` + feature[`current-value`] + `&#8457; </span>
			</label>
			<input type="range" class="integer" min="60" max="80"
				id="` + this.elementId + `" value="` + feature[`current-value`] + `" />`;
	};	
	getValue() {
		return $('#' + this.elementId).val();
	}
	updateHouse() {
		// update the house SVG
		var controlValue = this.getValue();
		$('#' + this.elementId + '-temp').html(controlValue + '&#8457;');
		var warmth = 255 - ((controlValue - 70) * 5);
		var cold = 255 - ((70 - controlValue) * 5);
		var svgElement = document.getElementById(this.svgId);
		svgElement.style.background = 'rgba(' + cold + ', ' + warmth + ',' + warmth + ', 0.5)';
	};
	save() {
		// call API to update house temp
		$.post('API/homes/whitehouse/home.json', {
			temp: this.getValue(),
		}).done(function (data) {
			if (data.success === false) {
				alert("Error saving adjustment: " + data.success);
			}
		}, 'json');
	}
}