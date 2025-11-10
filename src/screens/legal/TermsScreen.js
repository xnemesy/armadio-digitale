import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const TermsScreen = () => {
  const { tokens } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background }]}>
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.surface, borderBottomColor: tokens.colors.border }]}>
          <FileText size={24} color={tokens.colors.primary} strokeWidth={2.5} />
          <Text style={[styles.headerTitle, { color: tokens.colors.textPrimary }]}>Termini di Servizio</Text>
        </View>
        
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.lastUpdated, { color: tokens.colors.textSecondary }]}>
              Ultimo aggiornamento: 10 novembre 2025
            </Text>

            <Section title="1. Accettazione dei Termini" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Utilizzando Armadio Digitale ("l'App"), accetti di essere vincolato a questi Termini di Servizio ("Termini"). Se non accetti questi Termini, non utilizzare l'App.
              </Text>
            </Section>

            <Section title="2. Descrizione del Servizio" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Armadio Digitale è un'applicazione mobile che consente di:
              </Text>
              <BulletPoint text="Catalogare e organizzare i propri capi d'abbigliamento" tokens={tokens} />
              <BulletPoint text="Ricevere suggerimenti AI per outfit e acquisti" tokens={tokens} />
              <BulletPoint text="Visualizzare statistiche sul proprio guardaroba" tokens={tokens} />
              <BulletPoint text="Sincronizzare i dati su più dispositivi" tokens={tokens} />
            </Section>

            <Section title="3. Registrazione e Account" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Per utilizzare l'App, devi:
              </Text>
              <BulletPoint text="Avere almeno 13 anni" tokens={tokens} />
              <BulletPoint text="Fornire informazioni accurate e complete" tokens={tokens} />
              <BulletPoint text="Mantenere la sicurezza del tuo account" tokens={tokens} />
              <BulletPoint text="Notificarci immediatamente di accessi non autorizzati" tokens={tokens} />
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary, marginTop: 12 }]}>
                Sei responsabile di tutte le attività svolte tramite il tuo account.
              </Text>
            </Section>

            <Section title="4. Contenuti Utente" tokens={tokens}>
              <SubSection title="4.1 Tua Proprietà" tokens={tokens}>
                <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                  Mantieni la proprietà di tutti i contenuti che carichi (foto, metadati). Ci concedi una licenza limitata per:
                </Text>
                <BulletPoint text="Archiviare e processare i tuoi contenuti" tokens={tokens} />
                <BulletPoint text="Fornire servizi AI (analisi immagini)" tokens={tokens} />
                <BulletPoint text="Backup e disaster recovery" tokens={tokens} />
              </SubSection>

              <SubSection title="4.2 Responsabilità" tokens={tokens}>
                <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                  Non devi caricare contenuti che:
                </Text>
                <BulletPoint text="Violano diritti di terzi (copyright, marchi)" tokens={tokens} />
                <BulletPoint text="Contengono materiale illegale o offensivo" tokens={tokens} />
                <BulletPoint text="Includono malware o codice dannoso" tokens={tokens} />
              </SubSection>
            </Section>

            <Section title="5. Uso Accettabile" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Non puoi utilizzare l'App per:
              </Text>
              <BulletPoint text="Scopi commerciali non autorizzati" tokens={tokens} />
              <BulletPoint text="Reverse engineering o decompilazione" tokens={tokens} />
              <BulletPoint text="Interferire con la sicurezza o i server" tokens={tokens} />
              <BulletPoint text="Scraping automatizzato o bot" tokens={tokens} />
              <BulletPoint text="Impersonare altri utenti" tokens={tokens} />
            </Section>

            <Section title="6. Servizi AI e Limitazioni" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                I suggerimenti AI sono forniti "così come sono" e possono contenere errori. Non garantiamo:
              </Text>
              <BulletPoint text="Accuratezza al 100% delle classificazioni" tokens={tokens} />
              <BulletPoint text="Disponibilità continua del servizio AI" tokens={tokens} />
              <BulletPoint text="Idoneità dei suggerimenti per situazioni specifiche" tokens={tokens} />
            </Section>

            <Section title="7. Abbonamento e Pagamenti (se applicabile)" tokens={tokens}>
              <SubSection title="7.1 Piani" tokens={tokens}>
                <BulletPoint text="Piano Free: funzionalità base con limitazioni" tokens={tokens} />
                <BulletPoint text="Piano Premium: accesso illimitato e funzionalità avanzate" tokens={tokens} />
              </SubSection>

              <SubSection title="7.2 Fatturazione" tokens={tokens}>
                <BulletPoint text="Gli abbonamenti si rinnovano automaticamente" tokens={tokens} />
                <BulletPoint text="Puoi annullare in qualsiasi momento (nessun rimborso parziale)" tokens={tokens} />
                <BulletPoint text="I prezzi possono variare con preavviso di 30 giorni" tokens={tokens} />
              </SubSection>

              <SubSection title="7.3 Rimborsi" tokens={tokens}>
                <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                  Offriamo rimborsi solo in caso di:
                </Text>
                <BulletPoint text="Addebiti duplicati o errori tecnici" tokens={tokens} />
                <BulletPoint text="Violazione dei Termini da parte nostra" tokens={tokens} />
                <Text style={[styles.bodyText, { color: tokens.colors.textSecondary, marginTop: 8 }]}>
                  Richiedi rimborsi entro 7 giorni dall'addebito.
                </Text>
              </SubSection>
            </Section>

            <Section title="8. Disponibilità del Servizio" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Ci sforziamo di mantenere l'App disponibile, ma non garantiamo:
              </Text>
              <BulletPoint text="Uptime del 100% (manutenzione programmata)" tokens={tokens} />
              <BulletPoint text="Compatibilità con tutti i dispositivi" tokens={tokens} />
              <BulletPoint text="Assenza di bug o interruzioni" tokens={tokens} />
            </Section>

            <Section title="9. Limitazione di Responsabilità" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Nella misura consentita dalla legge, non siamo responsabili per:
              </Text>
              <BulletPoint text="Perdita di dati (esegui backup regolari)" tokens={tokens} />
              <BulletPoint text="Danni indiretti o consequenziali" tokens={tokens} />
              <BulletPoint text="Costi derivanti da downtime" tokens={tokens} />
              <BulletPoint text="Azioni di terze parti (es. hack)" tokens={tokens} />
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary, marginTop: 12 }]}>
                La nostra responsabilità massima è limitata all'importo pagato negli ultimi 12 mesi.
              </Text>
            </Section>

            <Section title="10. Garanzie Escluse" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                L'App è fornita "AS IS" senza garanzie di alcun tipo, incluse:
              </Text>
              <BulletPoint text="Commerciabilità" tokens={tokens} />
              <BulletPoint text="Idoneità per scopi specifici" tokens={tokens} />
              <BulletPoint text="Non violazione di diritti di terzi" tokens={tokens} />
            </Section>

            <Section title="11. Indennizzo" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Accetti di indennizzarci da rivendicazioni derivanti da:
              </Text>
              <BulletPoint text="Violazione di questi Termini" tokens={tokens} />
              <BulletPoint text="Contenuti caricati da te" tokens={tokens} />
              <BulletPoint text="Uso improprio dell'App" tokens={tokens} />
            </Section>

            <Section title="12. Modifiche ai Termini" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Possiamo modificare questi Termini in qualsiasi momento. Ti notificheremo tramite:
              </Text>
              <BulletPoint text="Notifica in-app" tokens={tokens} />
              <BulletPoint text="Email (se fornita)" tokens={tokens} />
              <BulletPoint text="Aggiornamento della data 'Ultimo aggiornamento'" tokens={tokens} />
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary, marginTop: 12 }]}>
                L'uso continuato dopo le modifiche costituisce accettazione.
              </Text>
            </Section>

            <Section title="13. Risoluzione" tokens={tokens}>
              <SubSection title="13.1 Da Parte Tua" tokens={tokens}>
                <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                  Puoi chiudere il tuo account in qualsiasi momento tramite le impostazioni dell'App. L'eliminazione è permanente e irreversibile.
                </Text>
              </SubSection>

              <SubSection title="13.2 Da Parte Nostra" tokens={tokens}>
                <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                  Possiamo sospendere o terminare il tuo account se:
                </Text>
                <BulletPoint text="Violi questi Termini" tokens={tokens} />
                <BulletPoint text="Usi l'App in modo fraudolento" tokens={tokens} />
                <BulletPoint text="L'account è inattivo per oltre 2 anni" tokens={tokens} />
              </SubSection>
            </Section>

            <Section title="14. Legge Applicabile e Foro Competente" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Questi Termini sono regolati dalle leggi italiane. Per controversie, il foro competente è il Tribunale di [Inserisci Città].
              </Text>
            </Section>

            <Section title="15. Divisibilità" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Se una clausola di questi Termini è ritenuta invalida, le altre clausole rimangono in vigore.
              </Text>
            </Section>

            <Section title="16. Contatti" tokens={tokens}>
              <Text style={[styles.bodyText, { color: tokens.colors.textSecondary }]}>
                Per domande sui Termini di Servizio, contattaci a:
              </Text>
              <Text style={[styles.contactText, { color: tokens.colors.primary }]}>
                Email: support@armadiodigitale.app
              </Text>
              <Text style={[styles.contactText, { color: tokens.colors.primary }]}>
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
    <Text style={[styles.bullet, { color: tokens.colors.primary }]}>•</Text>
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

export default TermsScreen;
