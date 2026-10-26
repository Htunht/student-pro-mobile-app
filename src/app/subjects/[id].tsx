import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, Divider, Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import { FONTS, paperFonts } from '../../theme/fonts';

const myTheme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  colors: { ...MD3LightTheme.colors, primary: '#059669', background: '#F0FDF4' },
};

interface EnrolledStudent {
  student_name: string;
  roll_number: string;
  phone: string;
  payment_amount: number;
  payment_date: string;
  status?: string;
  payment_id?: string;
}

export default function SubjectDetailScreen() {
  // ၁။ ရှေ့အခန်းကနေ အိတ်ကပ်ထဲ ထည့်သယ်လာတဲ့ အချက်အလက်တွေကို ဖမ်းယူမယ်
  const { id, name, price } = useLocalSearchParams<{ id: string; name: string; price: string }>(); 
  
  // ၂။ ဒီဘာသာရပ်ကို ဝယ်ထားတဲ့ ကျောင်းသားစာရင်း မှတ်ထားမယ့် နေရာ
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [paidIncome, setPaidIncome] = useState(0);
  const [unpaidIncome, setUnpaidIncome] = useState(0);
  const [totalExpectedIncome, setTotalExpectedIncome] = useState(0);

  const db = SQLite.openDatabaseSync('notedbook.db');

  useFocusEffect(
    useCallback(() => {
      if (name) {
        loadEnrolledStudents();
      }
    }, [name])
  );

  const loadEnrolledStudents = () => {
    try {
      // ၃။ 🔥 INNER JOIN (ကျောင်းသား Table နဲ့ ငွေသွင်း Table ကို ချိတ်ဆက်ခြင်း)
      const query = `
        SELECT 
          students.name AS student_name, 
          students.roll_number, 
          students.phone,
          subject_payments.payment_amount, 
          subject_payments.payment_date,
          subject_payments.status,
          subject_payments.payment_id 
        FROM subject_payments
        INNER JOIN students ON subject_payments.student_id = students.id
        WHERE subject_payments.subject_name = ?
        ORDER BY subject_payments.id DESC
      `;
      
      const subjectName = Array.isArray(name) ? name[0] : (name || '');
      const studentsData = db.getAllSync<EnrolledStudent>(query, [subjectName]);
      setEnrolledStudents(studentsData);

      // 💡 ၁။ အမှန်တကယ် လက်ရှိရရှိငွေ (Paid) တွက်ချက်ခြင်း
      const paidStudents = studentsData.filter(s => s.status === 'Paid');
      const paid = paidStudents.reduce((sum, student) => sum + (Number(student.payment_amount) || 0), 0);
      setPaidIncome(paid);

      // 💡 ၂။ လက်ရှိ ရရန်ကျန်ငွေ (Unpaid) တွက်ချက်ခြင်း
      const unpaidStudents = studentsData.filter(s => s.status !== 'Paid');
      const unpaid = unpaidStudents.reduce((sum, student) => sum + (Number(student.payment_amount) || Number(price) || 0), 0);
      setUnpaidIncome(unpaid);

      // 💡 ၃။ စုစုပေါင်း မျှော်မှန်းဝင်ငွေ (Total Expected Income)
      setTotalExpectedIncome(paid + unpaid);

    } catch (error) {
      console.log("ကျောင်းသားစာရင်း ဆွဲထုတ်ရာတွင် အမှားဖြစ်နေပါသည်:", error);
    }
  };

  return (
    <PaperProvider theme={myTheme}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* ----------- ဘာသာရပ် အချက်အလက် ကတ်ကြီး ----------- */}
        <Card style={styles.headerCard}>
          <Card.Content style={{ alignItems: 'center' }}>
            <Avatar.Icon size={64} icon="book-open-page-variant" style={{ backgroundColor: '#059669', marginBottom: 10 }} />
            <Text variant="headlineSmall" style={styles.titleText}>{name}</Text>
            <Text style={styles.priceText}>သတ်မှတ်စျေးနှုန်း: {price} ကျပ်</Text>
            
            {/* ၄ ခုပြ စာရင်းဇယား Grid (ကျောင်းသားဦးရေ, စုစုပေါင်းဝင်ငွေ, Paid ငွေ, Unpaid ငွေ) */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ကျောင်းသားဦးရေ</Text>
                <Text style={styles.statValue}>{enrolledStudents.length} ယောက်</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>စုစုပေါင်း ဝင်ငွေ</Text>
                <Text style={[styles.statValue, { color: '#4F46E5' }]}>{totalExpectedIncome} ကျပ်</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 }]}>
                <Text style={[styles.statLabel, { color: '#047857' }]}>Paid ငွေ</Text>
                <Text style={[styles.statValue, { color: '#059669' }]}>{paidIncome} ကျပ်</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}>
                <Text style={[styles.statLabel, { color: '#B91C1C' }]}>Unpaid ငွေ</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{unpaidIncome} ကျပ်</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* ----------- စာရင်းသွင်းထားသော ကျောင်းသားများ ----------- */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
          <MaterialCommunityIcons name="account-school" size={24} color="#059669" />
          <Text variant="titleLarge" style={[styles.sectionTitle, { marginBottom: 0 }]}>ဘာသာရပ် တက်ရောက်မည့် ကျောင်းသားစာရင်း</Text>
        </View>
        
        {enrolledStudents.length === 0 ? (
          <Text style={styles.emptyText}>ဤဘာသာရပ်ကို စာရင်းပေးထားသော ကျောင်းသား မရှိသေးပါ။</Text>
        ) : (
          enrolledStudents.map((student, index) => (
            <Card key={index} style={[styles.studentCard, { borderLeftWidth: 5, borderLeftColor: student.status === 'Paid' ? '#10B981' : '#EF4444' }]}>
              <Card.Title
                title={student.student_name}
                subtitle={`ခုံနံပါတ်: ${student.roll_number || 'မရှိပါ'} | ဖုန်း: ${student.phone || 'မပါ'}`}
                left={(props) => (
                  <Avatar.Text 
                    {...props} 
                    label={(student.student_name || '??').substring(0, 2)} 
                    style={{ backgroundColor: student.status === 'Paid' ? '#059669' : '#EF4444' }} 
                  />
                )}
              />
              <Card.Content style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>ရက်စွဲ: {student.payment_date || '-'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialCommunityIcons 
                      name={student.status === 'Paid' ? "check-circle" : "close-circle"} 
                      size={14} 
                      color={student.status === 'Paid' ? '#10B981' : '#EF4444'} 
                    />
                    <Text style={{ fontFamily: FONTS.bold, color: student.status === 'Paid' ? '#10B981' : '#EF4444', fontSize: 13 }}>
                      {student.status === 'Paid' ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.paidAmount, { color: student.status === 'Paid' ? '#10B981' : '#EF4444' }]}>
                  {student.status === 'Paid' ? `${student.payment_amount} ကျပ်` : `${price} ကျပ်`}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}

      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F0FDF4', flexGrow: 1 },
  headerCard: { backgroundColor: '#FFFFFF', elevation: 3, borderRadius: 15 },
  titleText: { fontFamily: FONTS.bold, color: '#111827', textAlign: 'center' },
  priceText: { fontFamily: FONTS.medium, color: '#4B5563', marginTop: 5, textAlign: 'center', fontSize: 16 },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    width: '100%', 
    marginTop: 18,
    rowGap: 10,
  },
  statBox: { 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    paddingVertical: 12, 
    paddingHorizontal: 6, 
    borderRadius: 12, 
    width: '48%' 
  },
  statLabel: { fontFamily: FONTS.regular, fontSize: 12, color: '#6B7280', marginBottom: 5, textAlign: 'center' },
  statValue: { fontFamily: FONTS.bold, fontSize: 16, color: '#111827', textAlign: 'center' },
  divider: { marginVertical: 25, backgroundColor: '#D1D5DB' },
  sectionTitle: { fontFamily: FONTS.bold, color: '#111827', marginBottom: 15 },
  studentCard: { marginBottom: 12, backgroundColor: '#FFFFFF', elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 5, paddingRight: 4 },
  paidAmount: { fontFamily: FONTS.bold, fontSize: 16, textAlign: 'right', flexShrink: 0 },
  emptyText: { fontFamily: FONTS.regular, fontStyle: 'italic', color: '#6B7280', textAlign: 'center', marginTop: 10 }
});