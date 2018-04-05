# Logic Home Control

This app adds support for Logic Home Control Z-wave devices made by [Logic Home Control ApS](http://logichome.dk/).

## Links:
[Logic Home Control app Athom apps](https://apps.athom.com/app/dk.logichome)                    
[Logic Home Control Github repository](https://github.com/TedTolboom/dk.logichome)   

**Note:** This app is using [HomeyConfig composer](https://www.npmjs.com/package/node-homey-config-composer).   
Please file Pull Requests on the *development* branch of this repository and with respect to the refactored files in _/drivers_ and _/config_ folders.   

## Supported devices
* ZHC5010, Wall switch module for FUGA® installations [product page](http://logichome.dk/index.php/products/3-zhc5010-z-wave-switch-module-for-fuga-installations)
* ZHC5002, Z-Wave coupler for GIRA [product page](http://logichome.dk/index.php/products/7-zhc5002-z-wave-coupler-for-gira)

## Supported Languages:
* English

## ZHC5010 Features

When ZHC5010 is included, a root device and 4 sub-devices (one for each button) are created.
The root device has triggers for Central Scene notifications from all the buttons.

Triggers:
* Central Scene triggers for:
  * Single key press.
  * Double key press.
  * Long key press (key held).
  * Key release, after key held.

Actions:
 * The root device is able to control the relay (onoff)   
 * The sub-devices control the linked devices (onoff, dim)
 * It is possible to control the 4 LED's, by means of action cards.

### ZHC5010 application notes
Detailed application notes for the ZHC5010, the Logic Home Control app (v2.x) and the ZHC5010 firmware version 2.x can be found [here](https://github.com/TedTolboom/dk.logichome/blob/development/docs/LHC_Application_notes.pdf) (credits to @cbho)

## ZHC5002 Features

When ZHC5002 is included, a root device and 6 sub-devices (one for each button) are created.
The root device has triggers for Central Scene notifications from all the buttons.

Triggers:
* Central Scene triggers for:
 * Single key press.
 * Double key press.
 * Long key press (key held).
 * Key release, after key held.

Actions:
* The root device is able to control the relay (onoff)   
* The sub-devices control the linked devices (onoff, dim)

## Change Log:
### v 2.0.1
* Add link to Homey community Forum   

### v 2.0.0
* Major app update to SDK2, _requires Homey SW release >=1.5.6_
* Add support for the ZHC5002   
* Added all options to support FW 2.x (secure inclusion) of [ZHC5010](http://logichome.dk/index.php/10-support-categories/6-zhc5010-firmware) and ZHC5002   
* Restructured parameters settings to simplify options   
### Release notes:
* Re-pairing (removal and inclusion) based on new app strongly recommended for ZHC5010 (scene flowcards will not work)
* It is advised to remove devices before updating the v 2.0.0 as this will reset the device and erase inclusion.
* Not removing a device prior to installation of v 2.0.0 will result in five orphaned devices that has to be deleted individually afterwards.
