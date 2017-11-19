'use strict';

const Homey = require('homey');

class LogicHomeControlApp extends Homey.App {

	onInit() {

		this.log('LogicHomeControlApp is running...');

	}

}

module.exports = LogicHomeControlApp;
