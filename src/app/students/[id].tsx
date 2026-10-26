import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { Text, Card, Avatar, Divider, Provider as PaperProvider, MD3LightTheme, Button, TextInput, IconButton, Chip } from 'react-native-paper';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS, paperFonts } from '../../theme/fonts';

const myTheme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  colors: { ...MD3LightTheme.colors, primary: '#059669', background: '#F0FDF4' },
};

interface Student {
  id: number;
  roll_number: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface SubjectPayment {
  id: number;
  student_id: number;
  subject_name: string;
  payment_amount: number;
  payment_date: string;
  status?: string;
  payment_id?: string;
}

interface EventPayment {
  id: number;
  student_id: number;
  event_name: string;
  payment_amount: number;
  payment_date: string;
  status?: string;
  payment_id?: string;
}

interface SubjectItem {
  id: number;
  name: string;
  price: number;
}

interface EventItem {
  id: number;
  name: string;
  price: number;
}

interface ReceiptData {
  id: number;
  title: string;
  payment_amount: number;
  payment_date: string;
  status?: string;
  payment_id?: string;
  type: 'Subject' | 'Event';
}

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const studentId = Array.isArray(id) ? id[0] : (id || '');
  
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<SubjectPayment[]>([]);
  const [events, setEvents] = useState<EventPayment[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectItem[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventItem[]>([]);

  // 📝 ၁။ ဘာသာရပ် စာရင်းသွင်းရန် (Booking) Modal States
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [subjectName, setSubjectName] = useState('');

  // 📝 ၂။ ပွဲ (Event) စာရင်းသွင်းရန် (Booking) Modal States
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventName, setEventName] = useState('');

  // 🧾 ၃။ KPay ပြေစာ (Receipt) States
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const viewShotRef = useRef<any>(null);

  const db = SQLite.openDatabaseSync('notedbook.db');

  useFocusEffect(
    useCallback(() => {
      if (studentId) loadStudentDetails();
    }, [studentId])
  );

  const loadStudentDetails = () => {
    if (!studentId) return;
    try {
      setStudent(db.getFirstSync<Student>(`SELECT * FROM students WHERE id = ?`, [studentId]));
      setSubjects(db.getAllSync<SubjectPayment>(`SELECT * FROM subject_payments WHERE student_id = ? ORDER BY id DESC`, [studentId]));
      setEvents(db.getAllSync<EventPayment>(`SELECT * FROM event_payments WHERE student_id = ? ORDER BY id DESC`, [studentId]));
      setAvailableSubjects(db.getAllSync<SubjectItem>(`SELECT * FROM subjects ORDER BY id DESC`));
      setAvailableEvents(db.getAllSync<EventItem>(`SELECT * FROM events ORDER BY id DESC`));
    } catch (error) {
      console.log("Error:", error);
    }
  };

  // 📚 ဘာသာရပ် စာရင်းသွင်းခြင်း (Booking)
  const handleBookSubject = () => {
    if (!subjectName || !studentId) return Alert.alert("သတိပေးချက်", "ဘာသာရပ် ရွေးချယ်ပါ!");
    try {
      const today = new Date().toISOString().split('T')[0];
      const selectedSub = availableSubjects.find((s) => s.name === subjectName);
      const price = selectedSub ? selectedSub.price : 0;

      db.runSync(
        `INSERT INTO subject_payments (subject_name, student_id, payment_amount, payment_date, status) VALUES (?, ?, ?, ?, 'Unpaid')`,
        [subjectName, studentId, price, today]
      );
      setSubjectName('');
      setSubjectModalVisible(false);
      loadStudentDetails();
      Alert.alert("အောင်မြင်ပါသည် 🎉", "ဘာသာရပ် စာရင်းသွင်းခြင်း (Booking) ပြီးပါပြီ!");
    } catch (error) {
      Alert.alert("Error", "ဒေတာ သိမ်းဆည်း၍ မရပါ။");
    }
  };

  // 🎉 ပွဲ စာရင်းသွင်းခြင်း (Booking)
  const handleBookEvent = () => {
    if (!eventName || !studentId) return Alert.alert("သတိပေးချက်", "ပွဲ ရွေးချယ်ပါ!");
    try {
      const today = new Date().toISOString().split('T')[0];
      const selectedEv = availableEvents.find((e) => e.name === eventName);
      const price = selectedEv ? selectedEv.price : 0;

      db.runSync(
        `INSERT INTO event_payments (event_name, student_id, payment_amount, payment_date, status) VALUES (?, ?, ?, ?, 'Unpaid')`,
        [eventName, studentId, price, today]
      );
      setEventName('');
      setEventModalVisible(false);
      loadStudentDetails();
      Alert.alert("အောင်မြင်ပါသည် 🎉", "ပွဲ စာရင်းသွင်းခြင်း (Booking) ပြီးပါပြီ!");
    } catch (error) {
      Alert.alert("Error", "ဒေတာ သိမ်းဆည်း၍ မရပါ။");
    }
  };

  // 💸 ငွေချေမည် & Slip ထုတ် (နှိပ်လိုက်တာနဲ့ တန်းပြီး Paid ဖြစ်မယ်၊ ပြီးရင် KPay Slip တန်းပေါ်မယ်!)
  const handleMakePayment = (item: SubjectPayment | EventPayment, type: 'Subject' | 'Event') => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const autoPaymentId = `KP-${Date.now().toString().slice(-6)}`; // ဥပမာ KP-938201
      const titleName = type === 'Subject' ? (item as SubjectPayment).subject_name : (item as EventPayment).event_name;
      
      if (type === 'Subject') {
        db.runSync(
          `UPDATE subject_payments SET status = 'Paid', payment_date = ?, payment_id = ? WHERE id = ?`,
          [today, autoPaymentId, item.id]
        );
      } else {
        db.runSync(
          `UPDATE event_payments SET status = 'Paid', payment_date = ?, payment_id = ? WHERE id = ?`,
          [today, autoPaymentId, item.id]
        );
      }
      
      // ဒေတာအသစ် ပြန်ဆွဲမယ်
      loadStudentDetails();
      
      // ပြီးတာနဲ့ တန်းပြီး KPay စတိုင် Slip ကြီး ထုတ်ပြမယ်
      showReceipt({
        id: item.id,
        title: titleName,
        payment_amount: item.payment_amount,
        payment_date: today,
        payment_id: autoPaymentId,
        status: 'Paid',
        type
      }, type);
      
    } catch (error) {
      Alert.alert("Error", "ငွေချေ၍ မရပါ။");
    }
  };

  // 🗑️ ဘာသာရပ် ပယ်ဖျက်ရန်
  const handleDeleteSubject = (id: number) => {
    Alert.alert("သတိပေးချက် ⚠️", "ဤဘာသာရပ် မှတ်တမ်းကို ဖျက်မှာ သေချာပြီလား?", [
      { text: "မဖျက်ပါ", style: "cancel" },
      {
        text: "ဖျက်မည်",
        style: "destructive",
        onPress: () => {
          try {
            db.runSync(`DELETE FROM subject_payments WHERE id = ?`, [id]);
            loadStudentDetails();
            Alert.alert("အောင်မြင်ပါသည် 🎉", "ဖျက်ပြီးပါပြီ!");
          } catch (error) {
            Alert.alert("Error", "ဖျက်၍မရပါ။");
          }
        },
      },
    ]);
  };

  // 🗑️ ပွဲ မှတ်တမ်း ပယ်ဖျက်ရန်
  const handleDeleteEvent = (id: number) => {
    Alert.alert("သတိပေးချက် ⚠️", "ဤပွဲ မှတ်တမ်းကို ဖျက်မှာ သေချာပြီလား?", [
      { text: "မဖျက်ပါ", style: "cancel" },
      {
        text: "ဖျက်မည်",
        style: "destructive",
        onPress: () => {
          try {
            db.runSync(`DELETE FROM event_payments WHERE id = ?`, [id]);
            loadStudentDetails();
            Alert.alert("အောင်မြင်ပါသည် 🎉", "ဖျက်ပြီးပါပြီ!");
          } catch (error) {
            Alert.alert("Error", "ဖျက်၍မရပါ။");
          }
        },
      },
    ]);
  };

  const saveToGallery = async () => {
    try {
      if (!viewShotRef.current) {
        Alert.alert("သတိပေးချက်", "ပြေစာပုံ မပေါ်သေးပါ။ ခေတ္တစောင့်ပြီး ပြန်လည်စမ်းသပ်ပါ။");
        return;
      }

      // ပြေစာကို ဓာတ်ပုံအဖြစ် အရင် capture လုပ်ခြင်း
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });

      let saved = false;
      try {
        // ဖုန်း Gallery အသုံးပြုခွင့် တောင်းဆိုခြင်း
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.granted || permission.status === 'granted') {
          await MediaLibrary.createAssetAsync(uri);
          saved = true;
          Alert.alert("အောင်မြင်ပါသည် 🎉", "ပြေစာပုံကို ဖုန်း Gallery ထဲသို့ သိမ်းဆည်းပြီးပါပြီ!");
          return;
        }
      } catch (mediaErr) {
        console.warn("Direct gallery access restricted (e.g. Expo Go limitation):", mediaErr);
      }

      // Expo Go (Android 13+) သို့မဟုတ် Gallery Permission မရနိုင်သည့်အခါ Phone ရဲ့ Save/Share စနစ်ဖြင့် သိမ်းခွင့်ပေးခြင်း
      if (!saved) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: 'ပြေစာပုံကို သိမ်းဆည်းရန် (သို့) မျှဝေရန်',
            mimeType: 'image/png',
            UTI: 'image/png',
          });
        } else {
          Alert.alert("သတိပေးချက်", "ဖုန်း Gallery ထဲသို့ တိုက်ရိုက်သိမ်းဆည်းခွင့် (Permission) မရရှိပါ။ ဖုန်း Setting ထဲတွင် ခွင့်ပြုပေးပါ!");
        }
      }
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error?.message || "ပုံသိမ်းဆည်း၍ မရပါ။");
    }
  };

  const captureAndShare = async () => {
    try {
      if (!viewShotRef.current) return;
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { dialogTitle: 'ပြေစာကို မျှဝေရန်' });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "ပြေစာ ထုတ်လုပ်၍ မရပါ။");
    }
  };

  const showReceipt = (item: any, type: 'Subject' | 'Event') => {
    const titleName = item.title || (type === 'Subject' ? item.subject_name : item.event_name);
    setReceiptData({
      id: item.id,
      title: titleName,
      payment_amount: item.payment_amount,
      payment_date: item.payment_date,
      payment_id: item.payment_id,
      status: item.status,
      type,
    });
    setReceiptVisible(true);
  };

  if (!student) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;

  return (
    <PaperProvider theme={myTheme}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* ----------- ကျောင်းသား ကိုယ်ရေးအချက်အလက် ကတ် ----------- */}
        <Card style={styles.profileCard}>
          <Card.Content style={{ paddingTop: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar.Text 
                size={54}
                label={student.name ? student.name.substring(0, 2) : 'ST'} 
                style={{ backgroundColor: '#059669' }} 
                labelStyle={{ fontFamily: FONTS.bold, fontSize: 20, color: '#FFFFFF' }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: '#059669', lineHeight: 25 }}>
                  {student.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={15} color="#6B7280" />
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#6B7280' }}>
                    ခုံနံပါတ်: {student.roll_number || 'မရှိပါ'}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={{ marginVertical: 14, backgroundColor: '#E5E7EB' }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="phone" size={18} color="#059669" />
              <Text style={styles.infoText}>ဖုန်း: {student.phone || 'မရှိပါ'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <MaterialCommunityIcons name="email" size={18} color="#059669" />
              <Text style={styles.infoText}>အီးမေးလ်: {student.email || 'မရှိပါ'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#059669" />
              <Text style={styles.infoText}>လိပ်စာ: {student.address || 'မရှိပါ'}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* ----------- ၁။ ဘာသာရပ် ဝယ်ယူမှု မှတ်တမ်း ----------- */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#059669" />
          <Text variant="titleLarge" style={[styles.sectionTitle, { marginBottom: 0 }]}>ဘာသာရပ် ဝယ်ယူမှုများ</Text>
        </View>
        {subjects.length === 0 ? (
          <Text style={styles.emptyText}>ဝယ်ယူထားသော ဘာသာရပ် မရှိသေးပါ။</Text>
        ) : (
          subjects.map((sub, index) => (
            <Card key={sub.id || index} style={styles.listCard}>
              <Card.Content style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{sub.subject_name}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    ရက်စွဲ: {sub.payment_date}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialCommunityIcons 
                      name={sub.status === 'Paid' ? "check-circle" : "close-circle"} 
                      size={14} 
                      color={sub.status === 'Paid' ? '#10B981' : '#EF4444'} 
                    />
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: sub.status === 'Paid' ? '#10B981' : '#EF4444' }}>
                      {sub.status === 'Paid' ? `Paid (ID: ${sub.payment_id})` : 'Unpaid (ငွေမချေသေးပါ)'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  {sub.status === 'Paid' ? (
                    <>
                      <Text style={styles.price}>{sub.payment_amount} ကျပ်</Text>
                      <TouchableOpacity onPress={() => showReceipt(sub, 'Subject')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                        <MaterialCommunityIcons name="receipt-text-outline" size={14} color="#059669" />
                        <Text style={styles.receiptText}>ပြေစာကြည့်မည်</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Button 
                      mode="contained" 
                      buttonColor="#10B981" 
                      onPress={() => handleMakePayment(sub, 'Subject')} 
                      compact 
                      icon="check-circle"
                    >
                      ငွေချေမည်
                    </Button>
                  )}
                  <IconButton icon="delete" size={18} iconColor="#EF4444" style={{ margin: 0, marginTop: 4 }} onPress={() => handleDeleteSubject(sub.id)} />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
        <Button mode="contained" icon="plus" style={styles.addButton} onPress={() => setSubjectModalVisible(true)}>
          ဘာသာရပ် စာရင်းသွင်းရန်
        </Button>

        <Divider style={styles.divider} />

        {/* ----------- ၂။ ပွဲ (Events) စာရင်းသွင်း/ငွေသွင်း မှတ်တမ်း ----------- */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <MaterialCommunityIcons name="calendar-star" size={22} color="#EA580C" />
          <Text variant="titleLarge" style={[styles.sectionTitle, { marginBottom: 0 }]}>ပွဲ ငွေသွင်း မှတ်တမ်း</Text>
        </View>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>ငွေသွင်းထားသော ပွဲ မရှိသေးပါ။</Text>
        ) : (
          events.map((ev, index) => (
            <Card key={ev.id || index} style={styles.listCard}>
              <Card.Content style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: '#EA580C' }]}>{ev.event_name}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    ရက်စွဲ: {ev.payment_date}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialCommunityIcons 
                      name={ev.status === 'Paid' ? "check-circle" : "close-circle"} 
                      size={14} 
                      color={ev.status === 'Paid' ? '#10B981' : '#EF4444'} 
                    />
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: ev.status === 'Paid' ? '#10B981' : '#EF4444' }}>
                      {ev.status === 'Paid' ? `Paid (ID: ${ev.payment_id})` : 'Unpaid (ငွေမချေသေးပါ)'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  {ev.status === 'Paid' ? (
                    <>
                      <Text style={styles.price}>{ev.payment_amount} ကျပ်</Text>
                      <TouchableOpacity onPress={() => showReceipt(ev, 'Event')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                        <MaterialCommunityIcons name="receipt-text-outline" size={14} color="#EA580C" />
                        <Text style={[styles.receiptText, { color: '#EA580C' }]}>ပြေစာကြည့်မည်</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Button 
                      mode="contained" 
                      buttonColor="#EA580C" 
                      onPress={() => handleMakePayment(ev, 'Event')} 
                      compact 
                      icon="check-circle"
                    >
                      ငွေချေမည်
                    </Button>
                  )}
                  <IconButton icon="delete" size={18} iconColor="#EF4444" style={{ margin: 0, marginTop: 4 }} onPress={() => handleDeleteEvent(ev.id)} />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
        <Button 
          mode="contained" 
          icon="plus" 
          buttonColor="#EA580C" 
          style={styles.addButton} 
          onPress={() => setEventModalVisible(true)}
        >
          ပွဲ စာရင်းသွင်းရန်
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ================= ၁။ ဘာသာရပ် စာရင်းသွင်းရန် (Booking) Modal ================= */}
      <Modal visible={subjectModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F0FDF4' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#059669' }}>ဘာသာရပ် စာရင်းသွင်းရန်</Text>
            <IconButton icon="close" size={24} iconColor="#EF4444" onPress={() => setSubjectModalVisible(false)} />
          </View>
          <View style={{ padding: 20 }}>
            <Text style={{ marginBottom: 10, color: '#374151' }}>တက်ရောက်လိုသော ဘာသာရပ်ကို ရွေးချယ်ပါ -</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {availableSubjects.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontFamily: FONTS.regular }}>ဘာသာရပ်များ မရှိသေးပါ။</Text>
                </View>
              ) : (
                availableSubjects.map((sub) => (
                  <Chip key={sub.id} selected={subjectName === sub.name} onPress={() => setSubjectName(sub.name)}
                    style={{ backgroundColor: subjectName === sub.name ? '#059669' : '#E5E7EB' }}
                    textStyle={{ color: subjectName === sub.name ? 'white' : 'black' }}>
                    {sub.name} ({sub.price} ကျပ်)
                  </Chip>
                ))
              )}
            </View>
            <Button mode="contained" onPress={handleBookSubject} disabled={!subjectName} style={{ marginTop: 10 }}>
              စာရင်းသွင်းမည် (Booking)
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= ၂။ ပွဲ (Event) စာရင်းသွင်းရန် (Booking) Modal ================= */}
      <Modal visible={eventModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFF7ED' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#EA580C' }}>ပွဲ (Event) စာရင်းသွင်းရန်</Text>
            <IconButton icon="close" size={24} iconColor="#EF4444" onPress={() => setEventModalVisible(false)} />
          </View>
          <View style={{ padding: 20 }}>
            <Text style={{ marginBottom: 10, color: '#374151' }}>ပါဝင်လိုသော ပွဲကို ရွေးချယ်ပါ -</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {availableEvents.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontFamily: FONTS.regular }}>ပွဲများ မရှိသေးပါ။</Text>
                </View>
              ) : (
                availableEvents.map((ev) => (
                  <Chip key={ev.id} selected={eventName === ev.name} onPress={() => setEventName(ev.name)}
                    style={{ backgroundColor: eventName === ev.name ? '#EA580C' : '#E5E7EB' }}
                    textStyle={{ color: eventName === ev.name ? 'white' : 'black' }}>
                    {ev.name} ({ev.price} ကျပ်)
                  </Chip>
                ))
              )}
            </View>
            <Button mode="contained" buttonColor="#EA580C" onPress={handleBookEvent} disabled={!eventName} style={{ marginTop: 10 }}>
              ပွဲ စာရင်းသွင်းမည် (Booking)
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= ၃။ KPay စတိုင် ပြေစာ (Receipt) Modal ================= */}
      <Modal visible={receiptVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.receiptContainer}>
            <View ref={viewShotRef} style={styles.slipArea} collapsable={false}>
              <View style={styles.slipHeader}>
                <Image 
                  source={require('../../../assets/images/logo.png')} 
                  style={styles.slipLogo} 
                  resizeMode="contain" 
                />
                <Text style={styles.slipSuccessText}>ငွေသွင်းခြင်း အောင်မြင်ပါသည်</Text>
                <Text style={styles.slipAmount}>{receiptData?.payment_amount} MMK</Text>
              </View>
              <View style={styles.dashLine} />
              <View style={styles.slipDetailRow}><Text style={styles.slipLabel}>ကျောင်းသားအမည်</Text><Text style={styles.slipValue}>{student.name}</Text></View>
              <View style={styles.slipDetailRow}><Text style={styles.slipLabel}>အမျိုးအစား</Text><Text style={styles.slipValue}>{receiptData?.type === 'Subject' ? 'ဘာသာရပ်' : 'ပွဲ'}</Text></View>
              <View style={styles.slipDetailRow}><Text style={styles.slipLabel}>အကြောင်းအရာ</Text><Text style={styles.slipValue}>{receiptData?.title}</Text></View>
              <View style={styles.slipDetailRow}><Text style={styles.slipLabel}>Transaction ID</Text><Text style={styles.slipValue}>{receiptData?.payment_id}</Text></View>
              <View style={styles.slipDetailRow}><Text style={styles.slipLabel}>ရက်စွဲ</Text><Text style={styles.slipValue}>{receiptData?.payment_date}</Text></View>
              <View style={styles.dashLine} />
              <Text style={{ fontFamily: FONTS.regular, textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 10 }}>ထွန်း(Htun) မှ ဖန်တီးပြုလုပ်သည်။</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, alignItems: 'center' }}>
              <Button mode="outlined" onPress={() => setReceiptVisible(false)} style={{ flex: 1 }}>ပိတ်မည်</Button>
              <Button mode="contained" icon="download" onPress={saveToGallery} style={{ flex: 1.3 }} buttonColor="#10B981">Save PNG</Button>
              <IconButton icon="share-variant" size={20} iconColor="#059669" onPress={captureAndShare} style={{ margin: 0 }} />
            </View>
          </View>
        </View>
      </Modal>

    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F0FDF4', flexGrow: 1 },
  profileCard: { marginBottom: 20, backgroundColor: '#FFFFFF', elevation: 3, borderRadius: 16 },
  infoText: { fontFamily: FONTS.regular, fontSize: 16, marginTop: 8, color: '#374151' },
  sectionTitle: { fontFamily: FONTS.bold, color: '#111827', marginBottom: 10 },
  listCard: { marginBottom: 10, backgroundColor: '#FFFFFF', elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontFamily: FONTS.bold, fontSize: 16, color: '#4F46E5', marginBottom: 4 },
  price: { fontFamily: FONTS.bold, fontSize: 16, color: '#10B981' },
  receiptText: { fontFamily: FONTS.medium, fontSize: 12, color: '#059669', textDecorationLine: 'underline', marginTop: 5 },
  emptyText: { fontFamily: FONTS.regular, fontStyle: 'italic', color: '#6B7280', marginBottom: 10 },
  addButton: { marginTop: 5, borderRadius: 8 },
  divider: { marginVertical: 25, backgroundColor: '#D1D5DB' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  receiptContainer: { width: '85%', backgroundColor: '#F3F4F6', borderRadius: 15, padding: 15 },
  slipArea: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, elevation: 2 },
  slipHeader: { alignItems: 'center', marginBottom: 15 },
  slipLogo: { width: 140, height: 140 },
  slipSuccessText: { fontFamily: FONTS.bold, color: '#10B981', fontSize: 16, marginTop: 10 },
  slipAmount: { fontFamily: FONTS.bold, fontSize: 24, color: '#111827', marginTop: 5 },
  dashLine: { height: 1, width: '100%', borderColor: '#D1D5DB', borderWidth: 1, borderStyle: 'dashed', marginVertical: 15 },
  slipDetailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 10, 
    gap: 10,
  },
  slipLabel: { 
    fontFamily: FONTS.regular, 
    color: '#6B7280', 
    fontSize: 14, 
    flexShrink: 0,
  },
  slipValue: { 
    fontFamily: FONTS.bold, 
    color: '#111827', 
    fontSize: 14, 
    flex: 1, 
    textAlign: 'right',
  },
});