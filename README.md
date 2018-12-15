# JavaScript application simulating house automation

[See working Example](https://mn263.github.io/home-automation/) 

Interactions: 
- Clicking on a room - Updates the room dropdown for quick management
- Temperature - Changes house SVG color to represent warm/cold temps
- Lights - Changes room colors from yellow to gray representing whether lights are on or not
- Curtain - Changes room opacity indicating natual light being blocked or let in

## Attributions/References
House SVG:
[Little_White_House_floor_plan.svg](https://en.m.wikipedia.org/wiki/File:Little_White_House_floor_plan.svg)

Code Architecture Inspiration:
[Just-Another-Automated-Home](https://github.com/marybeshaw/Just-Another-Automated-Home)
Though I've made many changes to the format and structure of the "APIs", the controllers, and coding standards, the concept of the basic interactions between the API and controllers, along with large chunks of code that were re-written or repurposed, came from Just-Another-Automated-Home.

## Setting up and Running

1.  Clone repo: 

        git clone https://github.com/mn263/home-automation.git


2.  Pre-requisites: install npm, Grunt. 

    [Instructions on starting with Grunt.](https://gruntjs.com/getting-started)


3.  Install grunt-serve

        npm install grunt-serve --save-dev

    [grunt-serve documentation.](https://www.npmjs.com/package/grunt-serve)


4.  To preview run the grunt server from the top-level project folder:

        grunt serve


## Requirements Completed

Pressing a button on a control panel would visually turn on a light, change the
temperature or close the curtains. Some constraints:
- the application must use jQuery
- the components must have HTTP based "server" interaction (use a static file
for simplicity, data persistence is not required). For example, the heating component
retrieves the current temperature from the server and also sends the desired one
back to the server.
- the solution has to be extensible and documented, so that we can
develop our own components that react to events
The application will be executed on a plain HTTP server with no possibility to run
code serverside and is being viewed in 2 major browsers of your choice.


## Building on the project

New controls for features like cieling fans, sprinkler systems, etc. can be added to the controls.js file.
Depending on the new controls you've created you may need to update the "API" (JSON files under the API folder). For an example of this see 'Example of adding to project' section.

To listen for changes made in the controls you can add logic to the 'handleControlChange' function in home.js.
There you will have access to the controller where you can call 'getValue' to get the value of the change or you can compare 'controller instanceof {controller_class}' if you're only interested in listening to changes from specific controller types.

## Control Panel Architecture

The Control Panel is largely build by logic in the home.js file and based off of values in house.json "API."

In home.js we load the house.json file to populate the temp and room selector controls. 
When a room is selected the control calls the rooms/{roomId}.json "API" to build the Light and Curtain controls.


## Example of adding to project
If you wanted to add support for cieling fans then you would first need to add the control to controls.js then you would need to update the API and include the necessary information and an indicator that the feature is to be used by the "Fan" controller.

For an example to follow you can look at how the temperature control is managed. First we created a Temp control and then added API support to house.json where we specify the house's temperature and that the feature should be used by the 'Temp' controller.