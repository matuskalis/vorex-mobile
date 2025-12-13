import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface QuestionCardProps {
  question: string;
  imageUrl?: string;
  subtitle?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  imageUrl,
  subtitle
}) => {
  return (
    <View style={styles.container}>
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      )}
      <Text style={styles.question}>{question}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 12,
    fontWeight: '600',
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 32,
  },
});
