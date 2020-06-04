import 'moment/locale/es';

import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';
import { Button, Card, Container, Content, Text } from 'native-base';
import React, { useContext, useState } from 'react';
import { ScrollView, TouchableHighlight, View } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { Dialog } from 'react-native-simple-dialogs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import CalendarButton from '../../../components/DR/CalendarButton/index';
import Header from '../../../components/DR/Header';
import styles from '../../../components/DR/Header/style';
import Input from '../../../components/DR/Input/index';
import PhoneInput from '../../../components/DR/PhoneInput/index';
import context from '../../../components/DR/Reduces/context.js';
import Colors from '../../../constants/colors';

export default function UserInfo({ navigation }) {
  navigation.setOptions({
    headerShown: false,
  });
  const [showDialog, setShowDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [usePassport, setUsePassport] = useState(false);
  const [useIdCard, setUseIdCard] = useState(false);
  const [useNss, setUseNss] = useState(false);
  const [error, setError] = useState(false);
  const [
    {
      answers: {
        birth,
        cid = '',
        passportId = '',
        passportName = '',
        nssId = '',
        phoneNumber,
        usage,
      },
    },
    setGlobalState,
  ] = useContext(context);

  const closeDialog = final => {
    setError(false);
    setShowDialog(false);
    setShowValidationDialog(false);
    setUseIdCard(false);
    setUseNss(false);
    setUsePassport(false);
    final && setGlobalState({ type: 'CLEAN_ANSWERS' });
  };

  const validateCovidPositive = async info => {
    try {
      let response = await fetch(
        'https://webapps.mepyd.gob.do:443/contact_tracing/api/Form',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(info),
        },
      );
      response = await response.json();
      return response;
    } catch (e) {
      console.log('ha ocurrido un error', e);
    }
  };

  const storeData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.log(e);
    }
  };
  const validate = async data => {
    try {
      let response = await fetch(
        'https://webapps.mepyd.gob.do/contact_tracing/api/Person',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.body),
        },
      );
      response = await response.json();
      if (response.valid !== undefined) {
        if (response.valid) {
          getAge(birth);
          let { positive } = await validateCovidPositive(data.body);
          closeDialog(false);
          if (positive) {
            if (usage === 'mySelf') {
              storeData('positive', positive);
              storeData('UserPersonalInfo', data.body);
            }
            navigation.navigate('EpidemiologicResponse');
          } else {
            navigation.navigate('Report');
          }
        } else {
          setError(true);
        }
      } else {
        setShowDialog(false);
        setShowValidationDialog(true);
      }
      return response;
    } catch (e) {
      console.log('ha ocurrido un error', e);
    }
  };

  const sendDataToApi = async () => {
    let data = { body: {} };
    if (useIdCard) {
      data.body = {
        cid: cid,
        birth: moment(birth).format('YYYY-MM-DD'),
        phoneNumber: phoneNumber,
      };
    } else if (usePassport) {
      data.body = {
        passportId: passportId,
        passportName: passportName,
        birth: moment(birth).format('YYYY-MM-DD'),
        phoneNumber: phoneNumber,
      };
    } else {
      data.body = {
        nssid: nssId,
        birth: moment(birth).format('YYYY-MM-DD'),
        phoneNumber: phoneNumber,
      };
    }
    return await validate(data);
  };

  const setSelectedOption = (option, selected) => {
    setGlobalState({
      type: 'ADD_ANSWERS',
      value: { [option]: selected },
    });
  };
  const getAge = date => {
    const today = new Date();
    const birthday = new Date(date);
    let personAge = today.getFullYear() - birthday.getFullYear();
    const month = today.getMonth() - birthday.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthday.getDate())) {
      personAge--;
    }
    return setSelectedOption('age', personAge);
  };

  let disabled =
    (cid.length > 10 || passportId.length > 6 || nssId.length > 5) &&
    (phoneNumber.length > 13 || passportName.length > 8) &&
    birth
      ? false
      : true;
  return (
    <Container>
      <Content>
        <ScrollView>
          <View style={{ flex: 1 }}>
            <Dialog
              visible={showValidationDialog}
              onTouchOutside={() => closeDialog(true)}
              dialogStyle={{ backgroundColor: Colors.WHITE }}>
              <Icon
                name={'exclamation-circle'}
                color={Colors.RED_TEXT}
                size={30}
                style={{ marginBottom: 12, alignSelf: 'center' }}
              />
              <Text>
                En estos momentos no podemos validar tus datos. Por favor
                intenta más tarde.
              </Text>
              <Button
                style={[
                  styles.buttons,
                  {
                    backgroundColor: Colors.GREEN,
                    width: '70%',
                    marginTop: 25,
                  },
                ]}
                onPress={() => {
                  closeDialog(true);
                }}>
                <Text>Cerrar</Text>
              </Button>
            </Dialog>

            <Dialog
              onTouchOutside={() => closeDialog(true)}
              visible={showDialog}
              dialogStyle={{ backgroundColor: Colors.WHITE }}>
              <View>
                <Button
                  transparent
                  onPress={() => closeDialog(true)}
                  style={{ marginTop: -10 }}>
                  <Icon name='times' size={25} color={Colors.GREEN} />
                </Button>
                {error && (
                  <Text style={[styles.text, { color: Colors.RED_TEXT }]}>
                    Datos incorrectos, por favor revise.
                  </Text>
                )}
                <Text style={styles.textSemiBold}>
                  Ingrese su No. de{' '}
                  {useNss
                    ? 'Seguro Social'
                    : useIdCard
                    ? 'cédula'
                    : 'pasaporte'}
                  :
                </Text>
                {useIdCard || useNss ? (
                  <Input
                    value={useIdCard ? cid : useNss && nssId}
                    onChange={text =>
                      setSelectedOption(
                        useIdCard ? 'cid' : useNss && 'nssId',
                        `${text}`.replace(/\D/g, ''),
                      )
                    }
                    style={{ marginBottom: 12 }}
                    keyboardType={'numeric'}
                    maxLength={useNss ? 9 : 11}
                  />
                ) : (
                  <Input
                    value={passportId}
                    onChange={text => setSelectedOption('passportId', text)}
                    style={{ marginBottom: 12 }}
                    keyboardType={'default'}
                    maxLength={10}
                  />
                )}

                {usePassport ? (
                  <View>
                    <Text style={styles.textSemiBold}>Nombre y apellido:</Text>
                    <Input
                      value={passportName}
                      onChange={text => setSelectedOption('passportName', text)}
                      style={{ marginBottom: 12 }}
                      keyboardType={'default'}
                      maxLength={35}
                    />
                  </View>
                ) : (
                  <View>
                    <Text style={styles.textSemiBold}>Número de teléfono:</Text>
                    <PhoneInput
                      value={phoneNumber}
                      handleOnChange={text =>
                        setSelectedOption('phoneNumber', text)
                      }
                      style={{ marginBottom: 12 }}
                    />
                  </View>
                )}
                <Text style={[styles.textSemiBold, { marginBottom: 10 }]}>
                  Fecha de Nacimiento:
                </Text>
                <CalendarButton
                  onChange={date => {
                    setSelectedOption(
                      'birth',
                      moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD'),
                    );
                  }}
                  date={moment(birth).format('DD-MM-YYYY')}
                  minDate='01-01-1900'
                />
                <Button
                  disabled={disabled}
                  style={[
                    styles.buttons,
                    {
                      backgroundColor: disabled
                        ? Colors.DARK_GREEN
                        : Colors.GREEN,
                      marginTop: 18,
                    },
                  ]}
                  onPress={async () => {
                    await sendDataToApi();
                  }}>
                  <Text style={styles.buttonText}>Continuar</Text>
                </Button>
              </View>
            </Dialog>

            <Header
              title='Ingrese sus datos'
              text='Utilizaremos estos datos para darle el apropiado seguimiento a sus resultados:'
              navigation={navigation}
              close
              style={{ height: wp('38%') }}
            />
            <View
              style={{
                height: hp('60%'),
                alignItems: 'center',
                marginTop: 20,
              }}>
              <TouchableHighlight
                onPress={() => {
                  setShowDialog(true);
                  setUseIdCard(true);
                }}
                underlayColor='#FFF'>
                <Card style={[styles.bigCards, styles.userDataCard]}>
                  <Text
                    style={[
                      styles.textSemiBold,
                      { marginVertical: 10, marginHorizontal: 12 },
                    ]}>
                    Iniciar con cédula
                  </Text>
                  <Icon
                    name='id-card'
                    size={wp('8.5%')}
                    color={Colors.BLUE_RIBBON}
                  />
                </Card>
              </TouchableHighlight>
              <TouchableHighlight
                onPress={() => {
                  setShowDialog(true);
                  setUsePassport(true);
                }}
                underlayColor='#FFF'>
                <Card style={[styles.bigCards, styles.userDataCard]}>
                  <Text
                    style={[
                      styles.textSemiBold,
                      { marginVertical: 10, marginHorizontal: 12 },
                    ]}>
                    Iniciar con pasaporte
                  </Text>
                  <Icon
                    name='passport'
                    size={wp('9%')}
                    color={Colors.BLUE_RIBBON}
                  />
                </Card>
              </TouchableHighlight>
              <TouchableHighlight
                onPress={() => {
                  setShowDialog(true);
                  setUseNss(true);
                }}
                underlayColor='#FFF'>
                <Card
                  style={[
                    styles.bigCards,
                    styles.userDataCard,
                    { alignItems: 'center' },
                  ]}>
                  <Text
                    style={[
                      styles.textSemiBold,
                      { marginVertical: 10, marginHorizontal: 12 },
                    ]}>
                    Iniciar con Número de Seguridad Social (NSS) de República
                    Dominicana
                  </Text>
                  <Icon
                    name='id-card-alt'
                    size={wp('8.5%')}
                    color={Colors.BLUE_RIBBON}
                  />
                </Card>
              </TouchableHighlight>
            </View>
          </View>
        </ScrollView>
      </Content>
    </Container>
  );
}