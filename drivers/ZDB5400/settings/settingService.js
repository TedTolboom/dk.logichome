const DimmerControlKey = "operating_pushbuttons_";
const GlobalBrightnessControlKey = 'global_brightness_control_';
const SecureAssociationGroupKey = 'association_group_secure_'
const OnIndicationRgbSaturationPushbuttonKey = 'on_indication_rgb_saturation_pushbutton_';
const OffIndicationRgbSaturationPushbuttonKey = 'off_indication_rgb_saturation_pushbutton_';

class SettingService {

    constructor(oldSettings, newSettings, changedKeys) {
        this.oldSettings = oldSettings;
        this.newSettings = newSettings;
        this.changedKeys = changedKeys;
    }

    AddDimmerControlSettingChanges(manuallyHandledKeys) {

        if (this.changedKeys.join().includes(DimmerControlKey)) {
            let newValue = 0;
            let oldValue = 0;

            for (let i = 0; i < 4; i++) {
                newValue += this.newSettings[DimmerControlKey + i] * Math.pow(2, i);
                oldValue += this.oldSettings[DimmerControlKey + i] * Math.pow(2, i);
            }

            const changedKey = {
                id: 1,
                size: 1,
                value: newValue,
                oldValue
            }

            manuallyHandledKeys.push(changedKey);
        }
    }

    AddClobalBrightnessSettingsChanges(manuallyHandledKeys) {
        
        // start on index 1, because byte 4 is not used.
        this.AddRGBSettingChanges(manuallyHandledKeys, 14, 1, GlobalBrightnessControlKey);
    }

    AddOnIndicationRgbSaturationForPushButtons(pushButtonNumber, parameterId, manuallyHandledKeys) {

        var key = OnIndicationRgbSaturationPushbuttonKey + pushButtonNumber + '_';
        this.AddRGBSettingChanges(manuallyHandledKeys, parameterId, 0, key);
    }

    AddOffIndicationRgbSaturationForPushButtons(pushButtonNumber, parameterId, manuallyHandledKeys) {

        var key = OffIndicationRgbSaturationPushbuttonKey + pushButtonNumber + '_';
        this.AddRGBSettingChanges(manuallyHandledKeys, parameterId, 0, key);
    }

    AddRGBSettingChanges(manuallyHandledKeys, parameterId, startIndex, key) {

        if (this.changedKeys.join().includes(key)) {
            let newValue = 0;
            let oldValue = 0;

            for (let i = startIndex; i < 4; i++) {
                newValue += this.newSettings[key + i] * Math.pow(2, i * 8);
                oldValue += this.oldSettings[key + i] * Math.pow(2, i * 8);
            }
            
            const changedKey = {
                id: parameterId,
                size: 4,
                value: newValue,
                oldValue
            }

            manuallyHandledKeys.push(changedKey);
        }
    }

    AddSecureAssociationGroupSettingsChanges(manuallyHandledKeys) {

        if (this.changedKeys.join().includes(SecureAssociationGroupKey)) {
            let newValue = 0;
            let oldValue = 0;

            for (let i = 0; i < 13; i++) {
                var id = i + 2;
                newValue += this.newSettings[SecureAssociationGroupKey + id] * Math.pow(2, i);
                oldValue += this.oldSettings[SecureAssociationGroupKey + id] * Math.pow(2, i);
            }

            const changedKey = {
                id: 15,
                size: 2,
                value: newValue,
                oldValue
            };

            manuallyHandledKeys.push(changedKey);
        }
    }
}

module.exports = SettingService;