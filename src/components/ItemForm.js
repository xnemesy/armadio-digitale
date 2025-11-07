import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useThemeTokens } from '../design/tokens';

const ItemForm = ({ metadata, setMetadata, loading }) => {
    const t = useThemeTokens();
    const fields = ['name', 'category', 'mainColor', 'brand', 'size'];
    return (
        <View style={[styles.form, { gap: t.spacing.md }] }>
            {fields.map(field => (
                <TextInput
                    key={field}
                    style={[
                        styles.input,
                        {
                            backgroundColor: t.colors.surface,
                            borderColor: t.colors.border,
                            padding: t.spacing.md,
                            borderRadius: t.radii.md,
                            fontSize: t.typography.sizes.md,
                            color: t.colors.textPrimary,
                        }
                    ]}
                    placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)}...`}
                    placeholderTextColor={t.colors.placeholder}
                    value={metadata[field]}
                    onChangeText={text => setMetadata(prev => ({ ...prev, [field]: text }))}
                    editable={!loading}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    form: {},
    input: {
        borderWidth: 1,
    }
});

export default ItemForm;
