/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ProductFilters } from '@/services/productService';
import { colors, getTheme, colorClasses } from '@/utils/color';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/social/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Search, X, SlidersHorizontal, Filter, Grid2x2, List, Tag, Star } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface ProductFilterProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  availableTags?: string[];
  className?: string;
  theme?: 'light' | 'dark';
  showAdvanced?: boolean;
  onAdvancedToggle?: (show: boolean) => void;
  compact?: boolean;
  layout?: 'grid' | 'list';
  onLayoutChange?: (layout: 'grid' | 'list') => void;
  showLayoutToggle?: boolean;
  showStatusFilter?: boolean;
  showFeaturedFilter?: boolean;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  filters,
  onFiltersChange,
  availableTags = [],
  className,
  theme = 'light',
  showAdvanced: externalShowAdvanced,
  onAdvancedToggle,
  compact = false,
  layout = 'grid',
  onLayoutChange,
  showLayoutToggle = false,
  showStatusFilter = true,
  showFeaturedFilter = true,
}) => {
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);

  const showAdvanced = externalShowAdvanced !== undefined ? externalShowAdvanced : internalShowAdvanced;
  const toggleAdvanced = onAdvancedToggle || setInternalShowAdvanced;

  const currentTheme = getTheme(theme);

  // Update tags in filters when selectedTags changes
  useEffect(() => {
    if (JSON.stringify(selectedTags) !== JSON.stringify(filters.tags || [])) {
      updateFilter('tags', selectedTags.length > 0 ? selectedTags : undefined);
    }
  }, [selectedTags]);

  const updateFilter = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  const removeFilter = (key: keyof ProductFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];

    // Special handling for tags
    if (key === 'tags') {
      setSelectedTags([]);
    }

    onFiltersChange({ ...newFilters, page: 1 });
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    onFiltersChange({ page: 1 });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      filters[key as keyof ProductFilters] !== undefined &&
      filters[key as keyof ProductFilters] !== '' &&
      filters[key as keyof ProductFilters] !== null &&
      (!Array.isArray(filters[key as keyof ProductFilters]) ||
        (filters[key as keyof ProductFilters] as any[]).length > 0) &&
      key !== 'page' &&
      key !== 'limit'
  ).length;

  // Responsive container
  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${colorClasses.text.gray400}`} />
            <Input
              type="text"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search products..."
              className={cn("pl-10 w-full text-sm", colorClasses.text.gray800)}
              style={{
                backgroundColor: currentTheme.bg.white,
                borderColor: currentTheme.border.gray100,
              }}
            />
          </div>

          {showLayoutToggle && onLayoutChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLayoutChange(layout === 'grid' ? 'list' : 'grid')}
              style={{
                borderColor: currentTheme.border.gray100,
              }}
            >
              {layout === 'grid' ? <List className="h-4 w-4" /> : <Grid2x2 className="h-4 w-4" />}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className={`relative ${colorClasses.text.gray800}`}
            onClick={() => toggleAdvanced(!showAdvanced)}
            style={{
              borderColor: currentTheme.border.gray100,
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <Badge
                className="ml-1 px-1 min-w-[20px] h-5 text-xs"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {showAdvanced && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: currentTheme.bg.white,
              borderColor: currentTheme.border.gray100
            }}
          >
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Tags */}
                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <label className={`text-xs font-medium ${colorClasses.text.gray800}`}>
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleTag(tag)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="space-y-2">
                  <label className={`text-xs font-medium ${colorClasses.text.gray800}`}>
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) => updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={cn("flex-1 text-sm", colorClasses.text.gray800)}
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={cn("flex-1 text-sm", colorClasses.text.gray800)}
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                      }}
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className={`text-xs font-medium ${colorClasses.text.gray800}`}>
                    Sort by
                  </label>
                  <Select
                    value={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` : 'createdAt-desc'}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split('-');
                      updateFilter('sortBy', sortBy);
                      updateFilter('sortOrder', sortOrder);
                    }}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Newest first" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Newest first</SelectItem>
                      <SelectItem value="createdAt-asc">Oldest first</SelectItem>
                      <SelectItem value="price.amount-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price.amount-desc">Price: High to Low</SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="views-desc">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Featured */}
                {showFeaturedFilter && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={filters.featured === true}
                        onCheckedChange={(checked) =>
                          updateFilter('featured', checked === true ? true : undefined)
                        }
                      />
                      <Label htmlFor="featured" className="text-xs font-medium cursor-pointer">
                        <Star className="h-3 w-3 inline mr-1" />
                        Featured Only
                      </Label>
                    </div>
                  </div>
                )}

                {/* Status */}
                {showStatusFilter && (
                  <div className="space-y-2">
                    <label className={`text-xs font-medium ${colorClasses.text.gray800}`}>
                      Status
                    </label>
                    <Select
                      value={filters.status || ''}
                      onValueChange={(v) => updateFilter('status', v || undefined)}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full text-xs ${colorClasses.text.gray400}`}
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${colorClasses.text.gray400}`} />
          <Input
            type="text"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search products by name, description, or tags..."
            className={cn("pl-10 w-full", colorClasses.text.gray800)}
            style={{
              backgroundColor: currentTheme.bg.white,
              borderColor: currentTheme.border.gray100,
            }}
          />
        </div>

        <div className="flex gap-2">
          {/* Layout Toggle */}
          {showLayoutToggle && onLayoutChange && (
            <div className="flex border rounded-md" style={{ borderColor: currentTheme.border.gray100 }}>
              <Button
                variant={layout === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => onLayoutChange('grid')}
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
                variant={layout === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => onLayoutChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Sort */}
          <Select
            value={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` : 'createdAt-desc'}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              updateFilter('sortBy', sortBy);
              updateFilter('sortOrder', sortOrder);
            }}
          >
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest first</SelectItem>
              <SelectItem value="createdAt-asc">Oldest first</SelectItem>
              <SelectItem value="price.amount-asc">Price: Low to High</SelectItem>
              <SelectItem value="price.amount-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="views-desc">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            className={`relative ${colorClasses.text.gray800}`}
            onClick={() => toggleAdvanced(!showAdvanced)}
            style={{
              borderColor: currentTheme.border.gray100,
            }}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge
                className="ml-2 px-2"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white
                }}
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div
          className={cn("flex flex-wrap items-center gap-2 p-3 rounded-lg", colorClasses.text.gray800)}
          style={{
            backgroundColor: currentTheme.bg.gray100,
          }}
        >
          <span className="text-sm font-medium">
            Active filters:
          </span>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: `{filters.search}`
                <X className={`h-3 w-3 cursor-pointer ${colorClasses.text.gray400}`}
                  onClick={() => removeFilter('search')}
                />
              </Badge>
            )}
            {filters.tags && filters.tags.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Tags: {filters.tags.length} selected
                <X className={`h-3 w-3 cursor-pointer ${colorClasses.text.gray400}`}
                  onClick={() => removeFilter('tags')}
                />
              </Badge>
            )}
            {filters.featured !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Featured: {filters.featured ? 'Yes' : 'No'}
                <X className={`h-3 w-3 cursor-pointer ${colorClasses.text.gray400}`}
                  onClick={() => removeFilter('featured')}
                />
              </Badge>
            )}
            {filters.status && showStatusFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filters.status}
                <X className={`h-3 w-3 cursor-pointer ${colorClasses.text.gray400}`}
                  onClick={() => removeFilter('status')}
                />
              </Badge>
            )}
            {filters.minPrice && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Min: ${filters.minPrice}
                <X className={`h-3 w-3 cursor-pointer ${colorClasses.text.gray400}`}
                  onClick={() => removeFilter('minPrice')}
                />
              </Badge>
            )}
            {filters.maxPrice && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Max: ${filters.maxPrice}
                <X className={`h-3 w-3 cursor-pointer ${colorClasses.text.gray400}`}
                  onClick={() => removeFilter('maxPrice')}
                />
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`ml-auto text-sm ${colorClasses.text.gray400}`}
            onClick={clearAllFilters}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      <Collapsible open={showAdvanced} onOpenChange={toggleAdvanced}>
        <CollapsibleContent
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 border rounded-lg"
        >
          <Tabs defaultValue="filters" className="col-span-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="sorting">Sorting & View</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Tags */}
                {availableTags.length > 0 && (
                  <div className="space-y-3 md:col-span-2 lg:col-span-3 xl:col-span-4">
                    <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded"
                      style={{ borderColor: currentTheme.border.gray100 }}
                    >
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedTags.length} of {availableTags.length} tags selected
                    </p>
                  </div>
                )}

                {/* Price Range */}
                <div className="space-y-3 md:col-span-2">
                  <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                    Price Range
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs text-gray-500">Min Price</label>
                      <Input
                        type="number"
                        placeholder="$0.00"
                        value={filters.minPrice || ''}
                        onChange={(e) => updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={cn("w-full", colorClasses.text.gray800)}
                        style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs text-gray-500">Max Price</label>
                      <Input
                        type="number"
                        placeholder="$100.00"
                        value={filters.maxPrice || ''}
                        onChange={(e) => updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={cn("w-full", colorClasses.text.gray800)}
                        style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Featured */}
                {showFeaturedFilter && (
                  <div className="space-y-3">
                    <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                      Featured
                    </label>
                    <Select
                      value={filters.featured === undefined ? '' : filters.featured ? 'true' : 'false'}
                      onValueChange={(v) => updateFilter('featured', v === '' ? undefined : v === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="true">Featured Only</SelectItem>
                        <SelectItem value="false">Not Featured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status */}
                {showStatusFilter && (
                  <div className="space-y-3">
                    <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                      Status
                    </label>
                    <Select
                      value={filters.status || ''}
                      onValueChange={(v) => updateFilter('status', v || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Active" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sorting" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sorting Options */}
                <div className="space-y-3">
                  <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                    Sort Products By
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'createdAt-desc', label: 'Newest First' },
                      { value: 'createdAt-asc', label: 'Oldest First' },
                      { value: 'price.amount-asc', label: 'Price: Low to High' },
                      { value: 'price.amount-desc', label: 'Price: High to Low' },
                      { value: 'name-asc', label: 'Name A-Z' },
                      { value: 'name-desc', label: 'Name Z-A' },
                      { value: 'views-desc', label: 'Most Popular' },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`sort-${option.value}`}
                          name="sorting"
                          value={option.value}
                          checked={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` === option.value : option.value === 'createdAt-desc'}
                          onChange={(e) => {
                            const [sortBy, sortOrder] = e.target.value.split('-');
                            updateFilter('sortBy', sortBy);
                            updateFilter('sortOrder', sortOrder);
                          }}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`sort-${option.value}`} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View Options */}
                {showLayoutToggle && onLayoutChange && (
                  <div className="space-y-3">
                    <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                      View As
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all",
                          layout === 'grid' ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        )}
                        onClick={() => onLayoutChange('grid')}
                      >
                        <Grid2x2 className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium text-center">Grid View</p>
                        <p className="text-xs text-gray-500 text-center">Best for browsing</p>
                      </div>
                      <div
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all",
                          layout === 'list' ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        )}
                        onClick={() => onLayoutChange('list')}
                      >
                        <List className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium text-center">List View</p>
                        <p className="text-xs text-gray-500 text-center">Best for comparison</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="col-span-full flex justify-end gap-3 pt-4 border-t"
            style={{ borderColor: currentTheme.border.gray100 }}
          >
            <Button
              variant="outline"
              onClick={() => toggleAdvanced(false)}
            >
              Close Filters
            </Button>
            <Button
              variant="ghost"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </Button>
            <Button
              onClick={() => toggleAdvanced(false)}
            >
              Apply Filters
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Compact variant for mobile
export const ProductFilterCompact: React.FC<Omit<ProductFilterProps, 'compact'>> = (props) => (
  <ProductFilter {...props} compact={true} />
);

// Desktop sidebar variant
export const ProductFilterSidebar: React.FC<Omit<ProductFilterProps, 'compact'>> = (props) => {
  return (
    <div className="w-64 space-y-4 p-4 border-r"
      style={{ borderColor: props.theme === 'dark' ? '#374151' : '#e5e7eb' }}
    >
      <h3 className="font-semibold text-lg">Filters</h3>
      <ProductFilter {...props} compact={false} />
    </div>
  );
};