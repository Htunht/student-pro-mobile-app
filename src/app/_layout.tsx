import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { setupDatabase } from '../database/db';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import {
  NotoSansMyanmar_400Regular,
  NotoSansMyanmar_500Medium,
  NotoSansMyanmar_600SemiBold,
  NotoSansMyanmar_700Bold,
} from '@expo-google-fonts/noto-sans-myanmar';
import { FONTS } from '../theme/fonts';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'NotoSansMyanmar-Regular': NotoSansMyanmar_400Regular,
    'NotoSansMyanmar-Medium': NotoSansMyanmar_500Medium,
    'NotoSansMyanmar-SemiBold': NotoSansMyanmar_600SemiBold,
    'NotoSansMyanmar-Bold': NotoSansMyanmar_700Bold,
  });

  // 🚪 App စဖွင့်ချင်း ကြိုဆိုမည့် Splash Screen State (၂.၅ စက္ကန့်ပြသမည်)
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    setupDatabase();

    const timer = setTimeout(() => {
      setIsSplashVisible(false); // ၂.၅ စက္ကန့်ပြည့်ပါက မူလ App ထဲသို့ ဝင်ရောက်မည်
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 🌟 ၁။ Splash ပြသနေချိန်တွင် ပေါ်မည့် မျက်နှာပြင်
  if (isSplashVisible || !fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        {/* အလယ်ဗဟိုက Logo နှင့် App အမည် */}
        <View style={styles.centerContent}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: '100%', height: '100%'}} 
              resizeMode="contain"
            />
          </View>
          <Text allowFontScaling={false} style={styles.appName}>
            Student Pro
          </Text>
          <Text allowFontScaling={false} style={styles.subTitle}>
            ကျောင်းသားနှင့် ငွေစာရင်း စီမံခန့်ခွဲမှုစနစ်
          </Text>
          {!fontsLoaded && <ActivityIndicator color="#FFFFFF" style={{ marginTop: 20 }} />}
        </View>

        {/* အောက်ခြေက Signature စာသား */}
        <View style={styles.footer}>
          <Text allowFontScaling={false} style={styles.creatorText}>ထွန်း(Htun) မှ ဖန်တီးပြုလုပ်သည်</Text>
        </View>
      </View>
    );
  }

  // 🏠 ၂။ အချိန်ပြည့်သွားပါက မူလ App ၏ Drawer Navigation နှင့် အခန်းများကို ပြသမည်
  return (
    // GestureHandler က လက်နဲ့ ပွတ်ဆွဲတဲ့ (Swipe) အာရုံခံစနစ်ကို အသက်သွင်းပေးတာ
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Drawer 
          screenOptions={{ 
            drawerActiveTintColor: '#059669', // ရွေးထားတဲ့ Menu အရောင်
            headerTintColor: '#111827', // ခေါင်းစဉ် စာသားအရောင်
            headerTitleStyle: { fontFamily: FONTS.bold, fontSize: 18 },
            drawerLabelStyle: { fontFamily: FONTS.medium, fontSize: 15 },
          }}
        >
          {/* ၁။ ကျောင်းသားများ အခန်း (index.tsx ကို ညွှန်းတာ) */}
          <Drawer.Screen
            name="index" 
            options={{
              drawerLabel: 'ကျောင်းသားများ',
              title: 'ကျောင်းသား မှတ်တမ်း',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-group" size={size} color={String(color || '#059669')} />
              ),
            }}
          />

          {/* ၂။ ဘာသာရပ်များ အခန်း */}
          <Drawer.Screen
            name="subjects" 
            options={{
              drawerLabel: 'ဘာသာရပ်များ',
              title: 'သင်ကြားမည့် ဘာသာရပ်များ',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="book-open-page-variant" size={size} color={String(color || '#059669')} />
              ),
            }}
          />

          {/* ၃။ ပွဲများ အခန်း */}
          <Drawer.Screen
            name="events" 
            options={{
              drawerLabel: 'ပွဲများ',
              title: 'ပွဲများ',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="calendar-star" size={size} color={String(color || '#059669')} />
              ),
            }}
          />

          {/* ၄။ ကျောင်းသား အသေးစိတ် အခန်း (Drawer Menu ထဲ မပါဝင်အောင် ဖျောက်ထားသည်) */}
          <Drawer.Screen
            name="students/[id]" 
            options={{
              drawerItemStyle: { display: 'none' },
              title: 'ကျောင်းသား အသေးစိတ်',
              headerLeft: () => (
                <IconButton 
                  icon="arrow-left" 
                  size={24} 
                  iconColor="#111827"
                  onPress={() => router.navigate('/')} 
                />
              ),
            }}
          />

          {/* ၅။ ဘာသာရပ် အသေးစိတ် အခန်း (Drawer Menu ထဲ မပါဝင်အောင် ဖျောက်ထားသည်) */}
          <Drawer.Screen
            name="subjects/[id]" 
            options={{
              drawerItemStyle: { display: 'none' },
              title: 'ဘာသာရပ် အသေးစိတ်',
              headerLeft: () => (
                <IconButton 
                  icon="arrow-left" 
                  size={24} 
                  iconColor="#111827"
                  onPress={() => router.navigate('/subjects')} 
                />
              ),
            }}
          />

          {/* ၆။ ပွဲ အသေးစိတ် အခန်း (Drawer Menu ထဲ မပါဝင်အောင် ဖျောက်ထားသည်) */}
          <Drawer.Screen
            name="events/[id]" 
            options={{
              drawerItemStyle: { display: 'none' },
              title: 'ပွဲ အသေးစိတ်',
              headerLeft: () => (
                <IconButton 
                  icon="arrow-left" 
                  size={24} 
                  iconColor="#111827"
                  onPress={() => router.navigate('/events')} 
                />
              ),
            }}
          />
        </Drawer>
      </View>

    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#059669', // ဆရာတို့ရဲ့ ပင်မ အစိမ်းရောင်လေး
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoBox: {
    width: 110,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  appName: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: '#FFFFFF',
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  subTitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#D1FAE5',
    marginTop: 8,
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
  },
  creatorText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
  },
});