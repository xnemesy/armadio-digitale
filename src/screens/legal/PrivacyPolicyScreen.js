import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const PrivacyPolicyScreen = () => {
  const { tokens } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background }]}>
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.surface, borderBottomColor: tokens.colors.border }]}>
          <ShieldCheck size={24} color={tokens.colors.accent} strokeWidth={2.5} />
          <Text style={[styles.headerTitle, { color: tokens.colors.textPrimary }]}>Privacy Policy</Text>
        </View>
        
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.lastUpdated, { color: tokens.colors.textSecondary }]}>
              Ultimo aggiornamento: 10 novembre 2025
            </Text>

            <Section title="1. Introduzione" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Benvenuto su Armadio Digitale ("noi", "nostro"). Rispettiamo la tua privacy e ci impegniamo a proteggere i tuoi dati personali. Questa Privacy Policy spiega come raccogliamo, utilizziamo, condividiamo e proteggiamo le tue informazioni quando utilizzi la nostra applicazione mobile.
              </Text>
            </Section>

            <Section title="2. Dati che Raccogliamo" tokens={tokens}>
              <SubSection title="2.1 Informazioni che Fornisci" tokens={tokens}>
                <BulletPoint text="Email e password (per l'autenticazione)" tokens={tokens} />
                <BulletPoint text="Nome visualizzato (opzionale)" tokens={tokens} />
                <BulletPoint text="Foto dei tuoi capi d'abbigliamento" tokens={tokens} />
                <BulletPoint text="Metadati dei capi (nome, categoria, colore, brand, taglia)" tokens={tokens} />
              </SubSection>

              <SubSection title="2.2 Dati Raccolti Automaticamente" tokens={tokens}>
                <BulletPoint text="Informazioni sul dispositivo (modello, sistema operativo, versione app)" tokens={tokens} />
                <BulletPoint text="Log degli errori e crash (tramite Sentry)" tokens={tokens} />
                <BulletPoint text="Dati di utilizzo anonimi (schermate visitate, funzionalità utilizzate)" tokens={tokens} />
              </SubSection>
            </Section>

            <Section title="3. Come Utilizziamo i Tuoi Dati" tokens={tokens}>
              <BulletPoint text="Fornire e migliorare il servizio dell'app" tokens={tokens} />
              <BulletPoint text="Archiviare e sincronizzare i tuoi capi nel cloud" tokens={tokens} />
              <BulletPoint text="Generare suggerimenti AI per outfit e shopping" tokens={tokens} />
              <BulletPoint text="Inviare notifiche (se abilitate)" tokens={tokens} />
              <BulletPoint text="Analizzare l'utilizzo per migliorare l'esperienza utente" tokens={tokens} />
              <BulletPoint text="Prevenire frodi e garantire la sicurezza" tokens={tokens} />
            </Section>

            <Section title="4. Condivisione dei Dati" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Non vendiamo i tuoi dati personali. Condividiamo i dati solo con:
              </Text>
              <BulletPoint text="Firebase (Google): hosting database e storage immagini" tokens={tokens} />
              <BulletPoint text="Google Gemini AI: analisi immagini (solo dati temporanei)" tokens={tokens} />
              <BulletPoint text="Sentry: monitoraggio crash (dati anonimi)" tokens={tokens} />
              <BulletPoint text="Autorità legali: se richiesto dalla legge" tokens={tokens} />
            </Section>

            <Section title="5. Conservazione dei Dati" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                I tuoi dati vengono conservati fino a quando non elimini il tuo account. Dopo l'eliminazione, tutti i dati vengono rimossi permanentemente entro 30 giorni, eccetto dove richiesto dalla legge.
              </Text>
            </Section>

            <Section title="6. I Tuoi Diritti (GDPR)" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Se risiedi nell'UE/EEA, hai i seguenti diritti:
              </Text>
              <BulletPoint text="Accesso: richiedere una copia dei tuoi dati" tokens={tokens} />
              <BulletPoint text="Rettifica: correggere dati imprecisi" tokens={tokens} />
              <BulletPoint text="Cancellazione: eliminare il tuo account e tutti i dati" tokens={tokens} />
              <BulletPoint text="Portabilità: esportare i tuoi dati in formato leggibile" tokens={tokens} />
              <BulletPoint text="Opposizione: opporti al trattamento in determinate circostanze" tokens={tokens} />
              <BulletPoint text="Revoca consenso: ritirare il consenso in qualsiasi momento" tokens={tokens} />
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary, marginTop: 12 }]}>
                Per esercitare questi diritti, contattaci a: privacy@armadiodigitale.app
              </Text>
            </Section>

            <Section title="7. Sicurezza" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Utilizziamo misure tecniche e organizzative per proteggere i tuoi dati:
              </Text>
              <BulletPoint text="Crittografia SSL/TLS per trasferimenti dati" tokens={tokens} />
              <BulletPoint text="Autenticazione Firebase con password sicure" tokens={tokens} />
              <BulletPoint text="Regole di sicurezza Firebase per limitare l'accesso" tokens={tokens} />
              <BulletPoint text="Backup regolari e disaster recovery" tokens={tokens} />
            </Section>

            <Section title="8. Minori" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                L'app non è destinata a persone di età inferiore a 13 anni. Non raccogliamo consapevolmente dati di minori. Se sei un genitore e ritieni che tuo figlio ci abbia fornito dati, contattaci per la rimozione.
              </Text>
            </Section>

            <Section title="9. Cookie e Tracking" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                L'app utilizza tecnologie simili ai cookie per:
              </Text>
              <BulletPoint text="Mantenere la sessione autenticata" tokens={tokens} />
              <BulletPoint text="Salvare preferenze (tema, lingua)" tokens={tokens} />
              <BulletPoint text="Analytics anonimi (puoi disabilitare nelle impostazioni)" tokens={tokens} />
            </Section>

            <Section title="10. Trasferimenti Internazionali" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                I tuoi dati possono essere trasferiti e processati in paesi al di fuori dell'UE (es. USA tramite Firebase). Ci affidiamo a meccanismi di trasferimento conformi al GDPR (Standard Contractual Clauses).
              </Text>
            </Section>

            <Section title="11. Modifiche alla Policy" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Potremmo aggiornare questa Privacy Policy periodicamente. Ti notificheremo tramite l'app o email per modifiche significative. L'uso continuato dell'app costituisce accettazione dei nuovi termini.
              </Text>
            </Section>

            <Section title="12. Contatti" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Per domande sulla Privacy Policy o richieste di dati, contattaci a:
              </Text>
              <Text style={[styles.contactText, { color: tokens.colors.accent }]}>
                Email: privacy@armadiodigitale.app
              </Text>
              <Text style={[styles.contactText, { color: tokens.colors.accent }]}>
                Indirizzo: [Inserisci indirizzo legale]
              </Text>
            </Section>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const Section = ({ title, children, tokens }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>{title}</Text>
    {children}
  </View>
);

const SubSection = ({ title, children, tokens }) => (
  <View style={styles.subSection}>
    <Text style={[styles.subSectionTitle, { color: tokens.colors.textPrimary }]}>{title}</Text>
    {children}
  </View>
);

const BulletPoint = ({ text, tokens }) => (
  <View style={styles.bulletContainer}>
    <Text style={[styles.bullet, { color: tokens.colors.accent }]}>•</Text>
    <Text style={[styles.bulletText, { color: tokens.colors.textSecondary }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  lastUpdated: { fontSize: 12, fontStyle: 'italic', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  subSection: { marginTop: 12, marginLeft: 8 },
  subSectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  bodyText: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  bulletContainer: { flexDirection: 'row', marginBottom: 6, marginLeft: 12 },
  bullet: { fontSize: 18, marginRight: 8, lineHeight: 22 },
  bulletText: { fontSize: 14, lineHeight: 22, flex: 1 },
  contactText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
});

export default PrivacyPolicyScreen;
