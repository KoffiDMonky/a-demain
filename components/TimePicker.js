import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Localization from 'expo-localization';
import { t } from '../i18n';

const TimePicker = ({ value, onChange }) => {
  const [showIosPicker, setShowIosPicker] = useState(false);

  const showPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        is24Hour: true,
        display: 'default',
        onChange,
      });
    } else {
      setShowIosPicker(true);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showPicker} style={styles.button}>
        <Text style={styles.buttonText}>
          {t('timePicker.reminderAt', {
            time: value.toLocaleTimeString(
              Localization.getLocales()[0]?.languageTag ?? 'fr-FR',
              { hour: '2-digit', minute: '2-digit' }
            ),
          })}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && showIosPicker && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(event, selectedDate) => {
            if (selectedDate) onChange(event, selectedDate);
            setShowIosPicker(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default TimePicker;