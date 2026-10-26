// ဖိုင်လမ်းကြောင်း: src/database/db.js
import * as SQLite from 'expo-sqlite';

export const setupDatabase = () => {
  try {
    const db = SQLite.openDatabaseSync('notedbook.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_number TEXT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT
      );

      CREATE TABLE IF NOT EXISTS subject_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_name TEXT NOT NULL,
        student_id INTEGER,
        payment_amount REAL,
        payment_date TEXT,
        FOREIGN KEY (student_id) REFERENCES students (id)
      );

      CREATE TABLE IF NOT EXISTS event_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        student_id INTEGER,
        payment_amount REAL,
        payment_date TEXT,
        FOREIGN KEY (student_id) REFERENCES students (id)
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      );
      
    `);
    console.log("မီးခံသေတ္တာ (Database) ကို အခန်းအစုံနဲ့ တည်ဆောက်ပြီးပါပြီ! 🎉");
  } catch (error) {
    console.error("Database တည်ဆောက်ရာတွင် အမှားအယွင်းဖြစ်နေပါသည်: ", error);
  }
};