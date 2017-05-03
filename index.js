/**
 * Created by ricardomendes on 28/04/17.
 */
const EventEmitter = require('events');
const noble = require('noble');
const debug = require('debug')('node-kyto_heartrate');
const DeviceData = require('./lib/device-data');

const DEFAULT_DEVICE_NAME = 'Heartrate Sensor';

const SERVICE_DEVICE_INFORMATION = "180a";
const SERVICE_HEART_RATE = "180d";
const SERVICE_BATTERY_SERVICE = "180f";
  
const CHARACTERISTIC_SERIAL_NUMBER_STRING= "2a25"; //Não Usado
const CHARACTERISTIC_MANUFACTURER_NAME_STRING= "2a29"; //Não Usado
const CHARACTERISTIC_SYSTEM_ID= "2a23"; //Não Usado
const CHARACTERISTIC_HEART_RATE_CONTROL_POINT= "2a39"; //Não Usado
const CHARACTERISTIC_FIRMWARE_REVISION_STRING= "2a26";
const CHARACTERISTIC_MODEL_NUMBER_STRING= "2a24";
const CHARACTERISTIC_HEART_RATE_MEASUREMENT= "2a37";
const CHARACTERISTIC_BODY_SENSOR_LOCATION= "2a38";
const CHARACTERISTIC_BATTERY_LEVEL= "2a19";

const SERVICE_UUIDS = [SERVICE_DEVICE_INFORMATION, SERVICE_HEART_RATE, SERVICE_BATTERY_SERVICE];
const CHARACTERISTIC_UUIDS = [CHARACTERISTIC_FIRMWARE_REVISION_STRING, CHARACTERISTIC_MODEL_NUMBER_STRING, CHARACTERISTIC_HEART_RATE_MEASUREMENT, CHARACTERISTIC_BODY_SENSOR_LOCATION, CHARACTERISTIC_BATTERY_LEVEL];
const BODY_LOCATION_STRINGS = [ 'Other', 'Chest', 'Wrist', 'Finger', 'Hand', 'Ear Lobe', 'Foot' ];

class Kyto extends EventEmitter {
  constructor(macAddress) {
    super();
    this.noble = noble;
    this._macAddress = macAddress;
    noble.on('discover', this.discover.bind(this));
  }

  discover(peripheral) {
    debug('device discovered: ', peripheral.advertisement.localName);
    if (this._macAddress !== undefined) {
      if (this._macAddress.toLowerCase() === peripheral.address.toLowerCase()) {
        debug('trying to connect kyto heartrate, living at %s', this._macAddress);
        // start listening the specific device
        this.connectDevice(peripheral);
      }
    } else if (peripheral.advertisement.localName === DEFAULT_DEVICE_NAME) {
      debug('no mac address specified, trying to connect available kyto heartrate...');
      // start listening found device
      this.connectDevice(peripheral);
    }
  }

  connectDevice(peripheral) {
    // prevent simultanious connection to the same device
    if (peripheral.state === 'disconnected') {
      peripheral.connect();
      peripheral.once('connect', function () {
        this.listenDevice(peripheral, this);
      }.bind(this));
    }
  }

  listenDevice(peripheral, context) {
    peripheral.discoverSomeServicesAndCharacteristics(SERVICE_UUIDS, CHARACTERISTIC_UUIDS, function (error, services, characteristics) {
      characteristics.forEach(function (characteristic) {  
        switch (characteristic.uuid) {
          case CHARACTERISTIC_HEART_RATE_MEASUREMENT:
            characteristic.on('data', function(data, isNotification) {
              context.parseCHARACTERISTIC_HEART_RATE_MEASUREMENT(peripheral, data);          
            });

            // to enable notify
            characteristic.subscribe(function(error) {
              console.log('heartrate on');
            });
            break;
          case CHARACTERISTIC_BODY_SENSOR_LOCATION:
            characteristic.read(function (error, data) {
              context.parseCHARACTERISTIC_BODY_SENSOR_LOCATION(peripheral, data);
            });
            break;
          case CHARACTERISTIC_FIRMWARE_REVISION_STRING:
            characteristic.read(function (error, data) {
              context.parseCHARACTERISTIC_FIRMWARE_REVISION_STRING(peripheral, data);
            });
            break;
          case CHARACTERISTIC_MODEL_NUMBER_STRING:
            characteristic.read(function (error, data) {
              context.parseCHARACTERISTIC_MODEL_NUMBER_STRING(peripheral, data);
            });
            break;
          case CHARACTERISTIC_BATTERY_LEVEL:
            characteristic.read(function (error, data) {              
              context.parseCHARACTERISTIC_BATTERY_LEVEL(peripheral, data);
            });
            break;
          default:
            characteristic.read(function (error, data) {              
              console.log(characteristic.uuid + ": " + data);
              if(data){
                if(data.hasOwnProperty("length")){
                  console.log(characteristic.uuid + ": " + data.length);
                }
                if(data.toString('hex', 0, data.length)){
                  console.log(characteristic.uuid + ": " + data.toString('hex', 0, data.length));      
                }
                if(data.toString('ascii', 0, data.length)){
                  console.log(characteristic.uuid + ": " + data.toString('ascii', 0, data.length));  
                }
              }
            });
        }
      });
    });
  }

  parseCHARACTERISTIC_HEART_RATE_MEASUREMENT(peripheral, data) {
    //console.log("DATA_CHARACTERISTIC_HEART_RATE_MEASUREMENT: " + data.readUInt8(1));
    var flag = data.readUInt8(0);
    //console.log("FLAG: " + flag);
    this.emit('data', data.readUInt8(1));
  }
  
  parseCHARACTERISTIC_BODY_SENSOR_LOCATION(peripheral, data) {  
    var flag = data.readUInt8(0);
    this.emit('location', BODY_LOCATION_STRINGS[flag]);
  }

  parseCHARACTERISTIC_FIRMWARE_REVISION_STRING(peripheral, data) {
    this.emit('firmware', data.toString('ascii', 0, data.length));
  }
  
  parseCHARACTERISTIC_MODEL_NUMBER_STRING(peripheral, data) {
    //this.emit('model', data.toString('ascii', 0, data.length));
    //this.emit('model', data.toString("utf8"));
    this.emit('model', data.toString('ascii', 0, data.length).replace(/[\u0000\uFFFF]/g, ''));
  }
  
  parseCHARACTERISTIC_BATTERY_LEVEL(peripheral, data) {
    this.emit('battery', data.readUInt8(0));
  }

  startScanning() {
    if (noble.state === 'poweredOn') {
      noble.startScanning([], true);
    } else {
      // bind event to start scanning
      noble.on('stateChange', function (state) {
        if (state === 'poweredOn') {
          noble.startScanning([], true);
        }
      });
    }
  }

  stopScanning() {
    noble.stopScanning();
  }
}

module.exports = Kyto;
