load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_sys.js');
load('api_timer.js');
load('api_events.js');
load('api_shadow.js');
load('api_string.js');

let KEYWORD_PIN = '.pin';
let KEYWORD_RELAY = '.relay';
let KEYWORD_PULL_UP = '.pull_up';
let KEYWORD_CONFIG_VERSION = 'config_version';

let shadowState = { btnCount: 0, uptime: 0 };
let btn = Cfg.get('board.btn1.pin');  // Built-in board button
let led = Cfg.get('board.led1.pin');  // Built-in board led
let configTopic = '/devices/' + Cfg.get('device.id') + '/config';
let stateTopic = '/devices/' + Cfg.get('device.id') + '/state';
let commandsTopic = '/devices/' + Cfg.get('device.id') + '/commands/#';
let online = false; // Connected to the cloud?
let plug1 = 'board.plug1';
let plug1Pin = Cfg.get(plug1 + KEYWORD_PIN);
let plug1Relay = Cfg.get(plug1 + KEYWORD_RELAY);
let plug2 = 'board.plug2';
let plug2Pin = Cfg.get(plug2 + KEYWORD_PIN);
let plug2Relay = Cfg.get(plug2 + KEYWORD_RELAY);
let plug3 = 'board.plug3';
let plug3Pin = Cfg.get(plug3 + KEYWORD_PIN);
let plug3Relay = Cfg.get(plug3 + KEYWORD_RELAY);
let plug4 = 'board.plug4';
let plug4Pin = Cfg.get(plug4 + KEYWORD_PIN);
let plug4Relay = Cfg.get(plug4 + KEYWORD_RELAY);

/* Setting board led mode to OUTPUT */
GPIO.set_mode(led, GPIO.MODE_OUTPUT);

/* Setting plug mode to OUTPUT */
GPIO.set_mode(plug1Pin, GPIO.MODE_OUTPUT);
GPIO.set_mode(plug2Pin, GPIO.MODE_OUTPUT);
GPIO.set_mode(plug3Pin, GPIO.MODE_OUTPUT);
GPIO.set_mode(plug4Pin, GPIO.MODE_OUTPUT);

/* Restoring plug pull-up state from saved states */
function restorePlugStateUsingConfig() {
  print("Restoring plugs to saved states...")
  GPIO.write(plug1Pin, Cfg.get(plug1 + KEYWORD_PULL_UP));
  GPIO.write(plug2Pin, Cfg.get(plug2 + KEYWORD_PULL_UP));
  GPIO.write(plug3Pin, Cfg.get(plug3 + KEYWORD_PULL_UP));
  GPIO.write(plug4Pin, Cfg.get(plug4 + KEYWORD_PULL_UP));

  print("--------------------");
  print("Current Plug Status");
  print("--------------------");
  print(plug1Relay, "->", Cfg.get(plug1 + KEYWORD_PULL_UP));
  print(plug2Relay, "->", Cfg.get(plug2 + KEYWORD_PULL_UP));
  print(plug3Relay, "->", Cfg.get(plug3 + KEYWORD_PULL_UP));
  print(plug4Relay, "->", Cfg.get(plug4 + KEYWORD_PULL_UP));
  print("--------------------");
}
restorePlugStateUsingConfig();

/**
 * Update device configuration using "UPDATE CONFIG".
 * PIN configuration, state and name can be updated using this. 
 * IMPORTANT - It should only be used ONCE per config change for the device.
 * Sample: {"config_version":1,"config":{"board":{"plug4":{"relay":"S5","pull_up":true,"pin":13},"plug3":{"relay":"S4","pull_up":true,"pin":12},"plug2":{"relay":"S3","pull_up":true,"pin":14},"plug1":{"relay":"S2","pull_up":true,"pin":16}}}}
 * pull_up = true mean switch is OFF
 */
MQTT.sub(configTopic, function(conn, configTopic, msg) {
  print('Topic:', configTopic, 'Message:', msg);

  if('' !== StringUtils.trim(msg)) {
    // Save new requested plug new state in CONFIG
    let configObj = JSON.parse(StringUtils.trim(msg));
    print(JSON.stringify(configObj));
    if (configObj[KEYWORD_CONFIG_VERSION] > Cfg.get(KEYWORD_CONFIG_VERSION)) {
      Cfg.set(configObj.config);
      Cfg.set({config_version: configObj[KEYWORD_CONFIG_VERSION]});
      print("Config version saved on Device")
      restorePlugStateUsingConfig();
    } else {
      print("Config version already on Device")
    }

    // Updating Shadow with board plugs states from request
    shadowState.config_version = configObj[KEYWORD_CONFIG_VERSION]
    shadowState.board = configObj.config.board;
  }
}, null);

