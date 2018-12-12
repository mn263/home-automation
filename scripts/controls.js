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
	Light: 'light',
	Curtain: 'curtain',
}

class RoomsSelector {
	constructor(elementId) {
		this.elementId = elementId;
	};
	getTemplate(features) {
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
			var roomID = homeID + '_' + controlValue;
			var roomHTML = `<div id="` + roomID + `" class="room">
				<h3>` + room.name + `</h3>` + featureControlsHTML(room.features, roomID) + `
				</div>`;

			$('#' + containerID).append(roomHTML);
			// listen for changes on the added room
			$('#' + containerID + ' input').change(updateFeature);
		}, 'json');
	};
	save() {
		// nothing to save as we are simply updating the room dropdown
	};
}

class Light {
	constructor(light, roomId, elementId, room) {
		this.elementId = elementId;
		this.roomId = roomId;
		this.room = room;
		this.light = light;
		this.svgId = 'g-' + roomId;
	};
	getTemplate() {
		var checked = this.light['current-value'] === 'On' ? ' checked="checked" ' : '';
		return `<input type="checkbox" id="` + this.elementId + `" value="` + this.light['current-value'] + `" ` + checked + `/>
			<label for="` + this.elementId + `">` + this.light.name + ` - On</label>`;
	};
	getValue() {
		return $('#' + this.elementId).prop('checked') ? 'On' : 'Off';
	};
	updateHouse() {
		var svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
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

class Curtain {
	constructor(curtain, roomId, elementId, room) {
		this.elementId = elementId;
		this.roomId = roomId;
		this.room = room;
		this.curtain = curtain;
		this.svgId = 'g-' + roomId;
	};
	getTemplate() {
		var checked = this.curtain['current-value'] === 'Closed' ? ' checked="checked" ' : '';
		return `<input type="checkbox" id="` + this.elementId + `" class="boolean" value="` + this.curtain['current-value'] + `" ` + checked + `/>
			<label for="` + this.elementId + `">` + this.curtain.name + ` - Drawn</label>`;
	};
	getValue() {
		return $('#' + this.elementId).prop('checked') ? 'Closed' : 'Open';
	};
	updateHouse() {
		var svgElement = document.getElementById('home-map').contentDocument.getElementById(this.svgId);
		updateCurtains(svgElement, this.getValue());
	};
	save() {
		this.updateHouse();
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

class Temp {
	constructor(elementId) {
		this.elementId = elementId;
		this.svgId = 'home-map';
	};
	getTemplate(feature) {
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