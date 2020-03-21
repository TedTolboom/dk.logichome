'use strict';

const Homey = require('homey');
const { ZwaveDevice } = require('homey-meshdriver');
const SettingService = require('./settings/settingService');

class MyZWaveDevice extends ZwaveDevice {

	onMeshInit() {
		this.log('MyZWaveDevice has been inited');

		process.on('unhandledRejection', error => {
			console.error(error.stack);
		})

		let triggerZDB5400_scene = new Homey.FlowCardTriggerDevice('ZDB5400_scene');
		triggerZDB5400_scene
			.register()
			.registerRunListener((args, state) => {
				return Promise.resolve(args.button === state.button && args.scene === state.scene);
			});
		

		const commandClassScene = this.getCommandClass('CENTRAL_SCENE');
		if (!(commandClassScene instanceof Error)) {
			this.log('registering repost listener')
			this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (report, _) => {
				if (report &&
					report.hasOwnProperty('Properties1') &&
					report.Properties1.hasOwnProperty('Key Attributes') &&
					report.hasOwnProperty('Scene Number')) {
					
					const remoteValues = {
						scene_number: report['Scene Number'].toString(),
						button: report['Scene Number'].toString(),
						scene: report.Properties1['Key Attributes']
					}

					triggerZDB5400_scene.trigger(this, triggerZDB5400_scene.getArgumentValues, remoteValues);
				}
			})
		}
	}

	onSettings(oldSettings, newSettings, changedKeys, callback) {

		let manuallyHandledKeys = [];

		let settingService = new SettingService(
			oldSettings,
			newSettings,
			changedKeys);

		settingService.AddDimmerControlSettingChanges(manuallyHandledKeys);
		settingService.AddClobalBrightnessSettingsChanges(manuallyHandledKeys);
		settingService.AddSecureAssociationGroupSettingsChanges(manuallyHandledKeys);
		settingService.AddOnIndicationRgbSaturationForPushButtons(1, 22, manuallyHandledKeys);
		settingService.AddOffIndicationRgbSaturationForPushButtons(1, 23, manuallyHandledKeys);
		settingService.AddOnIndicationRgbSaturationForPushButtons(2, 30, manuallyHandledKeys);
		settingService.AddOffIndicationRgbSaturationForPushButtons(2, 31, manuallyHandledKeys);
		settingService.AddOnIndicationRgbSaturationForPushButtons(3, 38, manuallyHandledKeys);
		settingService.AddOffIndicationRgbSaturationForPushButtons(3, 39, manuallyHandledKeys);
		settingService.AddOnIndicationRgbSaturationForPushButtons(4, 46, manuallyHandledKeys);
		settingService.AddOffIndicationRgbSaturationForPushButtons(4, 47, manuallyHandledKeys);
		
		this.UpdateSettings(oldSettings, newSettings, changedKeys, manuallyHandledKeys, callback);
	}

	UpdateSettings(oldSettings, newSettings, changedKeys, manuallyHandledKeys, callback) {
		Promise.all(
			manuallyHandledKeys.map(async changedKey => {
				this.log('changedKey: ', changedKey.id, changedKey.size, changedKey.value);
				await this.configurationSet({
					index: changedKey.id,
					size: changedKey.size,
					signed: false
				}, changedKey.value)
			})
		)
		.then(() => {
			super.onSettings(oldSettings, newSettings, changedKeys);
		})
		.then((result) => {
			this.log('Device settings have been saved for:', changedKeys);
			callback(null, result);
			return result;
		})
		.catch(err => {
			this.error('Device settings change rejected. Reverting!');
			// Reverting settings to old setting object

			manuallyHandledKeys.forEach(async(changedKey) => {
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

module.exports = MyZWaveDevice;
