/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { cn } from '@/lib/utils';
import { ProductFilters, Category } from '@/services/productService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface ProfileFilterProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: Category[];
  companies?: { _id: string; name: string }[];
  className?: string;
  showAdvanced?: boolean;
  onAdvancedToggle?: (show: boolean) => void;
}

export const ProductFilter: React.FC<ProfileFilterProps> = ({
  filters,
  onFiltersChange,
  categories,
  companies = [],
  className,
  showAdvanced = false,
  onAdvancedToggle,
}) => {
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
    onFiltersChange({ ...newFilters, page: 1 });
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof ProductFilters] !== undefined && filters[key as keyof ProductFilters] !== ''
  ).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Filters Row */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search products..."
            className="pl-10 text-gray-900 bg-white/20 placeholder-gray-200 focus:bg-white/30"
          />
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` : ''}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-');
            updateFilter('sortBy', sortBy);
            updateFilter('sortOrder', sortOrder);
          }}
        >
          <SelectTrigger className="w-[160px] bg-white/20 text-gray-900">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white/90 text-gray-900">
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="price-asc">Price Low to High</SelectItem>
            <SelectItem value="price-desc">Price High to Low</SelectItem>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="views-desc">Most Popular</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Toggle */}
        <Button
          variant="outline"
          className="flex items-center gap-2 text-amber-400 border-amber-400 hover:bg-amber-400/10 hover:text-amber-500"
          onClick={() => onAdvancedToggle && onAdvancedToggle(!showAdvanced)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeFiltersCount > 0 && <Badge className="ml-1 bg-amber-400 text-white">{activeFiltersCount}</Badge>}
        </Button>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-200">
          <span>Active filters:</span>
          {filters.search && (
            <Badge className="flex items-center gap-1 bg-teal-500 text-white">
              {filters.search} <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('search')} />
            </Badge>
          )}
          {filters.category && (
            <Badge className="flex items-center gap-1 bg-teal-500 text-white">
              {categories.find((c) => c._id === filters.category)?.name || 'Category'}{' '}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('category')} />
            </Badge>
          )}
          {filters.companyId && (
            <Badge className="flex items-center gap-1 bg-teal-500 text-white">
              {companies.find((c) => c._id === filters.companyId)?.name || 'Company'}{' '}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('companyId')} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="text-gray-200" onClick={() => onFiltersChange({ page: 1 })}>
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      <Collapsible open={showAdvanced} onOpenChange={onAdvancedToggle}>
        <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-white/20 backdrop-blur-md">
          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-200">Category</label>
            <Select value={filters.category || 'all'} onValueChange={(v) => updateFilter('category', v === 'all' ? undefined : v)}>
              <SelectTrigger className="bg-white/10 text-gray-900">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 text-gray-900">
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-200">Company</label>
            <Select value={filters.companyId || 'all'} onValueChange={(v) => updateFilter('companyId', v === 'all' ? undefined : v)}>
              <SelectTrigger className="bg-white/10 text-gray-900">
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 text-gray-900">
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Featured */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-200">Featured</label>
            <Select
              value={filters.featured === undefined ? 'all' : filters.featured ? 'true' : 'false'}
              onValueChange={(v) => updateFilter('featured', v === 'all' ? undefined : v === 'true')}
            >
              <SelectTrigger className="bg-white/10 text-gray-900">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 text-gray-900">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Featured Only</SelectItem>
                <SelectItem value="false">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
