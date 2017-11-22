'use strict';

const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class ZHC5010 extends ZwaveDevice {
	async onMeshInit() {

		let PreviousSequenceNo = null;

		process.on('unhandledRejection', error => {
			console.error(error.stack);
		})

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		this.onNodesChanged = this._onNodesChanged.bind(this);
		this.getDriver().on('nodes_changed', this.onNodesChanged);

		//===== REGISTER CAPABILITIES
		// register capabilities for this device
		this.registerCapability('onoff', 'BASIC', {
				getOpts: {
					getOnStart: true, // get the initial value on app start
				},
			}),

			this.registerCapability('dim', 'SWITCH_MULTILEVEL', {
				// required since report contains 'Value (RAW)'
				report: 'SWITCH_MULTILEVEL_SET',
				reportParserV4: report => {
					if (report && report.hasOwnProperty('Value (Raw)')) {
						if (this.hasCapability('onoff')) this.setCapabilityValue('onoff', report['Value (Raw)'][0] > 0);
						if (report['Value (Raw)'][0] === 255) return 1;
						return report['Value (Raw)'][0] / 99;
					}
					return null;
				},
			});

		//===== SYNCHRONISE RELAY BASED END DEVICE
		this.registerReportListener('BASIC', 'BASIC_REPORT', (rawReport, parsedReport) => {
			if (this.getData().multiChannelNodeId === this.mainNodeDevice.getSetting('relay_mode')) {
				this.log('Setting the Relay switch to', rawReport.Value === 255, 'based on a state change of multiChannel ID', this.getData().multiChannelNodeId);
				this.mainNodeDevice.setCapabilityValue('onoff', rawReport.Value === 255);
			}
		})

		//===== SCENE ACTIVATION
		const commandClassScene = this.getCommandClass('CENTRAL_SCENE');
		if (!(commandClassScene instanceof Error)) {
			this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
				if (rawReport &&
					rawReport.hasOwnProperty('Properties1') &&
					rawReport.Properties1.hasOwnProperty('Key Attributes') &&
					rawReport.hasOwnProperty('Scene Number') &&
					rawReport.hasOwnProperty('Sequence Number')) {
					if (rawReport['Sequence Number'] !== PreviousSequenceNo) {
						const reportButton = rawReport['Scene Number'];
						// correct for Scene notification offset to get the actual button
						const actualButton = reportButton - (this.getSetting('scene_offset') - 1);

						const remoteValue = {
							scene_number: reportButton.toString(),
							button: actualButton.toString(),
							scene: rawReport.Properties1['Key Attributes'],
						};
						PreviousSequenceNo = rawReport['Sequence Number'];
						this.log('Scene notification report:', remoteValue, 'Sequence Number: ', PreviousSequenceNo)
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
					return Promise.resolve(args.button === state.button && args.scene === state.scene);
				});

			let triggerZHC_button = new Homey.FlowCardTriggerDevice('ZHC_button');
			triggerZHC_button
				.register();
		}

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
						Value: args.level * 99
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
						Value: args.level * 99
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

		// enforce update of mainNodeId during init of device driver
		this.getDriver().emit('nodes_changed');
		this.log('Registered capabilities', this.getCapabilities());
	}

	// update of mainNodeId during init of device driver
	_onNodesChanged() {
		if (!this.mainNodeDevice || this.mainNodeDevice.isDeleted) {
			const mainNodeId = Object.keys(this._manager._nodes)[0]; //this.getData().token;
			this.mainNodeDevice = Object.values(this.getDriver().getDevices()).find(device =>
				device.getData().token === mainNodeId
			)
			if (mainNodeId == this.getData().token) this.log('mainNodeID registered as', mainNodeId)
		}
	}

	// when device is deleted, remove Listener
	onDeleted() {
		this.isDeleted = true;
		this.getDriver().removeListener('nodes_changed', this.onNodesChanged);
	}

	//===== UPDATE PARAMETERS
	// Overwrite the onSettings method, and change the Promise result
	// >> Containment (add callback to onSettings) to resolve callback issues with onSettings; see device.js.alternate
	onSettings(oldSettings, newSettings, changedKeysArr, callback) {
		this.log(changedKeysArr);

		const changedKeys = [];
		//check if one of the 4 button parameters has been changed
		for (var i = 1; i <= 4; i++) {
			// Non-secure commands for devices in logical device i association groups (bit patterns): but(i)_nonsec_bit(j)
			if (changedKeysArr.join().includes('but' + i + '_nonsec_bit')) {
				let value = 0;
				let oldValue = 0;
				for (var j = 1; j <= 5; j++) {
					value += newSettings['but' + i + '_nonsec_bit' + j] * Math.pow(2, j);
					oldValue += oldSettings['but' + i + '_nonsec_bit' + j] * Math.pow(2, j);
				}
				const changedKey = {
					id: 32 + i,
					size: 1,
					value,
					oldValue,
				};
				this.log('Setting non-secure groups for button', i, 'to decimal value:', value);
				changedKeys.push(changedKey);
				// >> REMOVE 'but' + i + '_nonsec_bit' from changedKeysArr

			};
			// Multilevel Switch on single press for device i (4 byte patterns): but(i)_multilevel_byte(j)
			if (changedKeysArr.join().includes('but' + i + '_multilevel_byte')) {
				const arr = new Uint8Array(4);
				const oldArr = new Uint8Array(4);
				// Byte 1: Enable / Disable (1 / 0)
				arr[0] = newSettings['but' + i + '_multilevel_byte1']
				oldArr[0] = oldSettings['but' + i + '_multilevel_byte1']
				// Byte 2: Upper switch value (0 – 99, 255)
				arr[1] = newSettings['but' + i + '_multilevel_byte2'] > 99 ? 255 : newSettings['but' + i + '_multilevel_byte2'];
				oldArr[1] = oldSettings['but' + i + '_multilevel_byte2'] > 99 ? 255 : oldSettings['but' + i + '_multilevel_byte2'];
				// Byte 3: Lower switch value (0 - 99)
				arr[2] = newSettings['but' + i + '_multilevel_byte3']
				oldArr[2] = oldSettings['but' + i + '_multilevel_byte3']

				const changedKey = {
					id: 18 + i,
					size: 4,
					parsedValue: new Buffer(arr.buffer),
					parsedOldValue: new Buffer(oldArr.buffer),
				};
				changedKey.value = changedKey.parsedValue.readUIntBE(0, 4);
				changedKey.parsedOldValue = changedKey.parsedValue.readUIntBE(0, 4);
				this.log('Setting Multilevel Switch settings for button', i, 'to enabled:', arr[0] === 1, ', with switch values:', arr[1], '/', arr[2], '(upper/lower)');
				changedKeys.push(changedKey);
				// >> REMOVE 'but' + i + '_multilevel_byte from changedKeysArr
			}
		};

		this.log('changedKeys', changedKeys);

		// >> Containment code to resolve callback issues with onSettings; see device.js.alternate
		Promise.all(
				changedKeys.map(async(changedKey) => {
					this.log('changedKey: ', changedKey.id, changedKey.size, changedKey.value);
					await this.configurationSet({
						index: changedKey.id,
						size: changedKey.size
					}, changedKey.value)
				})
			)
			.then(() => {
				return super.onSettings(oldSettings, newSettings, changedKeysArr);
			})
			.then((result) => {
				this.log('Device settings have been saved for:', changedKeysArr);
				callback(null, result);
				return result;
			})
			.catch(err => {
				this.error('Device settings change rejected. Reverting!');
				// Reverting settings to old setting object

				changedKeys.forEach(async(changedKey) => {
					changedKey.value = changedKey.oldValue;
					changedKey.parsedValue = changedKey.parsedOldValue;
					// Or set configuration value that is not defined in manifest

					await this.configurationSet({
						index: changedKey.id,
						size: changedKey.size
					}, changedKey.value);
				});

				callback(err || new Error('settings_change_failed'));
				return Promise.reject(err || new Error('settings_change_failed'));
			});
	}
}

module.exports = ZHC5010;
