import { StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import Colors from '../../../constants/DR/colors.js';

const { background, orange, pink, mainBlue } = Colors;
const textFontSize = wp('4%');

const styles = StyleSheet.create({
  auroraImage: {
    width: wp('7%'),
    height: wp('7%'),
  },
  auroraContainer: {
    alignItems: 'center',
    height: wp('10%'),
    flexDirection: 'row',
  },
  actualSituationContent: {
    width: wp('90%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bigCards: {
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: hp('2%'),
    padding: wp('5%'),
    width: wp('91%'),
  },
  textHeader: {
    fontSize: textFontSize + 2,
    fontFamily: 'IBMPlexSans-Bold',
  },
  text: {
    color: '#000',
    fontSize: textFontSize - 2,
    fontFamily: 'IBMPlexSans-Thin',
  },
  buttons: {
    alignSelf: 'center',
    borderRadius: 25,
    justifyContent: 'center',
    height: 38,
    marginLeft: 6,
    minWidth: wp('27%'),
  },
  radioButtonLayout: {
    display: 'flex',
    flexDirection: 'row',
    width: wp('100%'),
    justifyContent: 'flex-start',
    paddingTop: 10,
    marginLeft: -5,
  },
  buttonText: {
    alignSelf: 'center',
    color: '#fff',
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: wp('3.5%'),
    textTransform: 'capitalize',
  },
  tester: {
    flexDirection: 'row',
  },
});

export default styles;
