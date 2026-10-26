import React, { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { StyleSheet, ScrollView, Alert, View, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Provider as PaperProvider, TextInput, Button, Text, MD3LightTheme, Card, Avatar, Divider, Chip, FAB, IconButton, Searchbar } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite'; 
import { FONTS, paperFonts } from '../theme/fonts';

const myTheme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#059669', 
    background: '#F0FDF4', 
    surface: '#FFFFFF', 
    onSurface: '#111827', 
  },
};

interface Student {
  id: number;
  roll_number: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  subject_count?: number;
  event_count?: number;
}

export default function App() {
  // ဖောင်အတွက် ယာယီ မှတ်ဉာဏ်များ
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  
  // ဖောင် (Modal) ကို အဖွင့်/အပိတ် လုပ်မယ့် ခလုတ် State
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  
  // 🔥 အသစ်ထည့်လိုက်တဲ့ State: ဘယ်ကျောင်းသားကို ပြင်နေတာလဲ မှတ်ထားဖို့
  const [editingId, setEditingId] = useState<number | null>(null);

  const filteredStudents = studentsList.filter((student) => {
    const query = searchQuery.trim().toLowerCase();
    const matchName = (student.name || '').toLowerCase().includes(query);
    const matchRoll = student.roll_number ? student.roll_number.toLowerCase().includes(query) : false;
    return matchName || matchRoll;
  });
  const db = SQLite.openDatabaseSync('notedbook.db');

  const router = useRouter();
// 🛠️ Database ကို အခန်းချဲ့မယ့် ကန်ထရိုက်တာ (Upgrade Function)
  const upgradeDatabase = () => {
    try {
      // ဘာသာရပ် (Subjects) ငွေသွင်းမှတ်တမ်းအတွက် ကော်လံတိုးမယ်
      db.runSync(`ALTER TABLE subject_payments ADD COLUMN status TEXT DEFAULT 'Unpaid'`);
      db.runSync(`ALTER TABLE subject_payments ADD COLUMN payment_id TEXT`);
      
      // ပွဲ (Events) ငွေသွင်းမှတ်တမ်းအတွက် ကော်လံတိုးမယ်
      db.runSync(`ALTER TABLE event_payments ADD COLUMN status TEXT DEFAULT 'Unpaid'`);
      db.runSync(`ALTER TABLE event_payments ADD COLUMN payment_id TEXT`);
      
      console.log("🎉 Database အောင်မြင်စွာ Upgrade လုပ်ပြီးပါပြီ!");
    } catch (error) {
      // 💡 ကော်လံတွေ တိုးပြီးသား ဖြစ်နေရင် Error တက်တတ်လို့ try-catch နဲ့ အသာလေး ဖုံးထားလိုက်တာ
      console.log("✅ Database က Upgrade လုပ်ပြီးသားပါ (သို့) အဆင်သင့်ဖြစ်နေပါပြီ။");
    }
  };

  useFocusEffect(
    useCallback(() => {
      upgradeDatabase();
      loadStudents();
    }, [])
  );

  const loadStudents = () => {
    try {
      // 🔥 Subquery အစွမ်း (ကျောင်းသားတွေဆွဲထုတ်ရင်း သူတို့ရဲ့ ဘာသာရပ်နဲ့ ပွဲအရေအတွက်ကိုပါ တစ်ခါတည်း ရေတွက်ခိုင်းတာ)
      const query = `
        SELECT 
          students.*,
          (SELECT COUNT(*) FROM subject_payments WHERE subject_payments.student_id = students.id) AS subject_count,
          (SELECT COUNT(*) FROM event_payments WHERE event_payments.student_id = students.id) AS event_count
        FROM students 
        ORDER BY 
          CASE WHEN roll_number IS NULL OR trim(roll_number) = '' THEN 1 ELSE 0 END,
          CAST(roll_number AS INTEGER) ASC,
          roll_number ASC
      `;
      
      const allStudents = db.getAllSync<Student>(query);
      setStudentsList(allStudents);
    } catch (error) {
      console.log("ဒေတာ ဆွဲထုတ်ရာတွင် အမှားဖြစ်နေပါသည်: ", error);
    }
  };

  // 📝 ဖန်တီး/ပြင်ဆင် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင်
  const handleSaveStudent = () => {
    if (name.trim() === '') {
      Alert.alert("သတိပေးချက်", "ကျောင်းသားအမည် မဖြစ်မနေ ထည့်ရန်လိုပါသည်!");
      return;
    }

    try {
      if (editingId) {
        // ID ရှိနေရင် ဒါဟာ Update (ပြင်ဆင်ခြင်း) ပဲ
        db.runSync(
          `UPDATE students SET roll_number = ?, name = ?, phone = ?, email = ?, address = ? WHERE id = ?`,
          [rollNumber, name, phone, email, address, editingId]
        );
        Alert.alert("အောင်မြင်ပါသည်", "ကျောင်းသားမှတ်တမ်း ပြင်ဆင်ပြီးပါပြီ!");
      } else {
        // ID မရှိရင် ဒါဟာ Create (အသစ်ဖန်တီးခြင်း) ပဲ
        db.runSync(
          `INSERT INTO students (roll_number, name, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
          [rollNumber, name, phone, email, address]
        );
        Alert.alert("အောင်မြင်ပါသည်", "ကျောင်းသားစာရင်း သိမ်းဆည်းပြီးပါပြီ!");
      }
      
      // ဖောင်ကို ပြန်ရှင်းမယ်
      setName(''); setRollNumber(''); setPhone(''); setEmail(''); setAddress('');
      setEditingId(null);
      setModalVisible(false);
      
      // ဧည့်ခန်း (Hero Section) ကို အသစ်ပြန်ခေါ်မယ်
      loadStudents();
      
    } catch (error) {
      Alert.alert("အမှားအယွင်း", "ဒေတာ သိမ်းဆည်း၍ မရပါ။");
    }
  };

  // ✏️ ပြင်ဆင်ရန် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင် (ဖောင်ထဲကို ဒေတာတွေ ပြန်ဖြည့်ပေးမယ်)
  const handleEdit = (student: Student) => {
    setName(student.name);
    setRollNumber(student.roll_number || '');
    setPhone(student.phone || '');
    setEmail(student.email || '');
    setAddress(student.address || '');
    setEditingId(student.id);
    setModalVisible(true);
  };

  // 🗑️ ဖျက်ရန် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင်
  const handleDelete = (id: number) => {
    Alert.alert(
      "သတိပေးချက်",
      "ဤကျောင်းသားမှတ်တမ်းကို တကယ်ဖျက်မှာ သေချာပြီလား?",
      [
        { text: "မဖျက်ပါ", style: "cancel" },
        { 
          text: "ဖျက်မည်", 
          style: "destructive",
          onPress: () => {
            try {
              // ကျောင်းသားနှင့် ဆက်စပ်သော အခကြေးငွေမှတ်တမ်းများကိုပါ ရှင်းထုတ်မည်
              db.runSync(`DELETE FROM subject_payments WHERE student_id = ?`, [id]);
              db.runSync(`DELETE FROM event_payments WHERE student_id = ?`, [id]);
              db.runSync(`DELETE FROM students WHERE id = ?`, [id]);
              loadStudents();
            } catch (error) {
              Alert.alert("အမှားအယွင်း", "ဖျက်၍မရပါ။");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={myTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
          
          {/* ---------------- ဧည့်ခန်း (Hero Section) ---------------- */}
          <ScrollView contentContainerStyle={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <MaterialCommunityIcons name="account-school" size={28} color="#059669" />
              <Text variant="headlineSmall" style={[styles.title, { marginBottom: 0 }]}>
                ကျောင်းသား မှတ်တမ်းများ
              </Text>
            </View>

            <Searchbar
              placeholder="နာမည် (သို့) ခုံနံပါတ် ရိုက်ထည့်ပါ..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={{ marginBottom: 15, backgroundColor: '#FFFFFF' }}
              iconColor="#059669"
            />

            {filteredStudents.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
                ကျောင်းသား မှတ်တမ်း မတွေ့ရှိပါ...
              </Text>
            ) : (
              filteredStudents.map((student) => (
                <Card 
                  key={student.id} 
                  style={styles.card}
                  onPress={() => {
                    router.navigate({
                      pathname: '/students/[id]',
                      params: { id: student.id },
                    });
                  }}
                >
                  <Card.Title
                    title={student.name}
                    subtitle={`ခုံနံပါတ်: ${student.roll_number || 'မရှိပါ'}`}
                    left={(props) => (
                      <Avatar.Text 
                        {...props} 
                        label={student.name ? student.name.substring(0, 2) : 'ST'} 
                        style={{ backgroundColor: '#059669' }} 
                      />
                    )}
                    right={() => (
                      <View style={styles.actionButtons}>
                        <IconButton icon="pencil" size={20} iconColor="#4F46E5" onPress={() => handleEdit(student)} />
                        <IconButton icon="delete" size={20} iconColor="#EF4444" onPress={() => handleDelete(student.id)} />
                      </View>
                    )}
                  />
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text variant="bodyMedium" style={{ marginTop: 10, marginBottom: 5 }}>ဝယ်ယူထားသော အခြေအနေ:</Text>
                    <View style={styles.chipContainer}>
                      <Chip icon="phone" style={{ backgroundColor: '#E0F2FE' }}>{student.phone || 'ဖုန်းမပါ'}</Chip>
                      <Chip icon="book-open-variant" style={styles.chip} textStyle={{ color: 'white' }}>Subjects: {student.subject_count ?? 0}</Chip>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
            
            {/* အောက်ခြေမှာ နေရာလွတ်လေး ချန်ထားမယ် (ခလုတ် မကွယ်အောင်လို့) */}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* ---------------- အပေါင်းလက္ခဏာ ခလုတ် (FAB) ---------------- */}
          <FAB
            icon="plus"
            style={styles.fab}
            color="white"
            onPress={() => {
              setEditingId(null);
              setName(''); setRollNumber(''); setPhone(''); setEmail(''); setAddress('');
              setModalVisible(true);
            }}
          />

          {/* ---------------- စာရင်းသွင်း/ပြင်ဆင်မယ့် ဖောင် (Modal) ---------------- */}
          <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F0FDF4' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              
              {/* Modal ရဲ့ ခေါင်းစဉ်နဲ့ ပိတ်မယ့် (X) ခလုတ် */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={editingId ? "account-edit" : "account-plus"} size={24} color="#059669" />
                  <Text variant="titleLarge" style={{ fontFamily: FONTS.bold, color: '#059669' }}>
                    {editingId ? "ကျောင်းသားမှတ်တမ်း ပြင်ဆင်ရန်" : "ကျောင်းသားအသစ် ထည့်ရန်"}
                  </Text>
                </View>
                <IconButton 
                  icon="close" 
                  size={24} 
                  iconColor="#EF4444" 
                  onPress={() => {
                    setModalVisible(false);
                    setEditingId(null);
                    setName(''); setRollNumber(''); setPhone(''); setEmail(''); setAddress('');
                  }} 
                />
              </View>

              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <TextInput label="ခုံနံပါတ် (Roll Number)" value={rollNumber} onChangeText={setRollNumber} mode="outlined" style={styles.input} activeOutlineColor="#059669" />
                <TextInput label="ကျောင်းသား အမည်" value={name} onChangeText={setName} mode="outlined" style={styles.input} activeOutlineColor="#059669" />
                <TextInput label="ဖုန်းနံပါတ်" value={phone} onChangeText={setPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} activeOutlineColor="#059669" />
                <TextInput label="အီးမေးလ်" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" style={styles.input} activeOutlineColor="#059669" />
                <TextInput label="လိပ်စာ" value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={3} style={styles.input} activeOutlineColor="#059669" />

                <Button mode="contained" onPress={handleSaveStudent} style={styles.button} contentStyle={{ paddingVertical: 8 }}>
                  {editingId ? "ပြင်ဆင်မှုကို သိမ်းမည်" : "စာရင်းသိမ်းမည်"}
                </Button>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>

        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontFamily: FONTS.bold,
    marginBottom: 20,
    color: '#059669',
  },
  card: {
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  cardContent: {
    paddingBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#4F46E5', 
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 70, // အောက်ခြေကပ်မနေအောင် အပေါ်သို့ မြှင့်တင်ထားခြင်း
    backgroundColor: '#059669', // မျက်စိအေးတဲ့ အစိမ်းရောင်
    borderRadius: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 15,
    borderRadius: 8,
    marginBottom: 40,
  }
});