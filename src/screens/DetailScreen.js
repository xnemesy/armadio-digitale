import React, { useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, TextInput, ScrollView, Platform, KeyboardAvoidingView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import storage from '@react-native-firebase/storage';
import firestore, { doc, setDoc, deleteDoc } from '@react-native-firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';
import { APP_ID } from '../config/appConfig';

const DetailScreen = ({ navigation, route }) => {
  const { item } = route.params;
  const { tokens } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState(item);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const itemRef = doc(firestore(), `artifacts/${APP_ID}/users/${item.userId}/items`, item.id);
      await setDoc(itemRef, editedMetadata, { merge: true });
      setEditing(false);
      Alert.alert('Successo', 'Modifiche salvate!');
    } catch (e) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina Capo',
      "Sei sicuro di voler eliminare questo capo? L'azione è irreversibile.",
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (item.storagePath) {
                await storage().ref(item.storagePath).delete();
              }
              const itemRef = doc(firestore(), `artifacts/${APP_ID}/users/${item.userId}/items`, item.id);
              await deleteDoc(itemRef);
              Alert.alert('Successo', 'Capo eliminato');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Errore', e.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
    backButton: { paddingRight: 12, paddingVertical: 4 },
    title: { fontSize: 20, fontWeight: '700', color: tokens.colors.textPrimary },
    image: { width: '100%', height: 400, resizeMode: 'cover', backgroundColor: tokens.colors.surface },
    form: { backgroundColor: tokens.colors.surface, margin: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: tokens.colors.border },
    formGroup: { marginBottom: 14 },
    label: { fontSize: 12, color: tokens.colors.textSecondary, marginBottom: 4, textTransform: 'capitalize' },
    input: { backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.border, padding: 10, borderRadius: 10, color: tokens.colors.textPrimary },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    primaryButton: { backgroundColor: tokens.colors.accent },
    secondaryButton: { backgroundColor: tokens.colors.surfaceLight },
    deleteButton: { backgroundColor: tokens.colors.error },
    buttonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
    infoBox: { backgroundColor: tokens.colors.surface, margin: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: tokens.colors.border },
    itemName: { fontSize: 28, fontWeight: '800', color: tokens.colors.textPrimary, marginBottom: 16 },
    meta: { fontSize: 16, color: tokens.colors.textSecondary, marginBottom: 10 },
  }), [tokens]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View entering={FadeIn} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={tokens.colors.accent} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.title}>Dettaglio Capo</Text>
        </Animated.View>
        <Image source={{ uri: item.thumbnailUrl }} style={styles.image} />
        {editing ? (
          <View style={styles.form}>
            {['name', 'category', 'mainColor', 'brand', 'size'].map(key => (
              <View key={key} style={styles.formGroup}>
                <Text style={styles.label}>{key}</Text>
                <TextInput
                  value={editedMetadata[key] || ''}
                  onChangeText={text => setEditedMetadata(prev => ({ ...prev, [key]: text }))}
                  style={styles.input}
                  placeholder={key}
                  placeholderTextColor={tokens.colors.textMuted}
                />
              </View>
            ))}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Salvataggio...' : 'Salva'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setEditing(false)}>
                <Text style={[styles.buttonText, { color: tokens.colors.textSecondary }]}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.meta}>Categoria: {item.category}</Text>
            <Text style={styles.meta}>Colore: {item.mainColor}</Text>
            <Text style={styles.meta}>Marca: {item.brand}</Text>
            <Text style={styles.meta}>Taglia: {item.size}</Text>
            <Text style={styles.meta}>ID: {item.id}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => setEditing(true)}>
                <Text style={styles.buttonText}>Modifica</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.buttonText}>Elimina</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DetailScreen;
