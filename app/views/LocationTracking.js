import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import React, { Component } from 'react';
import {
  AppState,
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
} from 'react-native-permissions';
import Pulse from 'react-native-pulse';
import { SvgXml } from 'react-native-svg';

import BackgroundImageAtRisk from './../assets/images/backgroundAtRisk.png';
import exportImage from './../assets/images/export.png';
import foreArrow from './../assets/images/foreArrow.png';
import BackgroundImage from './../assets/images/launchScreenBackground.png';
import SettingsGear from './../assets/svgs/settingsGear';
import StateAtRisk from './../assets/svgs/stateAtRisk';
import StateNoContact from './../assets/svgs/stateNoContact';
import StateUnknown from './../assets/svgs/stateUnknown';
import { isPlatformAndroid, isPlatformiOS } from './../Util';
import ButtonWrapper from '../components/ButtonWrapper';
import Colors from '../constants/colors';
import fontFamily from '../constants/fonts';
import { CROSSED_PATHS, DEBUG_MODE, PARTICIPATE } from '../constants/storage';
import { GetStoreData, SetStoreData } from '../helpers/General';
import { checkIntersect } from '../helpers/Intersect';
import languages from '../locales/languages';
import BackgroundTaskServices from '../services/BackgroundTaskService';
import LocationServices from '../services/LocationService';

let settingsImageData =
  'data:image/png;base64,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';
const MAYO_COVID_URL = 'https://www.mayoclinic.org/coronavirus-covid-19';

const StateEnum = {
  UNKNOWN: 0,
  AT_RISK: 1,
  NO_CONTACT: 2,
  SETTING_OFF: 3,
};

const StateIcon = ({ status, size }) => {
  let icon;
  switch (status) {
    case StateEnum.UNKNOWN:
      icon = StateUnknown;
      break;
    case StateEnum.AT_RISK:
      icon = StateAtRisk;
      break;
    case StateEnum.NO_CONTACT:
      icon = StateNoContact;
      break;
    case StateEnum.SETTING_OFF:
      icon = StateUnknown;
      break;
  }
  return (
    <SvgXml xml={icon} width={size ? size : 80} height={size ? size : 80} />
  );
};

const height = Dimensions.get('window').height;

class LocationTracking extends Component {
  constructor(props) {
    super(props);

    if (isPlatformAndroid()) {
      StatusBar.setBackgroundColor(Colors.TRANSPARENT);
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(true);
    }

    this.state = {
      appState: AppState.currentState,
      timer_intersect: null,
      isLogging: '',
      currentState: StateEnum.NO_CONTACT,
    };
    try {
      this.checkCurrentState();
    } catch (e) {
      // statements
      console.log(e);
    }
  }

  /*  Check current state
        1) determine if user has correct location permissions
        2) check if they are at risk -> checkIfUserAtRisk()
        3) set state accordingly */
  checkCurrentState() {
    // NEED TO TEST ON ANDROID
    let locationPermission;
    if (isPlatformiOS()) {
      locationPermission = PERMISSIONS.IOS.LOCATION_ALWAYS;
    } else {
      locationPermission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    }

    // If user has location enabled & permissions, start logging
    GetStoreData(PARTICIPATE, false).then(isParticipating => {
      if (isParticipating) {
        check(locationPermission)
          .then(result => {
            switch (result) {
              case RESULTS.GRANTED:
                LocationServices.start();
                this.checkIfUserAtRisk();
                return;
              case RESULTS.UNAVAILABLE:
              case RESULTS.BLOCKED:
                console.log('NO LOCATION');
                LocationServices.stop();
                this.setState({ currentState: StateEnum.UNKNOWN });
            }
          })
          .catch(error => {
            console.log('error checking location: ' + error);
          });
      } else {
        this.setState({ currentState: StateEnum.SETTING_OFF });
        LocationServices.stop();
      }
    });
  }

