import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MilestoneWithSteps } from '../hooks/use-goals';

type Props = {
  milestone: MilestoneWithSteps;
  onToggleStep: (stepId: string, done: boolean) => void;
  onRemoveMilestone: () => void;
  onAddStep: (title: string) => Promise<void>;
};

export function MilestoneItem({ milestone, onToggleStep, onRemoveMilestone, onAddStep }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [addingStep, setAddingStep] = useState(false);
  const [stepTitle, setStepTitle] = useState('');

  const handleAddStep = async () => {
    if (!stepTitle.trim()) return;
    await onAddStep(stepTitle.trim());
    setStepTitle('');
    setAddingStep(false);
  };

  return (
    <View className="bg-leather-600 rounded-xl mb-3 overflow-hidden">
      <View className="flex-row items-center px-4 py-3">
        <Pressable className="flex-1 flex-row items-center gap-2" onPress={() => setExpanded((e) => !e)}>
          <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color="#a89070" />
          <Text className="text-leather-50 font-medium flex-1">{milestone.title}</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert('Delete milestone', 'Deletes all action steps too.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onRemoveMilestone },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color="#7a6050" />
        </Pressable>
      </View>

      {expanded && (
        <View className="px-4 pb-3">
          {milestone.action_steps
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((step) => (
              <Pressable
                key={step.id}
                className="flex-row items-center gap-3 py-2 border-t border-leather-500"
                onPress={() => onToggleStep(step.id, !step.done)}
              >
                <Ionicons
                  name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={step.done ? '#d4a017' : '#7a6050'}
                />
                <Text className={`flex-1 text-sm ${step.done ? 'text-leather-400 line-through' : 'text-leather-100'}`}>
                  {step.title}
                </Text>
              </Pressable>
            ))}

          {addingStep ? (
            <View className="flex-row items-center gap-2 pt-2 border-t border-leather-500">
              <TextInput
                className="flex-1 text-leather-50 text-sm py-1"
                placeholder="Step title..."
                placeholderTextColor="#7a6050"
                value={stepTitle}
                onChangeText={setStepTitle}
                autoFocus
                onSubmitEditing={handleAddStep}
              />
              <Pressable onPress={handleAddStep}>
                <Ionicons name="checkmark" size={18} color="#d4a017" />
              </Pressable>
              <Pressable onPress={() => setAddingStep(false)}>
                <Ionicons name="close" size={18} color="#7a6050" />
              </Pressable>
            </View>
          ) : (
            <Pressable className="flex-row items-center gap-2 pt-2 border-t border-leather-500" onPress={() => setAddingStep(true)}>
              <Ionicons name="add-circle-outline" size={16} color="#7a6050" />
              <Text className="text-leather-400 text-sm">Add step</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
