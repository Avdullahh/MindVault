// DEV-ONLY design token reference. This is the Phase 1 review artifact: flip
// light/dark on this one screen to approve the foundation before any real
// screen is converted. Delete this file (and its Tabs.Screen entry, and the
// __DEV__ link in settings.tsx) in the Phase 6 cleanup commit.
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../context/ThemeContext';

const SPACING = ['1', '2', '3', '4', '5', '6', '8', '10', '12'] as const;
const SPACING_PT: Record<(typeof SPACING)[number], number> = {
  '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48,
};

const TYPE = [
  { cls: 'text-3xl font-bold', label: 'text-3xl / bold', pt: 30 },
  { cls: 'text-2xl font-bold', label: 'text-2xl / bold', pt: 24 },
  { cls: 'text-xl font-semibold', label: 'text-xl / semibold', pt: 20 },
  { cls: 'text-lg font-semibold', label: 'text-lg / semibold', pt: 18 },
  { cls: 'text-base', label: 'text-base / normal', pt: 16 },
  { cls: 'text-sm', label: 'text-sm / normal', pt: 14 },
  { cls: 'text-xs', label: 'text-xs / normal', pt: 12 },
] as const;

const RADII = [
  { cls: 'rounded-field', label: 'field', pt: 12 },
  { cls: 'rounded-control', label: 'control', pt: 12 },
  { cls: 'rounded-card', label: 'card', pt: 16 },
  { cls: 'rounded-sheet', label: 'sheet', pt: 24 },
  { cls: 'rounded-pill', label: 'pill', pt: 9999 },
] as const;

const WIDTHS = [
  { cls: 'max-w-sheet', label: 'sheet', pt: 480 },
  { cls: 'max-w-prose', label: 'prose', pt: 640 },
  { cls: 'max-w-content', label: 'content', pt: 720 },
  { cls: 'max-w-wide', label: 'wide', pt: 960 },
] as const;

// Class names must be written out in full — Tailwind extracts literal strings
// from source, so `bg-${name}` would never be emitted.
const COLORS = [
  { label: 'background', cls: 'bg-background' },
  { label: 'surface', cls: 'bg-surface' },
  { label: 'surface-2', cls: 'bg-surface-2' },
  { label: 'foreground', cls: 'bg-foreground' },
  { label: 'muted', cls: 'bg-muted' },
  { label: 'border', cls: 'bg-border' },
  { label: 'primary', cls: 'bg-primary' },
  { label: 'primary-foreground', cls: 'bg-primary-foreground' },
  { label: 'destructive', cls: 'bg-destructive' },
] as const;

const DEPTH = [
  { label: 'shadow-e1', cls: 'shadow-e1' },
  { label: 'shadow-e2', cls: 'shadow-e2' },
  { label: 'shadow-e3', cls: 'shadow-e3' },
] as const;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text
        className="text-muted text-xs font-semibold uppercase mb-1 tracking-eyebrow"
        style={{ includeFontPadding: false }}
      >
        {title}
      </Text>
      {hint ? <Text className="text-muted text-xs mb-3">{hint}</Text> : null}
      {children}
    </View>
  );
}

export default function TokensScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-safe-offset-4 pb-4 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 -ml-2 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-2xl font-bold font-rounded text-foreground ml-1">Design tokens</Text>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-safe-offset-24 w-full max-w-content self-center">
        <Section
          title="Touch target"
          hint="Must measure 44pt. Was 38.5pt before inlineRem: 16."
        >
          <View className="flex-row items-center">
            <View className="min-h-11 min-w-11 bg-primary rounded-control items-center justify-center px-4">
              <Text className="text-primary-foreground font-semibold">44pt</Text>
            </View>
            <Text className="text-muted text-xs ml-3">min-h-11 / min-w-11</Text>
          </View>
        </Section>

        <Section title="Spacing" hint="Tailwind default scale at rem = 16.">
          {SPACING.map((step) => (
            <View key={step} className="flex-row items-center mb-2">
              <Text className="text-muted text-xs w-16">{`p-${step}`}</Text>
              <View className="h-4 bg-primary rounded-sm" style={{ width: SPACING_PT[step] }} />
              <Text className="text-muted text-xs ml-3">{SPACING_PT[step]}pt</Text>
            </View>
          ))}
        </Section>

        <Section title="Type scale">
          {TYPE.map((t) => (
            <View key={t.cls} className="mb-3">
              <Text className={`${t.cls} text-foreground font-rounded`} style={{ includeFontPadding: false }}>
                Turn thinking into action
              </Text>
              <Text className="text-muted text-xs">{`${t.label} — ${t.pt}pt`}</Text>
            </View>
          ))}
        </Section>

        <Section title="Radius">
          <View className="flex-row flex-wrap">
            {RADII.map((r) => (
              <View key={r.label} className="mr-3 mb-3 items-center">
                <View className={`w-20 h-20 bg-surface border border-border ${r.cls}`} />
                <Text className="text-muted text-xs mt-1">{r.label}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section
          title="Depth"
          hint="shadow-* is a static theme value and cannot switch themes. In dark mode, depth must come from surface-2 + border instead — compare the two rows."
        >
          <View className="flex-row mb-4">
            {DEPTH.map((d) => (
              <View key={d.label} className={`w-24 h-20 bg-surface-2 rounded-card mr-3 items-center justify-center ${d.cls}`}>
                <Text className="text-muted text-xs">{d.label}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row">
            <View className="w-24 h-20 bg-surface rounded-card mr-3 items-center justify-center border border-border">
              <Text className="text-muted text-xs">surface</Text>
            </View>
            <View className="w-24 h-20 bg-surface-2 rounded-card mr-3 items-center justify-center border border-border">
              <Text className="text-muted text-xs">surface-2</Text>
            </View>
          </View>
        </Section>

        <Section title="Colour">
          {COLORS.map((c) => (
            <View key={c.label} className="flex-row items-center mb-2">
              <View className={`w-10 h-10 rounded-control border border-border ${c.cls}`} />
              <Text className="text-foreground text-sm ml-3">{c.label}</Text>
            </View>
          ))}
        </Section>

        <Section title="Max width" hint="Replaces the inline 720/760/980/480 ladder.">
          {WIDTHS.map((w) => (
            <View key={w.label} className="mb-2">
              <Text className="text-muted text-xs mb-1">{`max-w-${w.label} — ${w.pt}pt`}</Text>
              <View className={`h-3 bg-primary/30 rounded-pill w-full ${w.cls}`} />
            </View>
          ))}
        </Section>

        <Section
          title="Breakpoints"
          hint="Rotate the device or drag the iPad Split View divider — this should update live."
        >
          {/* Sibling Views rather than nested Text — RN nested Text does not
              reliably honour display toggling. */}
          <View className="bg-surface border border-border rounded-card p-4">
            <View className="sm:hidden">
              <Text className="text-foreground text-base">base (under 380)</Text>
            </View>
            <View className="hidden sm:flex md:hidden">
              <Text className="text-foreground text-base">sm (380–743)</Text>
            </View>
            <View className="hidden md:flex lg:hidden">
              <Text className="text-foreground text-base">md (744–1023)</Text>
            </View>
            <View className="hidden lg:flex xl:hidden">
              <Text className="text-foreground text-base">lg (1024–1179)</Text>
            </View>
            <View className="hidden xl:flex">
              <Text className="text-foreground text-base">xl (1180+)</Text>
            </View>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}
