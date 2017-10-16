'use strict';

const Homey = require('homey');
const Log = require('homey-log').Log;

class LogicHomeControlApp extends Homey.App {

	onInit() {

		this.log('LogicHomeControlApp is running...');

	}

}

module.exports = LogicHomeControlApp;
