'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class ZHC5010 extends ZwaveDevice {
	onMeshInit() {

		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		// register capabilities for this device
		this.registerCapability('onoff', 'BASIC', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
			},
			report: 'BASIC_REPORT',
			reportParser: report => {
				if (report.hasOwnProperty('Value')) {
					return report['Value'] !== 0;
				};
				if (report.hasOwnProperty('Current Value')) {
					return report['Current Value'] !== 0;
				};
				return null;
			}
		});
		this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
			},
			report: 'SWITCH_MULTILEVEL_SET',
			reportParser: report => {
				if (report && report.hasOwnProperty('Value (Raw)')) {
					if (report['Value (Raw)'][0] === 255) return 1;
					return report['Value (Raw)'][0] / 99;
				}
				return null;
			},
		});
		this.registerCapability('dim', 'SWITCH_BINARY', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
			},
			report: 'SWITCH_BINARY_SET',
			reportParser: report => {
				if (report && report.hasOwnProperty('Switch Value (Raw)')) {
					if (report['Switch Value (Raw)'][0] === 255) return 1.0;
					return report['Switch Value (Raw)'][0] / 99;
				}
				return null;
			}
		});
	}
}

module.exports = ZHC5010;
