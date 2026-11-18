import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, Button, Input, StateView, useTheme } from '@school-erp/ui';
import { useAuthStore } from '@school-erp/mobile-core';
import type { StudentRecordDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services';

export function ProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const [student, setStudent] = useState<StudentRecordDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [hobbies, setHobbies] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await MockStudentServices.getStudentRecord();
      setStudent(data);
      setMobile(data.studentMobile || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      setEmergencyName(data.emergencyContactName || '');
      setEmergencyPhone(data.emergencyContactPhone || '');
      setBloodGroup(data.bloodGroup || '');
      setHobbies(data.hobbies || '');
    } catch {
      // Handled by StateView
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveEditable = async () => {
    try {
      setSaving(true);
      const updated = await MockStudentServices.updateEditableProfile({
        studentMobile: mobile,
        email,
        address,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
        bloodGroup,
        hobbies,
      });
      setStudent(updated);
      Alert.alert('Profile Updated', 'Your personal details have been saved.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <Screen header={<Header title="My Profile" />}>
        <StateView state="loading" title="Loading profile..." />
      </Screen>
    );
  }

  if (!student) {
    return (
      <Screen header={<Header title="My Profile" />}>
        <StateView
          state="error"
          title="Profile not found"
          actionLabel="Retry"
          onAction={loadProfile}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title="My Profile" />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      {/* 1. School-Controlled Fields (Read-Only) */}
      <Card variant="outlined" style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, fontSize: typography.fontSizes.base, fontWeight: '700' },
            ]}
          >
            School-Controlled Identity (Read-Only)
          </Text>
          <Badge label="Verified" variant="success" size="sm" />
        </View>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.xs,
            marginBottom: spacing.sm,
          }}
        >
          Class, section, and roll number are derived from your active academic enrollment.
        </Text>

        <View style={styles.gridRow}>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <Text style={[styles.val, { color: colors.text }]}>{student.fullName}</Text>
          </View>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Admission Number</Text>
            <Text style={[styles.val, { color: colors.text }]}>{student.admissionNumber}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Class & Section</Text>
            <Text style={[styles.val, { color: colors.text }]}>
              {student.className} - {student.sectionName}
            </Text>
          </View>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Roll Number</Text>
            <Text style={[styles.val, { color: colors.text }]}>{student.rollNumber}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date of Birth</Text>
            <Text style={[styles.val, { color: colors.text }]}>{student.dateOfBirth}</Text>
          </View>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Gender</Text>
            <Text style={[styles.val, { color: colors.text }]}>
              {student.gender || 'Not specified'}
            </Text>
          </View>
        </View>
      </Card>

      {/* 2. Mandatory Student Record (School-recorded Parent Details) */}
      <Card variant="outlined" style={styles.sectionCard}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
              fontSize: typography.fontSizes.base,
              fontWeight: '700',
              marginBottom: spacing.xs,
            },
          ]}
        >
          Parent Record (School Registered)
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.xs,
            marginBottom: spacing.sm,
          }}
        >
          Registered parent details. Guardian user accounts are separate legal entities.
        </Text>

        <View style={styles.gridRow}>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Father's Name</Text>
            <Text style={[styles.val, { color: colors.text }]}>
              {student.fatherName || 'Not recorded'}
            </Text>
          </View>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Mother's Name</Text>
            <Text style={[styles.val, { color: colors.text }]}>
              {student.motherName || 'Not recorded'}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.fieldItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Registered Parent Mobile
            </Text>
            <Text style={[styles.val, { color: colors.text }]}>
              {student.registeredParentMobile || 'Not recorded'}
            </Text>
          </View>
        </View>
      </Card>

      {/* 3. Optional Student-Editable Fields */}
      <Card variant="outlined" style={styles.sectionCard}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
              fontSize: typography.fontSizes.base,
              fontWeight: '700',
              marginBottom: spacing.xs,
            },
          ]}
        >
          Personal & Emergency Details (Student Editable)
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.xs,
            marginBottom: spacing.md,
          }}
        >
          Optional information. Updating these never blocks your dashboard access.
        </Text>

        <Input
          label="Student Mobile"
          value={mobile}
          onChangeText={setMobile}
          placeholder="+91..."
          keyboardType="phone-pad"
        />
        <Input
          label="Student Email"
          value={email}
          onChangeText={setEmail}
          placeholder="student@example.com"
          keyboardType="email-address"
        />
        <Input
          label="Residential Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Current home address"
        />
        <Input
          label="Emergency Contact Name"
          value={emergencyName}
          onChangeText={setEmergencyName}
          placeholder="Name of emergency contact"
        />
        <Input
          label="Emergency Contact Phone"
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          placeholder="+91..."
          keyboardType="phone-pad"
        />
        <Input
          label="Blood Group"
          value={bloodGroup}
          onChangeText={setBloodGroup}
          placeholder="e.g. B+, O+"
        />
        <Input
          label="Hobbies"
          value={hobbies}
          onChangeText={setHobbies}
          placeholder="e.g. Cricket, Music, Robotics"
        />

        <Button
          label="Save Changes"
          onPress={handleSaveEditable}
          loading={saving}
          variant="primary"
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {/* Logout Action */}
      <Button
        label="Log Out"
        onPress={handleLogout}
        variant="destructive"
        size="lg"
        style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {},
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  fieldItem: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
  },
});
