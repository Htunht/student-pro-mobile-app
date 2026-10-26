import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Provider as PaperProvider, TextInput, Button, Text, MD3LightTheme, Card, Divider, IconButton } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { FONTS, paperFonts } from '../../theme/fonts';

const myTheme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  colors: { ...MD3LightTheme.colors, primary: '#059669', background: '#F0FDF4', surface: '#FFFFFF' },
};

interface Subject {
  id: number;
  name: string;
  price: number;
}

export default function SubjectsIndexScreen() {
  const router = useRouter();
  
  const [subjectName, setSubjectName] = useState('');
  const [subjectPrice, setSubjectPrice] = useState('');
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  
  // 🔥 အသစ်ထည့်လိုက်တဲ့ State: ဘယ်ကောင်ကို ပြင်နေတာလဲ မှတ်ထားဖို့
  const [editingId, setEditingId] = useState<number | null>(null); 

  const db = SQLite.openDatabaseSync('notedbook.db');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = () => {
    try {
      const allSubjects = db.getAllSync<Subject>(`SELECT * FROM subjects ORDER BY id DESC`);
      setSubjectsList(allSubjects);
    } catch (error) {
      console.log("ဘာသာရပ်များ ဆွဲထုတ်ရာတွင် အမှားဖြစ်နေပါသည်: ", error);
    }
  };

  // 📝 ဖန်တီး/ပြင်ဆင် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင်
  const handleSaveSubject = () => {
    if (subjectName.trim() === '' || subjectPrice.trim() === '') {
      Alert.alert("သတိပေးချက် ⚠️", "ဘာသာရပ်အမည်နှင့် စျေးနှုန်းကို အပြည့်အစုံထည့်ပါ!");
      return;
    }

    try {
      if (editingId) {
        // ID ရှိနေရင် ဒါဟာ Update (ပြင်ဆင်ခြင်း) ပဲ
        db.runSync(
          `UPDATE subjects SET name = ?, price = ? WHERE id = ?`,
          [subjectName, parseFloat(subjectPrice), editingId]
        );
        Alert.alert("အောင်မြင်ပါသည် 🎉", "ဘာသာရပ်ကို ပြင်ဆင်ပြီးပါပြီ!");
      } else {
        // ID မရှိရင် ဒါဟာ Create (အသစ်ဖန်တီးခြင်း) ပဲ
        db.runSync(
          `INSERT INTO subjects (name, price) VALUES (?, ?)`,
          [subjectName, parseFloat(subjectPrice)]
        );
        Alert.alert("အောင်မြင်ပါသည် 🎉", "ဘာသာရပ်အသစ် ဖန်တီးပြီးပါပြီ!");
      }
      
      // ဖောင်ကို ပြန်ရှင်းမယ်
      setSubjectName('');
      setSubjectPrice('');
      setEditingId(null); // ပြင်ဆင်နေတဲ့ ID ကို ဖျောက်မယ်
      
      loadSubjects();
      
    } catch (error) {
      Alert.alert("အမှားအယွင်း ❌", "ဒေတာ သိမ်းဆည်း၍ မရပါ။");
    }
  };

  // ✏️ ပြင်ဆင်ရန် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင် (ဖောင်ထဲကို ဒေတာတွေ ပြန်ဖြည့်ပေးမယ်)
  const handleEdit = (subject: Subject) => {
    setSubjectName(subject.name);
    setSubjectPrice(subject.price.toString());
    setEditingId(subject.id); // "ငါတော့ ဘယ် ID ကို ပြင်နေပြီ" လို့ မှတ်ထားမယ်
  };

  // 🗑️ ဖျက်ရန် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင်
  const handleDelete = (id: number) => {
    Alert.alert(
      "သတိပေးချက် ⚠️",
      "ဤဘာသာရပ်ကို တကယ်ဖျက်မှာ သေချာပြီလား?",
      [
        { text: "မဖျက်ပါ", style: "cancel" },
        { 
          text: "ဖျက်မည်", 
          style: "destructive",
          onPress: () => {
            try {
              db.runSync(`DELETE FROM subjects WHERE id = ?`, [id]);
              loadSubjects();
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              <MaterialCommunityIcons name={editingId ? "pencil-box-outline" : "book-plus-outline"} size={26} color="#059669" />
              <Text variant="headlineSmall" style={[styles.title, { marginBottom: 0 }]}>
                {editingId ? "ဘာသာရပ် ပြင်ဆင်ရန်" : "ဘာသာရပ် ဖန်တီးရန်"}
              </Text>
            </View>

            <Card style={styles.formCard}>
              <Card.Content>
                <TextInput label="ဘာသာရပ် အမည်" value={subjectName} onChangeText={setSubjectName} mode="outlined" style={styles.input} />
                <TextInput label="စျေးနှုန်း" value={subjectPrice} onChangeText={setSubjectPrice} mode="outlined" keyboardType="numeric" style={styles.input} />
                
                {/* ခလုတ်လေးက State ပေါ်မူတည်ပြီး ပြောင်းသွားမယ် */}
                <Button mode="contained" onPress={handleSaveSubject} style={styles.button}>
                  {editingId ? "ပြင်ဆင်မှုကို သိမ်းမည်" : "ဖန်တီးမည်"}
                </Button>
                
                {/* ပြင်ဆင်နေတုန်း Cancel ပြန်လုပ်ချင်ရင် (ဖောင်ကို Reset ချချင်ရင်) */}
                {editingId && (
                  <Button mode="text" onPress={() => { setSubjectName(''); setSubjectPrice(''); setEditingId(null); }} style={{ marginTop: 5 }}>
                    မပြင်တော့ပါ (Cancel)
                  </Button>
                )}
              </Card.Content>
            </Card>

            <Divider style={{ marginVertical: 20 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
              <MaterialCommunityIcons name="book-multiple" size={20} color="#059669" />
              <Text variant="titleMedium" style={{ fontFamily: FONTS.bold, color: '#111827' }}>
                ဖန်တီးထားသော ဘာသာရပ်များ
              </Text>
            </View>
            
            {subjectsList.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: '#6B7280' }}>ဘာသာရပ်များ မရှိသေးပါ။</Text>
            ) : (
              subjectsList.map((sub) => (
                <Card key={sub.id} style={styles.listCard} onPress={() => router.push(`/subjects/${sub.id}?name=${sub.name}&price=${sub.price}`)}>
                  <Card.Content style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: '#059669' }}>{sub.name}</Text>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 16, color: '#374151' }}>{sub.price} ကျပ်</Text>
                    </View>
                    
                    {/* 🔥 အသစ်တပ်လိုက်တဲ့ Edit နဲ့ Delete ခလုတ်တွေ */}
                    <View style={styles.actionButtons}>
                      <IconButton icon="pencil" size={20} iconColor="#4F46E5" onPress={() => handleEdit(sub)} />
                      <IconButton icon="delete" size={20} iconColor="#EF4444" onPress={() => handleDelete(sub.id)} />
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F0FDF4' },
  title: { fontFamily: FONTS.bold, marginBottom: 20, color: '#059669', textAlign: 'center' },
  formCard: { backgroundColor: '#FFFFFF', elevation: 2 },
  input: { marginBottom: 15, backgroundColor: '#FFFFFF' },
  button: { marginTop: 5, borderRadius: 8, paddingVertical: 5 },
  listCard: { marginBottom: 10, backgroundColor: '#FFFFFF', elevation: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionButtons: { flexDirection: 'row' }
});