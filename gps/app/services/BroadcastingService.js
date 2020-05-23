import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Alert } from 'react-native';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import AndroidBLEAdvertiserModule from 'react-native-ble-advertiser';
import PushNotification from 'react-native-push-notification';
import UUIDGenerator from 'react-native-uuid-generator';

import { BLE_TRACKING, CONTACT_DATA, MY_UUIDs } from '../constants/storage';
import { GetStoreData, SetStoreData } from '../helpers/General';
import languages from '../locales/languages';
import { isPlatformAndroid, nowStr } from '../Util';

let currentUUID = null;
let onDeviceFound = null;
let onBTStatusChange = null;
let lastSeen = {};

const c5_MINS = 1000 * 60 * 5;
const c28_DAYS = 1000 * 60 * 60 * 24 * 28;
const c1_HOUR = 1000 * 60 * 60;

const MANUFACTURER_ID = 0xff;
const MANUFACTURER_DATA = [12, 23, 56];

/*
 * Check if the contact is new in the last 5 mins.
 */
function isNewContact(contact) {
  let nowLocal = new Date().getTime();
  if (
    lastSeen[contact['uuid']] &&
    lastSeen[contact['uuid']] > nowLocal - c5_MINS
  ) {
    //console.log('[Bluetooth]', nowStr(), currentUUID, 'Ignoring UUID for 5 mins:', contact['uuid']);
    return false; // needs a space of 5 mins to log again.
  }

  lastSeen[contact['uuid']] = nowLocal;
  return true;
}

/*
 * Select only the last 28 days of data.
 */
function filterAfter(arrayIncludingTime, time) {
  let curated = [];
  for (let i = 0; i < arrayIncludingTime.length; i++) {
    if (arrayIncludingTime[i]['time'] > time) {
      curated.push(arrayIncludingTime[i]);
    }
  }
  return curated;
}

function saveContact(contact) {
  // Persist this contact data in our local storage of time/uuid values
  //console.log('[Bluetooth]', nowStr(), currentUUID, 'New Device Found', contact['uuid']);
  if (isNewContact(contact)) {
    GetStoreData(CONTACT_DATA, false).then(contactArray => {
      if (!contactArray) {
        contactArray = [];
      }

      // Always work in UTC, not the local time in the contactData
      let nowUTC = new Date().toISOString();
      let unixtimeUTC = Date.parse(nowUTC);

      // Curate the list of contacts, only keep the last 28 days
      let curated = filterAfter(contactArray, unixtimeUTC - c28_DAYS);

      let uuid_time = {
        uuid: contact['uuid'],
        time: unixtimeUTC,
      };
      curated.push(uuid_time);
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Saving contact:',
        contact['uuid'],
        curated.length,
      );

      SetStoreData(CONTACT_DATA, curated);
    });
  }
}

function saveMyUUID(me) {
  // Persist this contact data in our local storage of time/lat/lon values

  GetStoreData(MY_UUIDs, false).then(myUUIDArray => {
    if (!myUUIDArray) {
      myUUIDArray = [];
    }

    // Always work in UTC, not the local time in the contactData
    let nowUTC = new Date().toISOString();
    let unixtimeUTC = Date.parse(nowUTC);

    // Curate the list of points, only keep the last 28 days
    let curated = filterAfter(myUUIDArray, unixtimeUTC - c28_DAYS);

    let uuid_time = {
      uuid: me['uuid'],
      time: unixtimeUTC,
    };

    console.log(
      '[Bluetooth]',
      nowStr(),
      me['uuid'],
      'Saving myUUID:',
      me['uuid'],
      curated.length,
    );
    curated.push(uuid_time);

    SetStoreData(MY_UUIDs, curated);
  });
}

function loadLastUUIDAndBroadcast() {
  GetStoreData(MY_UUIDs, false).then(myUUIDArray => {
    if (!myUUIDArray) {
      console.log(
        '[Bluetooth]',
        nowStr(),
        myUUIDArray[myUUIDArray.length - 1].uuid,
        'Loading last uuid',
      );
      let lastUUID = myUUIDArray[myUUIDArray.length - 1].uuid;
      broadcast(lastUUID);
    } else {
      generateNewUUIDAndBroadcast();
    }
  });
}

function broadcast(currentUUID) {
  if (!currentUUID) return; // does not allow to start without UUID

  //console.log('[Bluetooth]', nowStr(), currentUUID, 'Broadcasting');
  AndroidBLEAdvertiserModule.setCompanyId(MANUFACTURER_ID);
  AndroidBLEAdvertiserModule.broadcast(currentUUID, MANUFACTURER_DATA)
    .then(success =>
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Broadcasting Sucessful',
        success,
      ),
    )
    .catch(error =>
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Broadcasting Error',
        error,
      ),
    );

  //console.log('[Bluetooth]', nowStr(), currentUUID, "Starting Scanner");
  AndroidBLEAdvertiserModule.scan(MANUFACTURER_DATA, {})
    .then(success =>
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Scan Successful',
        success,
      ),
    )
    .catch(error =>
      console.log('[Bluetooth]', nowStr(), currentUUID, 'Scan Error', error),
    );
}