  checkIfUserAtRisk() {
    BackgroundTaskServices.start();

    GetStoreData(DEBUG_MODE).then(dbgMode => {
      if (dbgMode != 'true') {
        // already set on 12h timer, but run when this screen opens too
        checkIntersect();
      }

      GetStoreData(CROSSED_PATHS).then(dayBin => {
        dayBin = JSON.parse(dayBin);
        if (dayBin !== null && dayBin.reduce((a, b) => a + b, 0) > 0) {
          console.log('Found crossed paths');
          this.setState({ currentState: StateEnum.AT_RISK });
        } else {
          console.log("Can't find crossed paths");
          this.setState({ currentState: StateEnum.NO_CONTACT });
        }
      });
    });

    // If the user has location tracking disabled, set enum to match
    GetStoreData(PARTICIPATE, false).then(isParticipating => {
      if (isParticipating === false) {
        this.setState({
          currentState: StateEnum.SETTING_OFF,
        });
      }
    });
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    // refresh state if settings have changed
    this.unsubscribe = this.props.navigation.addListener('focus', () => {
      this.checkIfUserAtRisk();
    });
    GetStoreData(PARTICIPATE, false)
      .then(isParticipating => {
        if (isParticipating === 'true') {
          this.setState({
            isLogging: true,
          });
          this.willParticipate();
        } else {
          this.setState({
            isLogging: false,
            currentState: StateEnum.SETTING_OFF,
          });
        }
      })
      .catch(error => console.log(error));
  }

  findNewAuthorities() {
    // TODO: This should pull down the Healtcare Authorities list (see Settings.js)
    // Then it should look at the GPS extent box of each authority and (if any
    // of the GPS coordinates change) pop-up a notification that is basically:
    //    There is a new "Healthcare Authority" for an area where you have
    //    been.
    // Tapping that notification asks if they want to Add that Healthcare Authority
    // under the Settings screen.
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    clearInterval(this.state.timer_intersect);
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    this.unsubscribe();
  }

