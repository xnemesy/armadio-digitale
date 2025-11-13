import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [showResetPassword, setShowResetPassword] = useState(false);
    
    const { signIn, signUp, resetPassword, loading } = useAuth();

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert("Errore", "Inserisci email e password");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Errore", "La password deve contenere almeno 6 caratteri");
            return;
        }

        const result = isLogin 
            ? await signIn(email, password)
            : await signUp(email, password);

        if (result.success) {
            if (!isLogin && result.message) {
                Alert.alert("Successo", result.message);
            }
            // Navigation handled by App.js based on auth state
        } else {
            Alert.alert("Errore", result.error);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert("Errore", "Inserisci la tua email");
            return;
        }

        const result = await resetPassword(email);
        if (result.success) {
            Alert.alert("Successo", result.message);
            setShowResetPassword(false);
        } else {
            Alert.alert("Errore", result.error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {showResetPassword ? 'Recupera Password' : (isLogin ? 'Accedi' : 'Registrati')}
            </Text>
            
            {showResetPassword ? (
                <>
                    <Text style={styles.subtitle}>
                        Inserisci la tua email per ricevere il link di reset
                    </Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Invia Email</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowResetPassword(false)}>
                        <Text style={styles.switchText}>Torna al login</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Password (min. 6 caratteri)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!loading}
                    />

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isLogin ? 'Accedi' : 'Registrati'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {isLogin && (
                        <TouchableOpacity onPress={() => setShowResetPassword(true)}>
                            <Text style={styles.forgotText}>Password dimenticata?</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                        <Text style={styles.switchText}>
                            {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
        color: '#111',
    },
    button: {
        backgroundColor: '#4F46E5',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    forgotText: {
        color: '#4F46E5',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
    },
    switchText: {
        color: '#4F46E5',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    }
});

export default AuthScreen;
