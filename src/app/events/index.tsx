import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, ScrollView, Alert, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Provider as PaperProvider, TextInput, Button, Text, MD3LightTheme, Card, Divider, IconButton } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import { FONTS, paperFonts } from '../../theme/fonts';

// Events အတွက် သီးသန့် လိမ္မော်ရောင် Theme
const eventTheme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  colors: { ...MD3LightTheme.colors, primary: '#EA580C', background: '#FFF7ED', surface: '#FFFFFF' },
};

interface EventItem {
  id: number;
  name: string;
  price: number;
}

export default function EventsIndexScreen() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [eventPrice, setEventPrice] = useState('');
  
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  
  // 🔥 အသစ်ထည့်လိုက်တဲ့ State: ဘယ်ပွဲကို ပြင်နေတာလဲ မှတ်ထားဖို့
  const [editingId, setEditingId] = useState<number | null>(null);

  const db = SQLite.openDatabaseSync('notedbook.db');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    try {
      const allEvents = db.getAllSync<EventItem>(`SELECT * FROM events ORDER BY id DESC`);
      setEventsList(allEvents);
    } catch (error) {
      console.log("ပွဲများ ဆွဲထုတ်ရာတွင် အမှားဖြစ်နေပါသည်: ", error);
    }
  };

  // 📝 ဖန်တီး/ပြင်ဆင် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင်
  const handleSaveEvent = () => {
    if (eventName.trim() === '' || eventPrice.trim() === '') {
      Alert.alert("သတိပေးချက် ⚠️", "ပွဲအမည်နှင့် စျေးနှုန်းကို အပြည့်အစုံထည့်ပါ!");
      return;
    }

    try {
      if (editingId) {
        // ID ရှိနေရင် ဒါဟာ Update (ပြင်ဆင်ခြင်း) ပဲ
        db.runSync(
          `UPDATE events SET name = ?, price = ? WHERE id = ?`,
          [eventName, parseFloat(eventPrice), editingId]
        );
        Alert.alert("အောင်မြင်ပါသည် 🎉", "ပွဲကို ပြင်ဆင်ပြီးပါပြီ!");
      } else {
        // ID မရှိရင် ဒါဟာ Create (အသစ်ဖန်တီးခြင်း) ပဲ
        db.runSync(
          `INSERT INTO events (name, price) VALUES (?, ?)`,
          [eventName, parseFloat(eventPrice)]
        );
        Alert.alert("အောင်မြင်ပါသည် 🎉", "ပွဲအသစ် ဖန်တီးပြီးပါပြီ!");
      }
      
      // ဖောင်ကို ပြန်ရှင်းမယ်
      setEventName('');
      setEventPrice('');
      setEditingId(null);
      
      loadEvents();
      
    } catch (error) {
      Alert.alert("အမှားအယွင်း ❌", "ဒေတာ သိမ်းဆည်း၍ မရပါ။");
    }
  };

  // ✏️ ပြင်ဆင်ရန် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင်
  const handleEdit = (ev: EventItem) => {
    setEventName(ev.name);
    setEventPrice(ev.price.toString());
    setEditingId(ev.id);
  };

  // 🗑️ ဖျက်ရန် ခလုတ်နှိပ်ရင် အလုပ်လုပ်မယ့်ကောင်
  const handleDelete = (id: number) => {
    Alert.alert(
      "သတိပေးချက် ⚠️",
      "ဤပွဲကို တကယ်ဖျက်မှာ သေချာပြီလား?",
      [
        { text: "မဖျက်ပါ", style: "cancel" },
        { 
          text: "ဖျက်မည်", 
          style: "destructive",
          onPress: () => {
            try {
              // ပွဲနှင့် သက်ဆိုင်သော payment များကိုပါ ရှင်းထုတ်မည်
              db.runSync(`DELETE FROM event_payments WHERE event_name = (SELECT name FROM events WHERE id = ?)`, [id]);
              db.runSync(`DELETE FROM events WHERE id = ?`, [id]);
              loadEvents();
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
      <PaperProvider theme={eventTheme}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container}>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              <MaterialCommunityIcons name={editingId ? "pencil-box-outline" : "calendar-plus"} size={26} color="#EA580C" />
              <Text variant="headlineSmall" style={[styles.title, { marginBottom: 0 }]}>
                {editingId ? "ပွဲ ပြင်ဆင်ရန်" : "ပွဲများ ဖန်တီးရန်"}
              </Text>
            </View>

            <Card style={styles.formCard}>
              <Card.Content>
                <TextInput
                  label="ပွဲ အမည်"
                  value={eventName}
                  onChangeText={setEventName}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="စျေးနှုန်း"
                  value={eventPrice}
                  onChangeText={setEventPrice}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Button mode="contained" onPress={handleSaveEvent} style={styles.button}>
                  {editingId ? "ပြင်ဆင်မှုကို သိမ်းမည်" : "ဖန်တီးမည်"}
                </Button>
                
                {/* ပြင်ဆင်နေတုန်း Cancel ပြန်လုပ်ချင်ရင် */}
                {editingId && (
                  <Button mode="text" onPress={() => { setEventName(''); setEventPrice(''); setEditingId(null); }} style={{ marginTop: 5 }}>
                    မပြင်တော့ပါ (Cancel)
                  </Button>
                )}
              </Card.Content>
            </Card>

            <Divider style={{ marginVertical: 20 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#EA580C" />
              <Text variant="titleMedium" style={{ fontFamily: FONTS.bold, color: '#111827' }}>
                ကျင်းပမည့် ပွဲများ
              </Text>
            </View>
            
            {eventsList.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: '#6B7280' }}>ပွဲများ မရှိသေးပါ။ အသစ်ဖန်တီးပါ။</Text>
            ) : (
              eventsList.map((ev) => (
                <Card 
                  key={ev.id} 
                  style={styles.listCard}
                  onPress={() =>
                    router.navigate({
                      pathname: '/events/[id]',
                      params: { id: ev.id, name: ev.name, price: ev.price },
                    })
                  }
                >
                  <Card.Content style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: '#EA580C' }}>{ev.name}</Text>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 16, color: '#374151' }}>{ev.price} ကျပ်</Text>
                    </View>
                    
                    {/* 🔥 Edit နဲ့ Delete ခလုတ်များ */}
                    <View style={styles.actionButtons}>
                      <IconButton icon="pencil" size={20} iconColor="#4F46E5" onPress={() => handleEdit(ev)} />
                      <IconButton icon="delete" size={20} iconColor="#EF4444" onPress={() => handleDelete(ev.id)} />
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
  container: { flexGrow: 1, padding: 20, backgroundColor: '#FFF7ED' },
  title: { fontFamily: FONTS.bold, marginBottom: 20, color: '#EA580C', textAlign: 'center' },
  formCard: { backgroundColor: '#FFFFFF', elevation: 2 },
  input: { marginBottom: 15, backgroundColor: '#FFFFFF' },
  button: { marginTop: 5, borderRadius: 8, paddingVertical: 5 },
  listCard: { marginBottom: 10, backgroundColor: '#FFFFFF', elevation: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionButtons: { flexDirection: 'row' }
});