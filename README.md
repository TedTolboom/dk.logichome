# Logic Home Control - DEVELOPMENT VERSION

This app adds support for Logic Home Control Z-wave devices made by [Logic Home Control ApS](http://logichome.dk/).

## Links:
[Logic Home Control app Athom apps](https://apps.athom.com/app/dk.logichome)                    
[Logic Home Control Github repository](https://github.com/TedTolboom/dk.logichome)   

**Note:** This app is using [HomeyConfig composer](https://www.npmjs.com/package/node-homey-config-composer).   
Please file Pull Requests on the *development* branch of this repository and with respect to the refactored files in _/drivers_ and _/config_ folders.   

## Supported devices
* ZHC5010, Wall switch module for FUGA® installations (http://logichome.dk/index.php/products/3-zhc5010-z-wave-switch-module-for-fuga-installations)

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
 * It is possible to control the 4 LED's, by means of action cards.

## Change Log:
### v 2.0.0
* Major app update to SDK2   
* Added all options to support FW 2.x (secure includion) of ZHC5010   
* Restructured parameters settings to simplify options   
###Release notes:
* Re-pairing (removal and inclusion) based on new app strongly recommended for ZHC5010 (scene flowcards will not work)
* It is advised to remove devices before updating the v 2.0.0 as this will reset the device and erase inclusion.
* Not removing a device prior to installation of v 2.0.0 will result in five orphaned devices that has to be deleted individually afterwards.

### v 1.0.4
* Fixed minor error in switch Binary report parser in case a number is reported as Switch value   
### v 1.0.3
* Fixed issue preventing status from being updated (manual action required! see note above)    
* Fixed issue with indicator flow card not able to turn of indicator LED   
### v 1.0.2
* Fix issue preventing driver to crash when using the "Set LED level" and "Set LED flash" flow cards    
### v 1.0.1
* Filter out Central Scene messages with duplicate sequence numbers
### v 1.0.0
* Added support for ZHC5010 Wall switch module