  // need to check state again if new foreground event
  // e.g. if user changed location permission
  handleAppStateChange = nextAppState => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      this.checkCurrentState();
    }
    this.setState({ appState: nextAppState });
  };

  handleBackPress = () => {
    BackHandler.exitApp(); // works best when the goBack is async
    return true;
  };

  export() {
    this.props.navigation.navigate('ExportScreen', {});
  }

  import() {
    this.props.navigation.navigate('ImportScreen', {});
  }

  willParticipate = () => {
    SetStoreData(PARTICIPATE, 'true').then(() => {
      // Turn of bluetooth for v1
      //BroadcastingServices.start();
    });
    // Check and see if they actually authorized in the system dialog.
    // If not, stop services and set the state to !isLogging
    // Fixes tripleblindmarket/private-kit#129
    BackgroundGeolocation.checkStatus(({ authorization }) => {
      if (authorization === BackgroundGeolocation.AUTHORIZED) {
        LocationServices.start();
        this.setState({
          isLogging: true,
        });
      } else if (authorization === BackgroundGeolocation.NOT_AUTHORIZED) {
        LocationServices.stop();
        // Turn off bluetooth for v1
        //BroadcastingServices.stop(this.props.navigation);
        BackgroundTaskServices.stop();
        this.setState({
          isLogging: false,
        });
      }
    });
  };

  news() {
    this.props.navigation.navigate('NewsScreen', {});
  }

  licenses() {
    this.props.navigation.navigate('LicensesScreen', {});
  }

  settings() {
    this.props.navigation.navigate('SettingsScreen', {});
  }

  notifications() {
    this.props.navigation.navigate('NotificationScreen', {});
  }

  setOptOut = () => {
    LocationServices.stop(this.props.navigation);
    // Turn of bluetooth for v1
    //BroadcastingServices.stop(this.props.navigation);
    this.setState({
      isLogging: false,
    });
  };

  getBackground() {
    if (this.state.currentState === StateEnum.AT_RISK) {
      return BackgroundImageAtRisk;
    }
    return BackgroundImage;
  }
  getiOSVersionEqualto12() {
    if (
      Platform.OS === 'ios' &&
      (Platform.Version === '12.0' || Platform.Version === '12.0.1')
    ) {
      return true;
    }
    return false;
  }

  getSettings() {
    return (
      <TouchableOpacity
        style={styles.settingsContainer}
        onPress={() => {
          this.props.navigation.navigate('SettingsScreen');
        }}>
        {/* Is there is a reason there's this imageless image tag here? Can we delete it? */}
        <Image resizeMode={'contain'} />
        {this.getiOSVersionEqualto12() ? (
          <Image
            style={{
              width: 32,
              height: 32,
              resizeMode: 'contain',
            }}
            source={{
              uri: settingsImageData,
            }}
          />
        ) : (
          <SvgXml
            style={styles.stateIcon}
            xml={SettingsGear}
            width={32}
            height={32}
          />
        )}
      </TouchableOpacity>
    );
  }

  getPulseIfNeeded() {
    if (this.state.currentState == StateEnum.NO_CONTACT) {
      return (
        <View style={styles.pulseContainer}>
          <Pulse
            image={{ exportImage }}
            color={Colors.PULSE_WHITE}
            numPulses={3}
            diameter={400}
            speed={20}
            duration={2000}
          />
          <StateIcon size={height} status={this.state.currentState} />
        </View>
      );
    }
    return (
      <View style={styles.pulseContainer}>
        <Text>Testdsfafasfsdafasfsadf</Text>
        <StateIcon size={height} status={this.state.currentState} />
      </View>
    );
  }

  getMainText() {
    switch (this.state.currentState) {
      case StateEnum.NO_CONTACT:
        return (
          <Text style={styles.mainTextBelow}>
            {languages.t('label.home_no_contact_header')}
          </Text>
        );
      case StateEnum.AT_RISK:
        return (
          <Text style={styles.mainTextAbove}>
            {languages.t('label.home_at_risk_header')}
          </Text>
        );
      case StateEnum.UNKNOWN:
        return (
          <Text style={styles.mainTextBelow}>
            {languages.t('label.home_unknown_header')}
          </Text>
        );
      case StateEnum.SETTING_OFF:
        return (
          <Text style={styles.mainTextBelow}>
            {languages.t('label.home_setting_off_header')}
          </Text>
        );
    }
  }

  getSubText() {
    switch (this.state.currentState) {
      case StateEnum.NO_CONTACT:
        return languages.t('label.home_no_contact_subtext');
      case StateEnum.AT_RISK:
        return languages.t('label.home_at_risk_subtext');
      case StateEnum.UNKNOWN:
        return languages.t('label.home_unknown_subtext');
      case StateEnum.SETTING_OFF:
        return languages.t('label.home_setting_off_subtext');
    }
  }
  getSubSubText() {
    switch (this.state.currentState) {
      case StateEnum.NO_CONTACT:
        return null;
      case StateEnum.AT_RISK:
        return languages.t('label.home_at_risk_subsubtext');
      case StateEnum.UNKNOWN:
        return null;
      case StateEnum.SETTING_OFF:
        return null;
    }
  }

  getCTAIfNeeded() {
    let buttonLabel;
    let buttonFunction;
    if (this.state.currentState === StateEnum.NO_CONTACT) {
      return;
    } else if (this.state.currentState === StateEnum.AT_RISK) {
      buttonLabel = languages.t('label.see_exposure_history');
      buttonFunction = () => {
        this.props.navigation.navigate('ExposureHistoryScreen');
      };
    } else if (this.state.currentState === StateEnum.UNKNOWN) {
      buttonLabel = languages.t('label.home_enable_location');
      buttonFunction = () => {
        openSettings();
      };
    } else if (this.state.currentState === StateEnum.SETTING_OFF) {
      buttonLabel = languages.t('label.home_enable_location');
      buttonFunction = () => {
        this.settings();
      };
    }
    return (
      <View style={styles.buttonContainer}>
        <ButtonWrapper
          title={buttonLabel}
          onPress={() => {
            buttonFunction();
          }}
          buttonColor={Colors.BLUE_BUTTON}
          bgColor={Colors.WHITE}
        />
      </View>
    );
  }

  getMayoInfoPressed() {
    Linking.openURL(MAYO_COVID_URL);
  }

  render() {
    return (
      <ImageBackground
        source={this.getBackground()}
        style={styles.backgroundImage}>
        <StatusBar
          barStyle='light-content'
          backgroundColor='transparent'
          translucent
        />
        {this.getPulseIfNeeded()}

        <View style={styles.mainContainer}>
          <View style={styles.contentAbovePulse}>
            {this.state.currentState === StateEnum.AT_RISK &&
              this.getMainText()}
            <Text style={styles.subsubheaderText}>{this.getSubSubText()}</Text>
          </View>
          <View style={styles.contentBelowPulse}>
            {this.state.currentState !== StateEnum.AT_RISK &&
              this.getMainText()}
            <Text style={styles.subheaderText}>{this.getSubText()}</Text>
            {this.getCTAIfNeeded()}
          </View>
        </View>

        <View>
          <TouchableOpacity
            onPress={this.getMayoInfoPressed.bind(this)}
            style={styles.mayoInfoRow}>
            <View style={styles.mayoInfoContainer}>
              <Text
                style={styles.mainMayoHeader}
                onPress={() => Linking.openURL(MAYO_COVID_URL)}>
                {languages.t('label.home_mayo_link_heading')}
              </Text>
              <Text
                style={styles.mainMayoSubtext}
                onPress={() => Linking.openURL(MAYO_COVID_URL)}>
                {languages.t('label.home_mayo_link_label')}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Image source={foreArrow} style={this.arrow} />
            </View>
          </TouchableOpacity>
        </View>
        {this.getSettings()}
      </ImageBackground>
    );
  }
}

