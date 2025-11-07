import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeTokens } from '../design/tokens';

const Header = ({ title, onBack }) => {
    const t = useThemeTokens();
    return (
        <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border, padding: t.spacing.lg }] }>
            {onBack && (
                <TouchableOpacity onPress={onBack} style={[styles.backButton, { marginRight: t.spacing.md }] }>
                    <Text style={[styles.backText, { color: t.colors.accent }]}>←</Text>
                </TouchableOpacity>
            )}
            <Text style={[styles.title, { fontSize: t.typography.sizes.lg, color: t.colors.textPrimary }] }>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 10,
    },
    backText: {
        fontSize: 24,
        fontWeight: '600'
    },
    title: {
        fontWeight: '600',
    },
});

export default Header;
