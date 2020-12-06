# IOT Smart Device
* Platform: Mongoose OS firmware
* Language: JS-enabled
* Developer: Rohit Lal Chandani
* Compatible: AWS and GCP

# How to build?
1. Goto code source folder `Example: cd /Users/rohit/Projects/IOT-MOS-ESP8266`
2. Execute `mos build`

# How to flash to device?
1. Open mos UI by executing `mos`
2. Connect ESP8266 using UART cable
3. Select the UART Port
4. Execute `mos flash`

# How to initialtize the device after flash for Google Cloud IOT?
* Login to Google Cloud Console
* Select the project
* Goto `API & Services` and click on `Credentials` and create/use Service account and download the credential JSON file
* In terminal export `GOOGLE_APPLICATION_CREDENTIALS` variable with location of this service account credential file 
  ```
  export GOOGLE_APPLICATION_CREDENTIALS="/Users/rohit/Projects/GoogleCloud/Google Cloud Local Development Key/serviceAccountKey_for_local_development_only.json"
  ```
* Open mos UI by executing `mos`
* Connect ESP8266 using UART cable
* Select the UART Port
* Execute below command to register with GCP
  ```
  mos gcp-iot-setup --gcp-project smartdevices-272506 --gcp-region us-central1 --gcp-registry iotcore-registry
  ```
  This will create a new device in [GCP IOT Core console](https://console.cloud.google.com/iot/locations/us-central1/registries/iotcore-registry/devices?project=smartdevices-272506)

# Or, How to initialtize the device after flash for AWS IOT? (Recommended)
* Install AWS CLI `brew install awscli`
* Configure AWS account using IAM Role (sam-cli-user) `aws configure`
* Open mos UI by executing `mos`
* Connect ESP8266 using UART cable
* Select the UART Port
* Execute below command to register with AWS IoT
  ```
  mos aws-iot-setup --aws-region us-east-1
  ```
  * This will create a new Thing in your [AWS IoT console](https://console.aws.amazon.com/iot/home?region=us-east-1#/thinghub)
  * *(Optional)* You can manually assign it `Type` and `Thing groups` to it
