import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const ItemForm = ({ metadata, setMetadata, loading }) => {
    return (
        <View style={styles.form}>
            {['name', 'category', 'mainColor', 'brand', 'size'].map(field => (
                <TextInput
                    key={field}
                    style={styles.input}
                    placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)}...`}
                    value={metadata[field]}
                    onChangeText={text => setMetadata(prev => ({...prev, [field]: text}))}
                    editable={!loading}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    form: {
        gap: 10,
    },
    input: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    }
});

export default ItemForm;
