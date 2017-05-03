class DeviceData {
  constructor(deviceId, data) {
    this.deviceId = deviceId;
    this.data = data;    
  }

  toString() {
    return JSON.stringify({
      deviceId: this.deviceId,
      data: this.data      
    });
  }

  equal(deviceData) {
    return this.toString() === deviceData.toString();
  }
}

module.exports = DeviceData;