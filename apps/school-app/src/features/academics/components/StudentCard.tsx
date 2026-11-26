import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { STUDENT_MOCK } from '@/mock/academics';

/** Who the Student Performance numbers belong to: initials, class, attendance and school id. */
export function StudentCard({ student }: { student: typeof STUDENT_MOCK }) {
  const initials = student.name
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <View testID="student-card" style={styles.card}>
      <View style={styles.avatar}>
        <Svg width={48} height={48} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="student-avatar" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2563EB" />
              <Stop offset="1" stopColor="#0A2F6B" />
            </LinearGradient>
          </Defs>
          <Circle cx={24} cy={24} r={24} fill="url(#student-avatar)" />
        </Svg>
        <Text style={styles.initials}>{initials}</Text>
        <View style={styles.dot} />
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text numberOfLines={1} style={styles.name}>
            {student.name}
          </Text>
          <View style={styles.roll}>
            <Text style={styles.rollText}>Roll: {student.roll}</Text>
          </View>
        </View>
        <Text style={styles.details}>
          Class {student.className} • Section {student.section} • {student.year}
        </Text>
        <View style={[styles.row, styles.bottom]}>
          <View style={styles.attendance}>
            <Text style={styles.attendanceText}>{student.attendance}% Attendance</Text>
          </View>
          <Text numberOfLines={1} style={styles.id}>
            ID: {student.schoolId}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 7,
    marginLeft: 21,
    marginRight: 21,
    minHeight: 87,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  dot: {
    position: 'absolute',
    left: 35,
    top: 34,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#10B981',
  },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, color: '#0F2847', fontSize: 15, lineHeight: 21, fontWeight: '700' },
  roll: {
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: '#E8F1FD',
    justifyContent: 'center',
  },
  rollText: { color: '#1D4ED8', fontSize: 11, fontWeight: '600' },
  details: { marginTop: 1, color: '#475569', fontSize: 11.5, lineHeight: 17 },
  bottom: { marginTop: 4, gap: 6 },
  attendance: {
    height: 21,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CDEFDF',
    backgroundColor: '#E9F8F1',
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  attendanceText: { color: '#059669', fontSize: 10.5, fontWeight: '600' },
  id: { flexShrink: 1, color: '#475569', fontSize: 10.5 },
});
