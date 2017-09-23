# Logic Home Control

This app adds support for Logic Home Control devices in Homey.

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
### v 1.0.2
Fix issue preventing driver to crash when using the "Set LED level" and "Set LED flash" flow cards    
### v 1.0.1
Filter out Central Scene messages with duplicate sequence numbers
### v 1.0.0
Added support for ZHC5010 Wall switch module
