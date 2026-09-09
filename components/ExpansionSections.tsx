import { Text, View } from 'react-native';

const SECTION_LABELS = {
  questions: 'Questions to Explore',
  angles: 'Different Angles',
  related: 'Related Concepts',
} as const;

type Props = {
  questions: string[];
  angles: string[];
  related: string[];
};

export function ExpansionSections({ questions, angles, related }: Props) {
  const sections = { questions, angles, related };
  return (
    <View>
      {(Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]).map((key) => (
        <View key={key} className="mb-4">
          <Text className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            {SECTION_LABELS[key]}
          </Text>
          {sections[key].map((item, i) => (
            <View key={i} className="flex-row gap-2 mb-1.5">
              <Text className="text-muted text-sm">·</Text>
              <Text className="text-foreground text-sm flex-1">{item}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
