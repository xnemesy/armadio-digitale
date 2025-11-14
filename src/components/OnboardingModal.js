import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Sparkles, Camera, Brain, Search, X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const OnboardingModal = ({ visible, onClose }) => {
  const { tokens } = useTheme();

  const features = [
    {
      icon: Camera,
      title: 'Scatta e Aggiungi',
      description: 'Fotografa i tuoi capi e l\'AI li catalogherà automaticamente'
    },
    {
      icon: Brain,
      title: 'AI Intelligente',
      description: 'Gemini AI riconosce categoria, colore, brand e suggerisce outfit'
    },
    {
      icon: Search,
      title: 'Ricerca Avanzata',
      description: 'Filtra per categoria, colore, brand con selezione multipla'
    },
    {
      icon: Sparkles,
      title: 'Outfit Builder',
      description: 'Genera combinazioni perfette dal tuo armadio digitale'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
        <View style={[styles.container, { backgroundColor: tokens.colors.surface }]}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={tokens.colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <Sparkles size={48} color={tokens.colors.accent} />
              <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
                Benvenuto in{'\n'}Armadio Digitale
              </Text>
              <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
                Il tuo armadio intelligente con AI
              </Text>
            </View>

            <View style={styles.features}>
              {features.map((feature, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.feature, 
                    { 
                      backgroundColor: tokens.colors.surfaceLight,
                      borderColor: tokens.colors.border
                    }
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: tokens.colors.background }]}>
                    <feature.icon size={28} color={tokens.colors.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: tokens.colors.textPrimary }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureDescription, { color: tokens.colors.textSecondary }]}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: tokens.colors.accent }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Inizia Ora</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    padding: 32,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  features: {
    gap: 16,
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OnboardingModal;