const PULSE_GAP = 80;

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    flex: 1,
    justifyContent: 'flex-end',
  },
  mainContainer: {
    position: 'absolute',
    // resizeMode: 'contain',
    // aligns the center of the main container with center of pulse
    // so that two `flex: 1` views will be have a reasonable chance at natural
    // flex flow for above and below the pulse.
    top: '-10%',
    left: 0,
    right: 0,
    height: '100%',
    paddingHorizontal: '12%',
    paddingBottom: 12,
  },
  contentAbovePulse: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: PULSE_GAP / 2,
  },
  contentBelowPulse: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: PULSE_GAP,
  },
  settingsContainer: {
    position: 'absolute',
    top: 0,
    marginTop: '14%',
    marginRight: '5%',
    alignSelf: 'flex-end',
  },
  buttonContainer: {
    top: 24,
  },
  pulseContainer: {
    position: 'absolute',
    resizeMode: 'contain',
    height: '100%',
    top: '-13%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mainTextAbove: {
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 24,
    color: Colors.WHITE,
    fontSize: 28,
    fontFamily: fontFamily.primaryMedium,
  },
  mainTextBelow: {
    textAlign: 'center',
    lineHeight: 34,
    color: Colors.WHITE,
    fontSize: 26,
    fontFamily: fontFamily.primaryMedium,
    marginBottom: 24,
  },
  subheaderText: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24.5,
    color: Colors.WHITE,
    fontSize: 18,
    fontFamily: fontFamily.primaryRegular,
  },
  subsubheaderText: {
    textAlign: 'center',
    lineHeight: 24.5,
    color: Colors.WHITE,
    fontSize: 16,
    fontFamily: fontFamily.primaryLight,
    marginBottom: 24,
  },
  mayoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mayoInfoContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignContent: 'flex-end',
    padding: 20,
  },
  mainMayoHeader: {
    textAlign: 'left',
    color: Colors.MISCHKA,
    fontSize: 18,
    fontFamily: fontFamily.primaryBold,
  },
  mainMayoSubtext: {
    textAlign: 'left',
    color: Colors.MISCHKA,
    fontSize: 18,
    fontFamily: fontFamily.primaryRegular,
  },
  arrowContainer: {
    alignSelf: 'center',
    paddingRight: 20,
  },
});

export default LocationTracking;
