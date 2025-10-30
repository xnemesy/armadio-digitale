import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components';

const OutfitBuilderScreen = ({ items, setViewMode }) => {
    const [request, setRequest] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!request.trim()) {
            Alert.alert("Errore", "Inserisci una richiesta per l'outfit");
            return;
        }

        setLoading(true);
        // Implementazione della chiamata AI qui
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Header title="Outfit Builder AI" onBack={() => setViewMode('home')} />
            <ScrollView style={styles.content}>
                <TextInput
                    style={styles.input}
                    placeholder="Es: Outfit casual per un aperitivo..."
                    value={request}
                    onChangeText={setRequest}
                    multiline
                />
                
                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleGenerate}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Generazione...' : 'Genera Outfit'}
                    </Text>
                </TouchableOpacity>

                {suggestion && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultTitle}>Suggerimento AI</Text>
                        <Text style={styles.resultText}>{suggestion}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    input: {
        backgroundColor: '#f3f4f6',
        padding: 15,
        borderRadius: 10,
        minHeight: 100,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#059669',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
    resultBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e0f2f1',
        borderRadius: 10,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    resultText: {
        lineHeight: 20,
    },
});

export default OutfitBuilderScreen;
