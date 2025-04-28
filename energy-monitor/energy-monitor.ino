#define BLYNK_TEMPLATE_ID ""
#define BLYNK_TEMPLATE_NAME ""
#define BLYNK_AUTH_TOKEN ""
#define BLYNK_PRINT Serial

#include <WiFi.h>
#include <EmonLib.h>
#include <EEPROM.h>
#include <BlynkSimpleEsp32.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <HTTPClient.h>

const char blynkToken[] = BLYNK_AUTH_TOKEN;
const char wifiSsid[]  = "";
const char wifiPass[]  = "";
const char* endpointUrl = "";

LiquidCrystal_I2C display(0x27,16,2);

EnergyMonitor sensor;
BlynkTimer blynkTimer;

const float voltageCal = 122.7143776824034;
const float currentCal = 2.57914104793757;

float energyAccum = 0.0;
float totalCost   = 0.0;

const float pricePerKwh = 6.5;
unsigned long prevTime    = 0;

float voltageRms, currentRms, powerCalc;

const int eepromAddrEnergy = 12;
const int eepromAddrCost   = 16;

int screenIndex = 0;
const int btnPin   = 26;

void postMetrics();
void measureAndReport();
void loadSavedData();
void clearSavedData();
void switchScreen();

void setup(){
  Serial.begin(115200);

  WiFi.begin(wifiSsid,wifiPass);
  while(WiFi.status()!=WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Blynk.begin(blynkToken,wifiSsid,wifiPass);

  Wire.begin(25,33);

  display.init();
  display.backlight();

  pinMode(btnPin,INPUT_PULLUP);
  EEPROM.begin(32);

  loadSavedData();

  sensor.voltage(35,voltageCal,1.7);
  sensor.current(32,currentCal);

  prevTime=millis();

  blynkTimer.setInterval(2000L,measureAndReport);
  blynkTimer.setInterval(2000L,switchScreen);
}

void loop(){
  Blynk.run();
  blynkTimer.run();
  if(digitalRead(btnPin)==LOW){
    delay(200);clearSavedData();
  }
}

void loadSavedData(){
  EEPROM.get(eepromAddrEnergy,energyAccum);
  EEPROM.get(eepromAddrCost,totalCost);

  if(isnan(energyAccum))energyAccum=0;
  if(isnan(totalCost))totalCost=0;
}

void clearSavedData(){
  energyAccum=0;
  totalCost=0;
  EEPROM.put(eepromAddrEnergy,energyAccum);
  EEPROM.put(eepromAddrCost,totalCost);
  EEPROM.commit();
}

void switchScreen(){
  screenIndex=(screenIndex+1)%2;
}

void measureAndReport(){
  sensor.calcVI(20,2000);
  voltageRms=sensor.Vrms;
  currentRms=sensor.Irms;
  if(voltageRms<100||voltageRms>300)voltageRms=0;
  if(currentRms<0.15||currentRms>17||voltageRms<1)currentRms=0;

  powerCalc=voltageRms*currentRms;

  unsigned long now=millis();

  energyAccum+=powerCalc*(now-prevTime)/3600000000.0;
  prevTime=now;

  totalCost=energyAccum*pricePerKwh;

  EEPROM.put(eepromAddrEnergy,energyAccum);
  EEPROM.put(eepromAddrCost,totalCost);
  EEPROM.commit();

  Blynk.virtualWrite(V0,voltageRms);
  Blynk.virtualWrite(V1,currentRms);
  Blynk.virtualWrite(V2,powerCalc);
  Blynk.virtualWrite(V3,energyAccum);
  Blynk.virtualWrite(V4,totalCost);

  Serial.printf("V:%.1f V, I:%.4f A, P:%.0f W, E:%.4f kWh, C:%.3f\n",voltageRms,currentRms,powerCalc,energyAccum,totalCost);
  display.clear();
  display.setCursor(0,0);

  if(screenIndex==0){
    display.printf("V:%.1f I:%.4f",voltageRms,currentRms);
    display.setCursor(0,1);
    display.printf("P:%.0fW",powerCalc);
  }else{
    display.printf("E:%.4f kWh",energyAccum);
    display.setCursor(0,1);
    display.printf("Cost:%.3f",totalCost);
  }
  postMetrics();
}

void postMetrics(){
  if(WiFi.status()!=WL_CONNECTED)return;
  HTTPClient http;

  http.begin(endpointUrl);
  http.addHeader("Content-Type","application/json");

  String j="{"
    "\"voltage\":"+String(voltageRms,1)+",""
    "\"current\":"+String(currentRms,4)+",""
    "\"power\":"+String(powerCalc,0)+",""
    "\"energy\":"+String(energyAccum,4)+",""
    "\"cost\":"+String(totalCost,3)+"}";
  int r=http.POST(j);

  if(r>0)Serial.printf("OK:%d\n",r);
  else Serial.printf("ERR:%d\n",r);
  
  http.end();
}
