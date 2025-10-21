import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme';

type CategoryChip = {
  id: string;
  name: string;
};

export default function CategoryFilter({ 
  categories, 
  selected, 
  onSelect 
}: { 
  categories: CategoryChip[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      alwaysBounceHorizontal={false}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          !selected ? styles.selectedChip : {}
        ]}
        onPress={() => onSelect(null)}
      >
        <Text style={[
          styles.chipText,
          !selected ? styles.selectedChipText : {}
        ]}>
          Tous
        </Text>
      </TouchableOpacity>

      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.chip,
            selected === category.id ? styles.selectedChip : {}
          ]}
          onPress={() => onSelect(category.id)}
        >
          <Text style={[
            styles.chipText,
            selected === category.id ? styles.selectedChipText : {}
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    gap: spacing(1),
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
  },
  selectedChipText: {
    color: 'white',
    fontWeight: '500',
  },
});