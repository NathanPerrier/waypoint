class Device {
    constructor() {
        if (!window.app || !window.app.device) {
            throw new Error("window.app.device is not available");
        }
        this.device = window.app.device;
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
        return new Promise((resolve) => {
            let md = navigator.mediaDevices;
            if (!md || !md.enumerateDevices) return resolve(false);
            md.enumerateDevices().then(devices => {
                resolve(devices.some(device => 'videoinput' === device.kind));
            }).catch(() => resolve(false));
        });
    }
}

export default Device;

