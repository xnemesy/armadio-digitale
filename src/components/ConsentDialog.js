import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Switch } from 'react-native';
import { ShieldCheck, Cookie } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { setAnalyticsConsent } from '../lib/analytics';
import * as Haptics from 'expo-haptics';

const ConsentDialog = ({ visible, onClose }) => {
  const { tokens } = useTheme();
  const [analyticsEnabled, setAnalyticsEnabledState] = useState(true);

  const handleAcceptAll = async () => {
    await setAnalyticsConsent(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose(true);
  };

  const handleRejectAll = async () => {
    await setAnalyticsConsent(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose(false);
  };

  const handleCustomize = async () => {
    await setAnalyticsConsent(analyticsEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose(analyticsEnabled);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
        <View style={[styles.dialog, { backgroundColor: tokens.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Cookie size={32} color={tokens.colors.accent} strokeWidth={2} />
            <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
              Privacy &amp; Consenso
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.description, { color: tokens.colors.textSecondary }]}>
              Rispettiamo la tua privacy. Utilizziamo analytics anonimi per migliorare l&apos;app.
            </Text>

            {/* Analytics Toggle */}
            <View style={[styles.optionCard, { backgroundColor: tokens.colors.background, borderColor: tokens.colors.border }]}>
              <View style={styles.optionLeft}>
                <ShieldCheck size={20} color={tokens.colors.accent} strokeWidth={2} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: tokens.colors.textPrimary }]}>
                    Analytics Anonimi
                  </Text>
                  <Text style={[styles.optionDescription, { color: tokens.colors.textMuted }]}>
                    Statistiche di utilizzo (nessun dato personale)
                  </Text>
                </View>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={(value) => {
                  setAnalyticsEnabledState(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Info Text */}
            <Text style={[styles.infoText, { color: tokens.colors.textMuted }]}>
              • Nessun dato personale condiviso{'\n'}
              • Dati anonimi e aggregati{'\n'}
              • Modificabile in Impostazioni
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { borderColor: tokens.colors.border }]}
              onPress={handleRejectAll}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonTextSecondary, { color: tokens.colors.textSecondary }]}>
                Rifiuta Tutto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, { backgroundColor: tokens.colors.accent }]}
              onPress={handleCustomize}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonTextPrimary}>
                Conferma
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.acceptAllButton}
            onPress={handleAcceptAll}
            activeOpacity={0.7}
          >
            <Text style={[styles.acceptAllText, { color: tokens.colors.accent }]}>
              Accetta Tutto
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1.5,
  },
  buttonPrimary: {
    // backgroundColor set dynamically
  },
  buttonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptAllButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConsentDialog;
