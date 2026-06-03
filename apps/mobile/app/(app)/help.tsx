import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MagnifyingGlass } from 'lucide-react-native';
import { faqCategories, searchFaq } from '@ext/utils';
import { colors, spacing, radius } from '../../src/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function FaqItemRow({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.item}>
      <TouchableOpacity onPress={toggle} style={styles.itemHeader} activeOpacity={0.7}>
        <Text style={styles.itemQuestion}>{question}</Text>
        <Text style={styles.itemChevron}>{open ? '−' : '+'}</Text>
      </TouchableOpacity>
      {open && <Text style={styles.itemAnswer}>{answer}</Text>}
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchFaq(query), [query]);
  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & FAQ</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchWrap}>
        <MagnifyingGlass size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une question…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {isSearching ? (
          results.length === 0 ? (
            <Text style={styles.empty}>
              Aucun résultat pour « {query} ».{'\n'}Essayez d'autres mots-clés ou contactez-nous à pro@andritiana.tech
            </Text>
          ) : (
            <View style={styles.categoryBlock}>
              {results.map((item) => (
                <FaqItemRow key={item.id} question={item.question} answer={item.answer} />
              ))}
            </View>
          )
        ) : (
          faqCategories.map((cat) => (
            <View key={cat.id} style={styles.categoryBlock}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              {cat.items.map((item) => (
                <FaqItemRow key={item.id} question={item.question} answer={item.answer} />
              ))}
            </View>
          ))
        )}

        <Text style={styles.footer}>
          Vous n'avez pas trouvé votre réponse ?{'\n'}Contactez-nous : pro@andritiana.tech
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border ?? '#e5e7eb',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border ?? '#e5e7eb',
    paddingHorizontal: spacing.sm,
    gap: 8,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.text,
    paddingVertical: 10,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.lg,
  },
  categoryBlock: { gap: 8 },
  categoryLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border ?? '#e5e7eb',
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 8,
  },
  itemQuestion: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  itemChevron: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: colors.textMuted,
    lineHeight: 22,
  },
  itemAnswer: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  empty: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 20,
  },
  footer: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
