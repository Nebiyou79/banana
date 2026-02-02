/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tender/TenderFilters.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  DollarSign,
  Calendar,
  Briefcase,
  Building,
  Globe,
  Lock,
  ChevronDown,
  SlidersHorizontal,
  Tag,
  Star,
  Clock,
  AlertCircle,
  Check,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/Command';
import { Slider } from '@/components/ui/Slider';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import {
  TenderFilter,
  TenderCategoryType,
  WorkflowType,
  ProcurementMethod,
  EvaluationMethod,
  ExperienceLevel,
  ProjectType,
  EngagementType
} from '@/services/tenderService';
import { useCategories } from '@/hooks/useTenders';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface TenderFiltersProps {
  filters: TenderFilter;
  onFiltersChange: (filters: TenderFilter) => void;
  showSticky?: boolean;
  className?: string;
}

export const TenderFilters: React.FC<TenderFiltersProps> = ({
  filters,
  onFiltersChange,
  showSticky = false,
  className = ''
}) => {
  const [localFilters, setLocalFilters] = useState<TenderFilter>(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>('');
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = useCallback((key: keyof TenderFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 }; // Reset to page 1 on filter change
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [localFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const clearedFilters: TenderFilter = {
      page: 1,
      limit: filters.limit || 12,
      status: 'published',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsExpanded(false);
  }, [filters.limit, onFiltersChange]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    const ignoreKeys = ['page', 'limit', 'status', 'sortBy', 'sortOrder'];

    Object.entries(filters).forEach(([key, value]) => {
      if (!ignoreKeys.includes(key) && value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) count++;
        } else if (typeof value === 'object') {
          if (Object.keys(value).length > 0) count++;
        } else {
          count++;
        }
      }
    });

    return count;
  }, [filters]);

  const activeFilterCount = getActiveFilterCount();

  // Extract category options
  const categoryOptions = React.useMemo(() => {
    const options: Array<{ value: string; label: string; group: string }> = [];

    if (categoriesData?.groups) {
      Object.entries(categoriesData.groups).forEach(([groupKey, group]) => {
        group.subcategories.forEach(subcat => {
          options.push({
            value: subcat.id,
            label: subcat.name,
            group: group.name
          });
        });
      });
    }

    return options;
  }, [categoriesData]);

  // Get grouped categories
  const categoryGroups = React.useMemo(() => {
    const groups: Record<string, Array<{ value: string; label: string }>> = {};

    categoryOptions.forEach(option => {
      if (!groups[option.group]) {
        groups[option.group] = [];
      }
      groups[option.group].push({
        value: option.value,
        label: option.label
      });
    });

    return groups;
  }, [categoryOptions]);

  const renderFilterBadge = (label: string, value: string, onRemove: () => void) => (
    <Badge
      variant="secondary"
      className="pl-3 pr-1 py-1.5 bg-bg-secondary text-text-primary hover:bg-bg-secondary/80 transition-colors"
    >
      <span className="text-sm font-medium">{label}:</span>
      <span className="ml-1 font-normal">{value}</span>
      <button
        onClick={onRemove}
        className="ml-2 rounded-full hover:bg-bg-surface p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );

  // Quick filter presets
  const quickFilters = [
    { label: 'Ending Soon', key: 'dateFrom', value: 'today', icon: <Clock className="w-3.5 h-3.5" /> },
    { label: 'New', key: 'sortBy', value: 'createdAt', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: 'Popular', key: 'sortBy', value: 'views', icon: <Star className="w-3.5 h-3.5" /> },
    { label: 'High Budget', key: 'minBudget', value: 5000, icon: <DollarSign className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className={cn(
      "bg-bg-primary dark:bg-bg-surface border-b border-border-secondary",
      showSticky && "sticky top-0 z-50 shadow-sm",
      className
    )}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Filter Bar */}
        <div className="py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search tenders by title, description, or keywords..."
                  className="pl-9 pr-9 h-11 bg-bg-secondary dark:bg-bg-primary border-border-primary focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30"
                  value={localFilters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
                {localFilters.search && (
                  <button
                    onClick={() => updateFilter('search', '')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Filter Presets */}
              <div className="flex items-center gap-1 mr-2">
                {quickFilters.map((filter) => {
                  const isActive = filters[filter.key as keyof TenderFilter] === filter.value;
                  return (
                    <Button
                      key={filter.label}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-9 px-3",
                        isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800"
                      )}
                      onClick={() => {
                        if (isActive) {
                          updateFilter(filter.key as keyof TenderFilter, undefined);
                        } else {
                          updateFilter(filter.key as keyof TenderFilter, filter.value);
                        }
                      }}
                    >
                      {filter.icon}
                      <span className="ml-1.5 hidden sm:inline">{filter.label}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Advanced Filters Toggle */}
              <Button
                variant={isExpanded ? "default" : "outline"}
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-11 px-4 gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge
                    variant="default"
                    className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-11 text-text-muted hover:text-text-primary"
                >
                  Clear all
                  <X className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">
                Active filters:
              </span>
              <div className="flex flex-wrap gap-2">
                {filters.tenderCategory && filters.tenderCategory !== 'all' && (
                  renderFilterBadge(
                    'Type',
                    filters.tenderCategory === 'freelance' ? 'Freelance' : 'Professional',
                    () => updateFilter('tenderCategory', undefined)
                  )
                )}

                {filters.workflowType && filters.workflowType !== 'all' && (
                  renderFilterBadge(
                    'Workflow',
                    filters.workflowType === 'open' ? 'Open' : 'Sealed',
                    () => updateFilter('workflowType', undefined)
                  )
                )}

                {filters.procurementCategory && (
                  renderFilterBadge(
                    'Category',
                    categoryOptions.find(c => c.value === filters.procurementCategory)?.label || filters.procurementCategory,
                    () => updateFilter('procurementCategory', undefined)
                  )
                )}

                {filters.search && (
                  renderFilterBadge(
                    'Search',
                    filters.search.length > 20 ? filters.search.substring(0, 20) + '...' : filters.search,
                    () => updateFilter('search', undefined)
                  )
                )}

                {filters.procurementMethod && (
                  renderFilterBadge(
                    'Method',
                    filters.procurementMethod.replace('_', ' '),
                    () => updateFilter('procurementMethod', undefined)
                  )
                )}

                {filters.cpoRequired !== undefined && (
                  renderFilterBadge(
                    'CPO',
                    filters.cpoRequired ? 'Required' : 'Not Required',
                    () => updateFilter('cpoRequired', undefined)
                  )
                )}
              </div>
            </div>
          )}

          {/* Expanded Advanced Filters */}
          {isExpanded && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 border rounded-xl bg-bg-secondary dark:bg-bg-primary/50 border-border-secondary">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Left Column - Basic Filters */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-text-primary">
                      <Tag className="w-5 h-5" />
                      Basic Filters
                    </h3>

                    {/* Tender Type */}
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm font-medium text-text-primary">Tender Type</Label>
                      <RadioGroup
                        value={localFilters.tenderCategory || 'all'}
                        onValueChange={(value) => updateFilter('tenderCategory', value === 'all' ? undefined : value as TenderCategoryType)}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="type-all" />
                          <Label htmlFor="type-all" className="cursor-pointer text-text-primary">All Types</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="freelance" id="type-freelance" />
                          <Label htmlFor="type-freelance" className="cursor-pointer flex items-center gap-2 text-text-primary">
                            <Briefcase className="w-4 h-4" />
                            Freelance
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="professional" id="type-professional" />
                          <Label htmlFor="type-professional" className="cursor-pointer flex items-center gap-2 text-text-primary">
                            <Building className="w-4 h-4" />
                            Professional
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Workflow Type */}
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm font-medium text-text-primary">Workflow Type</Label>
                      <RadioGroup
                        value={localFilters.workflowType || 'all'}
                        onValueChange={(value) => updateFilter('workflowType', value === 'all' ? undefined : value as WorkflowType)}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="workflow-all" />
                          <Label htmlFor="workflow-all" className="cursor-pointer text-text-primary">All Workflows</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="open" id="workflow-open" />
                          <Label htmlFor="workflow-open" className="cursor-pointer flex items-center gap-2 text-text-primary">
                            <Globe className="w-4 h-4" />
                            Open Tender
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="closed" id="workflow-closed" />
                          <Label htmlFor="workflow-closed" className="cursor-pointer flex items-center gap-2 text-text-primary">
                            <Lock className="w-4 h-4" />
                            Sealed Bid
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm font-medium text-text-primary">
                        Budget Range
                        {localFilters.minBudget !== undefined && localFilters.maxBudget !== undefined && (
                          <span className="ml-2 text-text-muted">
                            (${localFilters.minBudget} - ${localFilters.maxBudget})
                          </span>
                        )}
                      </Label>
                      <div className="space-y-3 sm:space-y-4">
                        <Slider
                          value={[
                            localFilters.minBudget || 0,
                            localFilters.maxBudget || 100000
                          ]}
                          min={0}
                          max={100000}
                          step={1000}
                          onValueChange={(value) => {
                            updateFilter('minBudget', value[0]);
                            updateFilter('maxBudget', value[1]);
                          }}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>$0</span>
                          <span>$50k</span>
                          <span>$100k+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Category Filters */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-text-primary">
                      <Briefcase className="w-5 h-5" />
                      Category & Skills
                    </h3>

                    {/* Category Selection */}
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm font-medium text-text-primary">Category</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-11 bg-bg-primary border-border-primary"
                          >
                            {localFilters.procurementCategory
                              ? categoryOptions.find(c => c.value === localFilters.procurementCategory)?.label
                              : "Select category..."}
                            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full sm:w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search categories..." />
                            <CommandList>
                              <CommandEmpty>No category found.</CommandEmpty>
                              <ScrollArea className="h-64">
                                {Object.entries(categoryGroups).map(([groupName, categories]) => (
                                  <CommandGroup key={groupName} heading={groupName}>
                                    {categories.map((category) => (
                                      <CommandItem
                                        key={category.value}
                                        value={category.value}
                                        onSelect={(currentValue) => {
                                          updateFilter('procurementCategory',
                                            currentValue === localFilters.procurementCategory ? undefined : currentValue
                                          );
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            localFilters.procurementCategory === category.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {category.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                ))}
                              </ScrollArea>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Skills Input */}
                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-sm font-medium text-text-primary">Skills</Label>
                      <Input
                        placeholder="Enter skills (comma separated)"
                        value={typeof localFilters.skills === 'string' ? localFilters.skills : ''}
                        onChange={(e) => updateFilter('skills', e.target.value)}
                        className="h-11 bg-bg-primary border-border-primary"
                      />
                      <p className="text-xs text-text-muted">
                        Example: React, Node.js, UI/UX Design
                      </p>
                    </div>

                    {/* CPO Filter (Professional only) */}
                    {(localFilters.tenderCategory === 'professional' || !localFilters.tenderCategory) && (
                      <div className="space-y-2 sm:space-y-3 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cpo-required"
                            checked={localFilters.cpoRequired === true}
                            onCheckedChange={(checked) =>
                              updateFilter('cpoRequired', checked ? true : undefined)
                            }
                          />
                          <Label
                            htmlFor="cpo-required"
                            className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 text-text-primary"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Requires CPO Only
                          </Label>
                        </div>
                        <p className="text-xs text-text-muted">
                          Show only tenders that require Certified Payment Order
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Advanced Filters */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-text-primary">
                      <Filter className="w-5 h-5" />
                      Advanced Filters
                    </h3>

                    {/* Date Range */}
                    <div className="space-y-3 sm:space-y-4">
                      <Label className="text-sm font-medium text-text-primary">Deadline</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={localFilters.dateFrom === 'today' ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateFilter('dateFrom',
                            localFilters.dateFrom === 'today' ? undefined : 'today'
                          )}
                          className="justify-start h-9"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Ending Soon
                        </Button>
                        <Button
                          variant={localFilters.dateTo === 'week' ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateFilter('dateTo',
                            localFilters.dateTo === 'week' ? undefined : 'week'
                          )}
                          className="justify-start h-9"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Next 7 Days
                        </Button>
                      </div>
                    </div>

                    {/* Experience Level (Freelance) */}
                    {(localFilters.tenderCategory === 'freelance' || !localFilters.tenderCategory) && (
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm font-medium text-text-primary">Experience Level</Label>
                        <RadioGroup
                          value={localFilters.experienceLevel || 'all'}
                          onValueChange={(value) => updateFilter('experienceLevel', value === 'all' ? undefined : value as ExperienceLevel)}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="exp-all" />
                            <Label htmlFor="exp-all" className="cursor-pointer text-sm text-text-primary">All Levels</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="entry" id="exp-entry" />
                            <Label htmlFor="exp-entry" className="cursor-pointer text-sm text-text-primary">Entry Level</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="intermediate" id="exp-intermediate" />
                            <Label htmlFor="exp-intermediate" className="cursor-pointer text-sm text-text-primary">Intermediate</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="expert" id="exp-expert" />
                            <Label htmlFor="exp-expert" className="cursor-pointer text-sm text-text-primary">Expert</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Procurement Method (Professional) */}
                    {(localFilters.tenderCategory === 'professional' || !localFilters.tenderCategory) && (
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm font-medium text-text-primary">Procurement Method</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-11 bg-bg-primary border-border-primary"
                            >
                              {localFilters.procurementMethod
                                ? localFilters.procurementMethod.replace('_', ' ')
                                : "Any method..."}
                              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full sm:w-[250px] p-0" align="start">
                            <Command>
                              <CommandList>
                                <CommandGroup>
                                  <CommandItem
                                    value="all"
                                    onSelect={() => updateFilter('procurementMethod', undefined)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        !localFilters.procurementMethod
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    Any method
                                  </CommandItem>
                                  {['open_tender', 'restricted', 'direct', 'framework'].map((method) => (
                                    <CommandItem
                                      key={method}
                                      value={method}
                                      onSelect={(currentValue: string | undefined) => {
                                        updateFilter('procurementMethod',
                                          currentValue === localFilters.procurementMethod ? undefined : currentValue as ProcurementMethod
                                        );
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          localFilters.procurementMethod === method
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {method.replace('_', ' ')}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-border-secondary">
                <div className="text-sm text-text-muted">
                  {activeFilterCount > 0 ? (
                    <span>{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''} applied</span>
                  ) : (
                    <span>No filters applied</span>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={activeFilterCount === 0}
                    className="flex-1 sm:flex-none"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setIsExpanded(false)}
                    className="flex-1 sm:flex-none"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};