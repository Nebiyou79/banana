/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, X } from 'lucide-react';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import { useToast } from '@/hooks/use-toast';

interface SkillsInputProps {
  control: any;
  name: string;
  label?: string;
  placeholder?: string;
  themeMode?: ThemeMode;
}

const SkillsInput: React.FC<SkillsInputProps> = ({
  control,
  name,
  label = "Skills",
  placeholder = "Add a skill and press Enter or click +",
  themeMode = 'light'
}) => {
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();
  const currentTheme = getTheme(themeMode);

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
          <FormLabel className={`font-semibold ${colorClasses.text.darkNavy} text-sm sm:text-base`}>
            {label}
          </FormLabel>
          <FormControl>
            <div className="space-y-3 sm:space-y-4">
              {/* Input with add button */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, field.onChange, field.value || [])}
                  className={`flex-1 text-sm sm:text-base ${colorClasses.border.gray400} focus:ring-2 focus:ring-offset-1 transition-all`}
                  maxLength={100}
                  style={{
                    backgroundColor: currentTheme.bg.primary,
                    color: currentTheme.text.primary
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(field.onChange, field.value || [])}
                  disabled={!inputValue.trim()}
                  className={`
                    px-4 py-2.5 sm:py-3 rounded-lg 
                    hover:opacity-90 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed 
                    transition-all duration-200 flex items-center justify-center
                    gap-1.5 sm:gap-2 ${colorClasses.text.white}
                    min-w-[80px] sm:min-w-[100px]
                  `}
                  style={{ backgroundColor: currentTheme.bg.blue }}
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base font-medium">Add</span>
                </button>
              </div>

              {/* Skills display */}
              <div
                className={`
                  flex flex-wrap gap-2 min-h-[48px] sm:min-h-[56px] 
                  p-3 sm:p-4 border rounded-lg transition-colors
                  ${colorClasses.border.gray400} ${colorClasses.bg.white}
                  hover:border-gray-500 focus-within:border-blue-500
                `}
              >
                {(field.value || []).map((skill: string, index: number) => (
                  <Badge
                    key={`skill-${index}-${skill}`}
                    variant="secondary"
                    className={`
                      flex items-center gap-1.5 py-1.5 px-3 sm:py-2 sm:px-4 
                      text-xs sm:text-sm font-medium rounded-md
                      ${colorClasses.text.white}
                      transition-all duration-200 hover:scale-105
                      hover:shadow-sm active:scale-95
                      max-w-[180px] truncate
                    `}
                    style={{ backgroundColor: currentTheme.bg.gold }}
                  >
                    <span className="truncate">{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(field.onChange, field.value || [], index)}
                      className={`
                        ml-0.5 hover:opacity-70 transition-opacity
                        flex-shrink-0 ${colorClasses.text.white}
                        p-0.5 rounded-sm hover:bg-white/20
                      `}
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </Badge>
                ))}
                {(field.value || []).length === 0 && (
                  <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className={`text-sm italic ${colorClasses.text.gray400} text-center`}>
                      No skills added yet. Start typing above...
                    </span>
                  </div>
                )}
              </div>

              {/* Helper text */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <p className={`text-xs ${colorClasses.text.gray400}`}>
                  Press Enter or click Add button to include skills. Max 50 skills.
                </p>
                <p className={`text-xs ${colorClasses.text.gray400} font-medium`}>
                  {(field.value || []).length}/50 skills added
                </p>
              </div>
            </div>
          </FormControl>
          <FormMessage className="text-xs sm:text-sm" />
        </FormItem>
      )}
    />
  );
};

export default SkillsInput;