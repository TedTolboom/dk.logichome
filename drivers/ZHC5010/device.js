'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class ZHC5010 extends ZwaveDevice {
	onMeshInit() {
		let PreviousSequenceNo = null;
		const dimmingDuration = 'Instantly'; // 'Default'// Factory Default
		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		//===== REGISTER CAPABILITIES
		// register capabilities for this device
		// OPEN WORK: add to reportParser a link to change the state of the relay if relay is controlled by one of the buttons (based on parameter 15)
		this.registerCapability('onoff', 'BASIC', {
				getOpts: {
					getOnStart: true, // get the initial value on app start
					// getOnWakeUp: true, // only useful for battery devices
				},
				/*
					get: 'BASIC_GET',
					set: 'BASIC_SET',
					setParserV1: value => ({
						'Value': (value) ? 255 : 0,
					}),*/
				report: 'BASIC_REPORT',
				reportParserV1: (report, node) => {
					if (report && report.hasOwnProperty('Value')) {
						this.log('reported node:', this.node.MultiChannelNodes);
						return report.Value === 255;
					}
					return null;
				},
			}),
			/*
			this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
				getOpts: {
					getOnStart: true, // get the initial value on app start
					// getOnWakeUp: true, // only useful for battery devices
				},
				get: 'SWITCH_MULTILEVEL_GET',
				set: 'SWITCH_MULTILEVEL_SET',
				setParserV4: value => ({
					Value: (value > 0) ? 'on/enable' : 'off/disable',
					'Dimming Duration': dimmingDuration,
				}),
				report: 'SWITCH_MULTILEVEL_SET',
				reportParserV4: report => {
					if (report) {
						this.log('report onoff: ', report);
						if (report.hasOwnProperty('Value')) {
							if (typeof report.Value === 'number') return report.Value > 0;
							if (typeof report.Value === 'string') return report.Value === 'on/enable';
						}
						if (report.hasOwnProperty('Value (Raw)')) return report['Value (Raw)'][0] > 0;
					}
					return null;
				},
			});
		*/
			this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
				getOpts: {
					getOnStart: true, // get the initial value on app start
				},
				get: 'SWITCH_MULTILEVEL_GET',
				set: 'SWITCH_MULTILEVEL_SET',
				setParserV4: value => {
					this.log('setting dim level to: ', value * 99);
					const setValue = {
						Value: Math.round(value * 99),
						'Dimming Duration': dimmingDuration,
					}
					return setValue
				},
				report: 'SWITCH_MULTILEVEL_SET',
				reportParserV4: report => {
					if (report && report.hasOwnProperty('Value (Raw)')) {
						if (report['Value (Raw)'][0] === 255) return 1;
						return report['Value (Raw)'][0] / 99;
					}
					return null;
				},
			});

		//===== SCENE ACTIVATION
		// OPEN WORK: compensate for Parameter Number 17, Parameter Size 1. Scene notification offset.
		this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
			this.log('registerReportListener', rawReport, parsedReport);
			var sceneOffset = this.getSettings().scene_offset;
			this.log('scene_offset: ', sceneOffset, 'actual button: button', sceneOffset)
			if (rawReport &&
				rawReport.hasOwnProperty('Properties1') &&
				rawReport.Properties1.hasOwnProperty('Key Attributes') &&
				rawReport.hasOwnProperty('Scene Number') &&
				rawReport.hasOwnProperty('Sequence Number')) {
				if (rawReport['Sequence Number'] !== PreviousSequenceNo) {
					// var scene = Number(rawReport.Properties1['Key Attributes']);
					const remoteValue = {
						button: rawReport['Scene Number'].toString(),
						scene: rawReport.Properties1['Key Attributes'],
					};
					// this.log('actual button: button', typeof (remoteValue.scene), typeof (sceneOffset));
					PreviousSequenceNo = rawReport['Scene Number'] + '_' + rawReport['Sequence Number'];
					this.log('remoteValue: ', remoteValue, 'New previousSequenceNo: ', PreviousSequenceNo)
					// Trigger the trigger card with 2 dropdown options
					triggerZHC5010_scene.trigger(this, triggerZHC5010_scene.getArgumentValues, remoteValue);
					// Trigger the trigger card with tokens
					triggerZHC_button.trigger(this, remoteValue, null);
				}
			}
		});

		// define and register FlowCardTriggers
		let triggerZHC5010_scene = new Homey.FlowCardTriggerDevice('ZHC5010_scene');
		triggerZHC5010_scene
			.register()
			.registerRunListener((args, state) => {
				this.log(args, state);
				return Promise.resolve(args.button === state.button && args.scene === state.scene);
			});

		let triggerZHC_button = new Homey.FlowCardTriggerDevice('ZHC_button');
		triggerZHC_button
			.register();

		//===== CONTROL LED's flow card actions
		// define FlowCardAction to set the LED indicator LED level
		let ZHC5010_setLEDlevel_run_listener = async(args) => {
			this.log('FlowCardAction Set LED level for: ', args.led, 'to level: ', args.level);
			let result = await args.device.node.CommandClass.COMMAND_CLASS_INDICATOR.INDICATOR_SET({
				'Indicator 0 Value': 'off/disable',
				Properties1: {
					'Indicator Object Count': 1,
					Reserved: 0
				},
				vg1: [
					{
						'Indicator ID': args.led,
						'Property ID': 'Multilevel',
						Value: args.level
          }
        ]
			});
			this.log("outcome: ", result)
			if (result !== 'TRANSMIT_COMPLETE_OK') throw new Error(result);
		};

		let actionZHC5010_setLEDlevel = new Homey.FlowCardAction('ZHC5010_set_led_level');
		actionZHC5010_setLEDlevel
			.register()
			.registerRunListener(ZHC5010_setLEDlevel_run_listener);

		// OPEN WORK: to be added
		// define FlowCardAction to start the flashing mode of a LED indicator
		let ZHC5010_setLEDflash_run_listener = async(args) => {
			this.log('FlowCardAction Set LED flash: ', args.led, 'to level: ', args.level, 'on_off_period: ', args.on_off_period, 'on_off_cycles: ', args.on_off_cycles);
			let result = await args.device.node.CommandClass.COMMAND_CLASS_INDICATOR.INDICATOR_SET({
				'Indicator 0 Value': 'off/disable',
				Properties1: {
					'Indicator Object Count': 3,
					Reserved: 0
				},
				vg1: [
					{
						'Indicator ID': args.led,
						'Property ID': 'Multilevel',
						Value: args.level
          },
					{
						'Indicator ID': args.led,
						'Property ID': 'On_Off_Period',
						Value: args.on_off_period * 10
          },
					{
						'Indicator ID': args.led,
						'Property ID': 'On_Off_Cycles',
						Value: args.on_off_cycles
          }
        ]
			})
			this.log("outcome: ", result)
			if (result !== 'TRANSMIT_COMPLETE_OK') throw new Error(result);
		};

		let actionZHC5010_setLEDflash = new Homey.FlowCardAction('ZHC5010_set_led_flash');
		actionZHC5010_setLEDflash
			.register()
			.registerRunListener(ZHC5010_setLEDflash_run_listener);

		// define FlowCardAction to stop the flashing of the LED indicator
		let ZHC5010_stopLEDflash_run_listener = async(args) => {
			this.log('FlowCardAction Set LED flash: ', args.led, 'to level: ', args.level, 'on_off_period: ', args.on_off_period, 'on_off_cycles: ', args.on_off_cycles);
			let result = await args.device.node.CommandClass.COMMAND_CLASS_INDICATOR.INDICATOR_SET({
				'Indicator 0 Value': 'off/disable',
				Properties1: {
					'Indicator Object Count': 3,
					Reserved: 0
				},
				vg1: [
					{
						'Indicator ID': args.led,
						'Property ID': 'On_Off_Cycles',
						Value: 0
				}
			]
			})
			this.log("outcome: ", result)
			if (result !== 'TRANSMIT_COMPLETE_OK') throw new Error(result);
		};

		let actionZHC5010_stopLEDflash = new Homey.FlowCardAction('ZHC5010_stop_led_flash');
		actionZHC5010_stopLEDflash
			.register()
			.registerRunListener(ZHC5010_stopLEDflash_run_listener);
	}

	//===== UPDATE PARAMETERS
	// Overwrite the onSettings method, and change the Promise result
	onSettings(oldSettings, newSettings, changedKeysArr) {
		//check if one of the 4 button parameters has been changed
		for (var i = 1; i <= 4; i++) {
			// Non-secure commands for devices in logical device i association groups (bit patterns): but(i)_nonsec_bit(j)
			if (changedKeysArr.join().includes('but' + i + '_nonsec_bit')) {
				let value = 0
				for (var j = 1; j <= 5; j++) {
					value += newSettings['but' + i + '_nonsec_bit' + j] * Math.pow(2, j);
				}
				const changedKey = {
					id: 32 + i,
					size: 1,
					value: value,
				};
				this.log('Setting non-secure groups for button ', i, 'to decimal value: ', value);
				changedKey.parsedValue = super._systemSettingParser(changedKey.value, changedKey);
				this.ZHC_configuration_run_listener(this, changedKey);
			};
			// Multilevel Switch on single press for device i (4 byte patterns): but(i)_multilevel_byte(j)
			if (changedKeysArr.join().includes('but' + i + '_multilevel_byte')) {
				const arr = new Uint8Array(4);
				// Byte 1: Enable / Disable (1 / 0)
				arr[0] = newSettings['but' + i + '_multilevel_byte1']
				// Byte 2: Upper switch value (0 – 99, 255)
				arr[1] = newSettings['but' + i + '_multilevel_byte2'] > 99 ? 255 : newSettings['but' + i + '_multilevel_byte2'];
				// Byte 3: Lower switch value (0 - 99)
				arr[2] = newSettings['but' + i + '_multilevel_byte3']

				const changedKey = {
					id: 18 + i,
					size: 4,
					parsedValue: new Buffer(arr.buffer),
				};
				changedKey.value = changedKey.parsedValue.readUIntBE(0, 4);
				this.log('Setting Multilevel Switch settings for button ', i, 'to enabled: ', arr[0] === 1, ', with switch values: ', arr[1], '/', arr[2], '(upper/lower)');
				this.ZHC_configuration_run_listener(this, changedKey);
			}
		};
		// Proceed with other paramters
		return super.onSettings(oldSettings, newSettings, changedKeysArr)
			.then(res => {
				return 'Device settings have been saved';
			})
			.catch(err => {
				return 'Error!';
			})
	}

	// update Z-wave configuration parameters
	async ZHC_configuration_run_listener(args, changedKey) {
		this._debug('Setting configuration parameter: ', changedKey);
		args.node.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
			'Parameter Number': changedKey.id,
			Level: {
				Size: changedKey.size,
				Default: false,
			},
			'Configuration Value': changedKey.parsedValue, // in .size byte Buffer
		}, (err, result) => {
			if (err) return this._debug('CONFIGURATION_SET', err);
		});
		return Promise.resolve();
	}
}

module.exports = ZHC5010;
