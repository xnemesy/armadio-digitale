import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Header = ({ title, onBack }) => {
    return (
        <View style={styles.header}>
            {onBack && (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    backButton: {
        marginRight: 10,
    },
    backText: {
        fontSize: 24,
        color: '#4F46E5',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
});

export default Header;
