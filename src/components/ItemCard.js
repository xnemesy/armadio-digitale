import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useThemeTokens } from '../design/tokens';
import PressableScale from './PressableScale';

const ItemCard = ({ item, onPress }) => {
    const t = useThemeTokens();
    const imageUrl = item.thumbnailUrl || `https://placehold.co/150x200/4F46E5/FFFFFF?text=${(item.name || '').substring(0, 10)}`;

    return (
        <PressableScale
            style={[
                styles.card,
                {
                    backgroundColor: t.colors.surface,
                    borderRadius: t.radii.lg,
                    paddingBottom: t.spacing.sm,
                    ...(Platform.OS === 'ios' ? t.shadow('sm') : { elevation: t.elevation.sm }),
                },
            ]}
            onPress={() => onPress && onPress(item)}
            activeScale={0.96}
        >
            <FastImage 
                source={{ 
                    uri: imageUrl,
                    priority: FastImage.priority.normal,
                    cache: FastImage.cacheControl.immutable
                }} 
                style={styles.image} 
                resizeMode={FastImage.resizeMode.cover}
            />
            <View style={{ paddingHorizontal: t.spacing.md, paddingTop: t.spacing.sm }}>
                <Text style={{ fontSize: t.typography.sizes.md, fontWeight: '600', color: t.colors.textPrimary }} numberOfLines={1}>
                    {item.name}
                </Text>
                {!!item.category && (
                    <Text style={{ marginTop: 2, fontSize: t.typography.sizes.sm, color: t.colors.textSecondary }} numberOfLines={1}>
                        {item.category}
                    </Text>
                )}
                {(item.brand || item.size) && (
                    <Text style={{ marginTop: 2, fontSize: t.typography.sizes.sm, color: t.colors.placeholder }} numberOfLines={1}>
                        {item.brand}{item.brand && item.size ? ' • ' : ''}{item.size}
                    </Text>
                )}
            </View>
        </PressableScale>
    );
};

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        aspectRatio: 3 / 4,
    },
});

export default ItemCard;
