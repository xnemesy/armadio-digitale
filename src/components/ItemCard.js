import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const ItemCard = ({ item, onPress }) => {
    const imageUrl = item.thumbnailUrl || `https://placehold.co/150x200/4F46E5/FFFFFF?text=${item.name.substring(0, 10)}`;
    
    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
            <Image 
                source={{ uri: imageUrl }} 
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.details}>{item.brand} • {item.size}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    image: {
        width: '100%',
        height: 150,
    },
    // ...altri stili...
});

export default ItemCard;
