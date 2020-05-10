# Google IOT Smart Device
* Platform: Mongoose OS firmware
* Language: JS-enabled
# How to build?
1. Goto code source folder `Example: cd /Users/lalrohit/WorkDocs/Google-IOT-SmartDevices/Google-IOT-Smart-Switch`
2. Execute `mos build`
# How to flash to device?
1. Open mos UI by executing `mos`
2. Execute `mos flash`
# How to initialtize the device after flash?
* Execute `mos gcp-iot-setup --gcp-project smartdevices-272506 --gcp-region us-central1 --gcp-registry iotcore-registry`

*[smartdevices-272506](https://console.cloud.google.com/iot/locations/us-central1/registries/iotcore-registry/overview?project=smartdevices-272506) - Google Cloud project name*

*us-central1 - Google Cloud project region*

*iotcore-registry - Google Cloud project IOT RegistryId*
# JS-enabled demo Mongoose OS firmware

This is the JS demo Mongoose OS app. It gets installed by default at
[Mongoose OS installation step](https://mongoose-os.com/docs/). It has
a lot of functionality enabled - cloud integrations, JavaScript engine, etc.
Its main purpose is to demonstrate the capabilities of Mongoose OS.
