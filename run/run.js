/**
 * Created by ricardomendes on 28/04/17.
 */
var merge = require('merge');

var mqtt = require("mqtt");

var client = mqtt.connect("mqtt://127.0.0.1");

var topic = "kyto";
var message, sensorFirmware;

var args = {
	qos: 0,
	retain: true
};

const Kyto = require('../index');

let heartRate = new Kyto("f8:a7:dc:5c:00:81");

heartRate.startScanning();

/*
heartRate.on('data', function (data) {
  console.log('data: '+ data);
});

heartRate.on('location', function (data) {
  console.log('location: '+ data);
});

heartRate.on('firmware', function (data) {
  console.log('firmware: '+ data);
});

heartRate.on('model', function (data) {
  console.log('model: '+ data);
});

heartRate.on('battery', function (data) {
  console.log('battery: '+ data);
});*/

client.on('connect', function () {
heartRate.on('firmware', function (dataFirmware) {
  heartRate.on('model', function (dataModel) {
    heartRate.on('location', function (dataLocation) {
      heartRate.on('battery', function (dataBattery) {        
        /*console.log('firmware: '+ dataFirmware);
        console.log('model: '+ dataModel);
        console.log('location: '+ dataLocation);
        console.log('battery: '+ dataBattery);*/

        sensorFirmware = merge({"firmware": dataFirmware}, merge({'model': dataModel},merge({'location': dataLocation},{'baterry': dataBattery})));
        heartRate.on('data', function (dataData) {
          message = JSON.stringify(merge(sensorFirmware,{data: dataData}));
          //console.log(message);              
          client.publish(topic, new Buffer(message), args, function() {
            console.log(message);  
          });
        });
      });
    });
  });
});
  })

setInterval(function () {
  console.log('every 30 seconds, rescan devices');
  heartRate.startScanning();
}, 30000);

//client.end();