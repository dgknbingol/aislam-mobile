import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import QiblaCompass, { type TurnHint } from '../components/qibla/QiblaCompass';
import { useLocationContext } from '../context/LocationContext';
import { useCompassHeading } from '../hooks/useCompassHeading';
import type { RootStackParamList } from '../navigation/types';
import {
  angleDifference,
  QIBLA_ALIGN_THRESHOLD_DEG,
} from '../utils/compassHeading';
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
} from '../utils/qibla';

const CALIBRATION_TIP_KEY = '@aislam/qibla-calibration-tip-seen';
const BG = '#0A0E14';

export default function QiblaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { latitude, longitude, isLoadingLocation, permissionDenied } = useLocationContext();
  const { heading, headingSV, isAvailable } = useCompassHeading(true, latitude, longitude);
  const [showCalibrationTip, setShowCalibrationTip] = useState(false);
  const wasAlignedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(CALIBRATION_TIP_KEY).then((value) => {
      if (!cancelled && value !== '1') {
        setShowCalibrationTip(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissCalibrationTip = useCallback(async () => {
    setShowCalibrationTip(false);
    await AsyncStorage.setItem(CALIBRATION_TIP_KEY, '1');
  }, []);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const hasLocation = latitude != null && longitude != null;
  const qiblaBearing = hasLocation ? calculateQiblaBearing(latitude, longitude) : 0;
  const distanceKm = hasLocation ? calculateDistanceToKaaba(latitude, longitude) : null;
  const isAligned =
    heading != null &&
    angleDifference(heading, qiblaBearing) <= QIBLA_ALIGN_THRESHOLD_DEG;

  const turnHint: TurnHint = useMemo(() => {
    if (heading == null) return 'calibrating';
    if (isAligned) return 'aligned';
    const relative = (qiblaBearing - heading + 360) % 360;
    return relative <= 180 ? 'right' : 'left';
  }, [heading, isAligned, qiblaBearing]);

  useEffect(() => {
    // Yalnızca tam kıbleye ilk girişte titreş
    if (isAligned && !wasAlignedRef.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned]);

  return (
    <View style={styles.container}>
      <Modal
        visible={showCalibrationTip}
        transparent
        animationType="fade"
        onRequestClose={() => void dismissCalibrationTip()}
      >
        <View style={styles.tipBackdrop}>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Pusulayı kalibre edin</Text>
            <Text style={styles.tipBody}>
              Daha doğru sonuç için telefonu yatay tutun ve havada yavaşça{' '}
              <Text style={styles.tipEmphasis}>8 şeklinde</Text> hareket ettirin. Mıknatıslı
              kılıf ve metal yüzeylerden uzak tutun.
            </Text>
            <Pressable
              style={styles.tipButton}
              onPress={() => void dismissCalibrationTip()}
              accessibilityRole="button"
            >
              <Text style={styles.tipButtonText}>Anladım</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={goBack} style={styles.backButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={26} color="#F5F0E6" />
        </Pressable>
        <Text style={styles.headerTitle}>Kıble Pusulası</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 12 }]}>
        {isLoadingLocation ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1FA8A0" />
            <Text style={styles.statusText}>Konum alınıyor...</Text>
          </View>
        ) : !hasLocation ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Konum bilgisi alınamadı.</Text>
          </View>
        ) : (
          <>
            <QiblaCompass
              qiblaBearing={qiblaBearing}
              headingSV={headingSV}
              heading={heading}
              isAligned={isAligned}
              turnHint={turnHint}
              distanceKm={distanceKm}
            />

            {permissionDenied ? (
              <Text style={styles.warning}>
                Konum izni kapalı; kayıtlı veya varsayılan konum kullanılıyor.
              </Text>
            ) : null}

            {!isAvailable ? (
              <Text style={styles.warning}>
                Bu cihazda pusula sensörü bulunamadı. Kıble açısı yine de gösteriliyor.
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#F5F0E6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(245, 240, 230, 0.7)',
  },
  errorText: {
    fontSize: 15,
    color: '#FF9B7A',
    textAlign: 'center',
  },
  warning: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#FF9B7A',
    textAlign: 'center',
  },
  tipBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  tipCard: {
    backgroundColor: '#151A22',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.12)',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F0E6',
    marginBottom: 10,
  },
  tipBody: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(245, 240, 230, 0.75)',
  },
  tipEmphasis: {
    fontWeight: '700',
    color: '#F5F0E6',
  },
  tipButton: {
    marginTop: 20,
    alignSelf: 'flex-end',
    backgroundColor: '#1FA8A0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tipButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