function stopBroadcast(currentUUID) {
  if (!currentUUID) return; // does not allow to start without UUID

  //console.log('[Bluetooth]', nowStr(), currentUUID, 'Stopping Broadcast');
  AndroidBLEAdvertiserModule.stopBroadcast()
    .then(success =>
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Stop Broadcast Successful',
        success,
      ),
    )
    .catch(error =>
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Stop Broadcast Error',
        error,
      ),
    );

  //console.log('[Bluetooth]', nowStr(), currentUUID, "Stopping Scanning");
  AndroidBLEAdvertiserModule.stopScan()
    .then(success =>
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Stop Scan Successful',
        success,
      ),
    )
    .catch(error =>
      console.log(
        '[Bluetooth]',
        nowStr(),
        currentUUID,
        'Stop Scan Error',
        error,
      ),
    );
}

function generateNewUUIDAndBroadcast() {
  UUIDGenerator.getRandomUUID(uuid => {
    console.log('[Bluetooth]', nowStr(), currentUUID, 'Renewing this UUID');
    stopBroadcast(currentUUID);

    currentUUID = uuid;
    saveMyUUID({ uuid: uuid });

    broadcast(currentUUID);
  });
}

export default class BroadcastingServices {
  static askBTActive() {
    setTimeout(
      () =>
        Alert.alert(
          'COVID Safe Paths requires Bluetooth to be enabled',
          'Would you like to enable Bluetooth?',
          [
            {
              text: 'Yes',
              onPress: () => AndroidBLEAdvertiserModule.enableAdapter(),
            },
            {
              text: 'No',
              onPress: () =>
                console.log('User does not want to activate Bluetooth'),
              style: 'cancel',
            },
          ],
        ),
      1000,
    );
  }

  static async getBleTracking() {
    return await GetStoreData(BLE_TRACKING, false);
  }

  static start() {
    PushNotification.configure({
      // (required) Called when a remote or local notification is opened or received
      onNotification(notification) {
        console.log('NOTIFICATION:', notification);
        // required on iOS only (see fetchCompletionHandler docs: https://github.com/react-native-community/react-native-push-notification-ios)
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      // Setting the permissions to true causes a crash on Android, because that configuration requires Firebase
      // https://github.com/zo0r/react-native-push-notification#usage
      requestPermissions: Platform.OS === 'ios',
    });

    // console.log('starting Ble service');

    // Do not run on iOS for now.
    if (isPlatformAndroid()) {
      const eventEmitter = new NativeEventEmitter(
        NativeModules.AndroidBLEAdvertiserModule,
      );
      onBTStatusChange = eventEmitter.addListener(
        'onBTStatusChange',
        status => {
          console.log(
            '[Bluetooth]',
            nowStr(),
            currentUUID,
            'Bluetooth Status Change',
            status,
          );
          if (status.enabled) BroadcastingServices.startAndSetCallbacks();
          else BroadcastingServices.stopAndClearCallbacks();
        },
      );

      AndroidBLEAdvertiserModule.getAdapterState()
        .then(result => {
          console.log(
            '[Bluetooth]',
            nowStr(),
            currentUUID,
            'isBTActive',
            result,
          );
          if (result === 'STATE_ON') {
            BroadcastingServices.startAndSetCallbacks();
          } else {
            BroadcastingServices.askBTActive();
          }
        })
        .catch(() => {
          console.log('[Bluetooth]', nowStr(), currentUUID, 'BT Not Enabled');
        });
    }
  }

  static stop() {
    PushNotification.localNotification({
      title: languages.t('label.bluetooth_disabled_title'),
      message: languages.t('label.bluetooth_disabled_message'),
    });

    if (isPlatformAndroid()) {
      if (onBTStatusChange) {
        onBTStatusChange.remove();
        onBTStatusChange = null;
      }

      AndroidBLEAdvertiserModule.getAdapterState()
        .then(result => {
          console.log(
            '[Bluetooth]',
            nowStr(),
            currentUUID,
            'isBTActive',
            result,
          );
          if (result === 'STATE_ON') {
            BroadcastingServices.stopAndClearCallbacks();
          }
        })
        .catch(() => {
          console.log('[Bluetooth]', nowStr(), currentUUID, 'BT Not Enabled');
        });
    }
  }

  static async startAndSetCallbacks() {
    // if it was already active
    PushNotification.localNotification({
      title: languages.t('label.bluetooth_enabled_title'),
      message: languages.t('label.bluetooth_enabled_message'),
    });

    await SetStoreData(BLE_TRACKING, 'true');

    if (onDeviceFound) {
      BroadcastingServices.stopAndClearCallbacks();
    }

    // listening event.
    const eventEmitter = new NativeEventEmitter(
      NativeModules.AndroidBLEAdvertiserModule,
    );
    onDeviceFound = eventEmitter.addListener('onDeviceFound', event => {
      console.log('[Bluetooth]', nowStr(), currentUUID, 'New Device', event);
      if (event.serviceUuids && event.serviceUuids.length > 0)
        saveContact({ uuid: event.serviceUuids[0] });
    });

    // Get a Valid UUID and start broadcasting and scanning.
    loadLastUUIDAndBroadcast();

    BackgroundTimer.runBackgroundTimer(() => {
      generateNewUUIDAndBroadcast();
    }, c1_HOUR); // Every hour, change UUID
  }

  static async stopAndClearCallbacks() {
    await SetStoreData(BLE_TRACKING, 'false');

    //console.log('[Bluetooth]', nowStr(), currentUUID, 'Stopping Bluetooth');
    stopBroadcast(currentUUID);

    if (onDeviceFound) {
      onDeviceFound.remove();
      onDeviceFound = null;
    }

    BackgroundTimer.stopBackgroundTimer();
  }
}