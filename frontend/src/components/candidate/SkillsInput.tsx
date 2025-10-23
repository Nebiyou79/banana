/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, X } from 'lucide-react';
import { applyBgColor } from '@/utils/color';
import { useToast } from '@/hooks/use-toast';

interface SkillsInputProps {
  control: any;
  name: string;
  label?: string;
  placeholder?: string;
}

const SkillsInput: React.FC<SkillsInputProps> = ({
  control,
  name,
  label = "Skills",
  placeholder = "Add a skill and press Enter or click +"
}) => {
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();

  const handleAddSkill = (onChange: (skills: string[]) => void, currentSkills: string[]) => {
    try {
      const skill = inputValue.trim();
      if (!skill) {
        toast({
          title: 'Invalid Skill',
          description: 'Skill cannot be empty',
          variant: 'destructive',
        });
        return;
      }

      if (skill && !currentSkills.includes(skill)) {
        if (currentSkills.length >= 50) {
          toast({
            title: 'Maximum Skills Reached',
            description: 'You can only add up to 50 skills',
            variant: 'destructive',
          });
          return;
        }

        const newSkills = [...currentSkills, skill];
        onChange(newSkills);
        setInputValue('');
      } else if (currentSkills.includes(skill)) {
        toast({
          title: 'Duplicate Skill',
          description: 'This skill has already been added',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Add skill error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add skill',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveSkill = (onChange: (skills: string[]) => void, currentSkills: string[], index: number) => {
    try {
      const newSkills = currentSkills.filter((_, i) => i !== index);
      onChange(newSkills);
    } catch (error) {
      console.error('Remove skill error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove skill',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, onChange: (skills: string[]) => void, currentSkills: string[]) => {
    try {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSkill(onChange, currentSkills);
      }
    } catch (error) {
      console.error('Key press error:', error);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-3">
              {/* Input with add button */}
              <div className="flex gap-2">
                <Input
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, field.onChange, field.value || [])}
                  className="flex-1"
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(field.onChange, field.value || [])}
                  disabled={!inputValue.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Skills display */}
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-200 rounded-lg">
                {(field.value || []).map((skill: string, index: number) => (
                  <Badge 
                    key={`skill-${index}-${skill}`}
                    variant="secondary" 
                    className="flex items-center gap-1 py-1.5 px-3 text-sm"
                    style={applyBgColor('gold')}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(field.onChange, field.value || [], index)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(field.value || []).length === 0 && (
                  <span className="text-gray-500 text-sm">No skills added yet</span>
                )}
              </div>

              {/* Helper text */}
              <p className="text-xs text-gray-500">
                Add skills one by one. Press Enter or click the + button to add. Maximum 50 skills allowed.
              </p>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default SkillsInput;