/**
 * This is used to control status of plugs represented by pull_up property
 * Turn ON/OFF board plugs using "SEND COMMAND"
 * Sample: {"plugId":"board.plug1", "plugState": false}
 * plugState = true mean switch is OFF
 */
MQTT.sub(commandsTopic, function(conn, commandsTopic, msg) {
    print('Topic:', commandsTopic, 'Message:', msg);

    // Update requested plug state as per command
    let msgObj = JSON.parse(msg);
    GPIO.write(Cfg.get(msgObj.plugId + KEYWORD_PIN), msgObj.plugState);

    // Save new requested plug new state in CONFIG
    let newState = {};
    newState[msgObj.plugId + KEYWORD_PULL_UP] = msgObj.plugState;
    Cfg.set(newState);

    // Update IOT State using msg from Command topic
    print("Sending MQTT message");
    print("--------------------");
    print(stateTopic, '->', msg);
    print("--------------------");
    MQTT.pub(stateTopic, msg, 1);
    print('Acknowledgement send to IOT device State');

    // Updating Shadow with plug state from request
    let result = StringUtils.split(msgObj.plugId, '.', true);
    shadowState[result[0]][result[1]]['pull_up'] = msgObj.plugState; 
  },
  null
);

/** 
 * Updating Device Shadow State on mdash.net
 * Updating Device online status to True when connected to Cloud
 */
Event.on(Event.CLOUD_CONNECTED, function() {
  shadowState.online = true;
  Shadow.update(0, shadowState);
  print("Event Cloud Connected")
}, null);

/** 
 * Updating Device Shadow State on mdash.net
 * Updating Device online status to False when disconnected from Cloud
 */
Event.on(Event.CLOUD_DISCONNECTED, function() {
  shadowState.online = false;
  Shadow.update(0, shadowState);
  print("Event Cloud Disconnected")
}, null);

/**
 * Bind action to physical button present on ESP8266 module, if exist
 */
if (btn >= 0) {
  let btnPull, btnEdge;
  if (Cfg.get('board.btn1.pull_up') ? GPIO.PULL_UP : GPIO.PULL_DOWN) {
    btnPull = GPIO.PULL_UP;
    btnEdge = GPIO.INT_EDGE_NEG;
  } else {
    btnPull = GPIO.PULL_DOWN;
    btnEdge = GPIO.INT_EDGE_POS;
  }
  GPIO.set_button_handler(btn, btnPull, btnEdge, 20, function() {
    shadowState.btnCount += 1;
    print("Button pressed!!!")
    restorePlugStateUsingConfig();

    // Rebuilding Config Object
    let boardConfig = {config_version : shadowState.config_version, config : {board : shadowState.board}};
    boardConfig.config.board.plug1.pin = Cfg.get(plug1 + KEYWORD_PIN);
    boardConfig.config.board.plug1.pull_up = Cfg.get(plug1 + KEYWORD_PULL_UP);
    boardConfig.config.board.plug1.relay = Cfg.get(plug1 + KEYWORD_RELAY);
    boardConfig.config.board.plug2.pin = Cfg.get(plug2 + KEYWORD_PIN);
    boardConfig.config.board.plug2.pull_up = Cfg.get(plug2 + KEYWORD_PULL_UP);
    boardConfig.config.board.plug2.relay = Cfg.get(plug2 + KEYWORD_RELAY);
    boardConfig.config.board.plug3.pin = Cfg.get(plug3 + KEYWORD_PIN);
    boardConfig.config.board.plug3.pull_up = Cfg.get(plug3 + KEYWORD_PULL_UP);
    boardConfig.config.board.plug3.relay = Cfg.get(plug3 + KEYWORD_RELAY);
    boardConfig.config.board.plug4.pin = Cfg.get(plug4 + KEYWORD_PIN);
    boardConfig.config.board.plug4.pull_up = Cfg.get(plug4 + KEYWORD_PULL_UP);
    boardConfig.config.board.plug4.relay = Cfg.get(plug4 + KEYWORD_RELAY);
    boardConfig.config_version = Cfg.get(KEYWORD_CONFIG_VERSION)

    // Update IOT State using msg from Command topic
    let msg = JSON.stringify(boardConfig);
    print("Sending MQTT message");
    print("--------------------");
    print(stateTopic, '->', msg);
    print("--------------------");
    MQTT.pub(stateTopic, msg, 1);
    print('Acknowledgement send to IOT device State');
  }, null);
}

/**
 * Updating Device Shadow State on mdash.net
 * Updating uptime attribute periodically
 */
Timer.set(5000, Timer.REPEAT, function() {
  shadowState.ram_free = Sys.free_ram();
  shadowState.ram_total = Sys.total_ram();
  shadowState.uptime = Sys.uptime();
  shadowState.updated_on = Timer.fmt("%F %X %Z.", Timer.now());
  Shadow.update(0, shadowState);
}, null);
