import { getDevice } from 'framework7';

/**
 * Device utility class to handle device-specific functionalities.
 * 
 * @class Device
 * @description This class provides methods to detect device type, check for webcam availability, and retrieve device information.
 * 
 * @constructor - Initializes the Device instance and retrieves device information using Framework7's getDevice utility.
 * 
 * @function getDeviceInfo - Returns information about the device.
 *      @returns {Object|null} - Device information object or null if not available.
 * @function isMobile - Checks if the device is a mobile device.
 *      @returns {boolean} - True if the device is mobile, false otherwise.
 * @function isTablet - Checks if the device is a tablet.
 *      @returns {boolean} - True if the device is a tablet, false otherwise.
 * @function isDesktop - Checks if the device is a desktop.
 *      @returns {boolean} - True if the device is desktop, false otherwise.
 * @function detectWebcam - Detects if a webcam is available on the device.
 *      @returns {Promise<boolean>} - A promise that resolves to true if a webcam is detected, false otherwise.
 * 
 * @example
 * const device = new Device();
 * const deviceInfo = device.getDeviceInfo();
 */
class Device {
    constructor() {
        this.device = getDevice();
        if (this.device == null) {
            this.device = window.app.device;
        }
        console.table(this.device);
    }

    getDeviceInfo() {
        return this.device.getInfo ? this.device.getInfo() : null;
    }

    isMobile() {
        return this.device.isMobile ? this.device.isMobile() : false;
    }

    isTablet() {
        return this.device.isTablet ? this.device.isTablet() : false;
    }

    isDesktop() {
        return !this.isMobile() && !this.isTablet();
    }

    detectWebcam() {
        // Check if the browser supports media devices and enumerateDevices
        return new Promise((resolve) => {
            let md = navigator.mediaDevices;

            // If mediaDevices is not available, resolve with false
            if (!md || !md.enumerateDevices) return resolve(false);
            md.enumerateDevices().then(devices => {
                resolve(devices.some(device => 'videoinput' === device.kind));
            }).catch(() => resolve(false));
        });
    }
}

export default Device;