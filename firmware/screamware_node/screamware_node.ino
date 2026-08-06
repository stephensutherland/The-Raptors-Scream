#include <RadioLib.h>

// Pin Configuration mapping for Seeed Studio XIAO ESP32S3 LoRa
const int REED_SWITCH_PIN = D1;  // Pull-pin switch input
const int SIREN_PIN = D2;        // Siren output relay
const String NODE_ID = "MS_NODE_049A"; // Hardcoded unique identifier

// Configure the SX1262 LoRa radio module chip settings
SX1262 radio = new Module(D3, D4, D5, D6); 

void setup() {
  pinMode(REED_SWITCH_PIN, INPUT_PULLUP);
  pinMode(SIREN_PIN, OUTPUT);
  digitalWrite(SIREN_PIN, LOW);

  // If the pin is securely in place, drop immediately into low-power Deep Sleep
  if (digitalRead(REED_SWITCH_PIN) == HIGH) {
    // Configure hardware interrupt: wake up immediately when pin is pulled low
    esp_sleep_enable_ext0_wakeup((gpio_num_t)REED_SWITCH_PIN, 0); 
    esp_deep_sleep_start();
  }

  // SYSTEM WAKES UP HERE INSTANTLY IF THE PIN IS PULLED
  digitalWrite(SIREN_PIN, HIGH); // Fire the acoustic alarm immediately
  
  // Initialize the LoRa radio frequency layer (Using standard US 915MHz band)
  int state = radio.begin(915.0, 125.0, 9, 7);
  if (state == RADIOLIB_ERR_NONE) {
    executeEmergencyBroadcastLoop();
  }
}

void executeEmergencyBroadcastLoop() {
  int sequenceCount = 0;
  while(true) {
    // Build packet payload containing the initial telemetry signature data
    String payload = "ALERT:" + NODE_ID + ":SEQ:" + String(sequenceCount);
    
    // Transmit raw packet data over the community mesh airwaves
    radio.transmit(payload);
    
    sequenceCount++;
    delay(3000); // Re-broadcast every 3 seconds to ensure triangulation catch
  }
}

void loop() {
  // Unused; logic is entirely handled in execution loops inside setup on wake
}
