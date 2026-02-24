'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterOption {
    value: string;
    label: string;
}

interface SearchFilterProps {
    placeholder?: string;
    filterOptions?: FilterOption[];
    filterLabel?: string;
    onSearchChange: (search: string) => void;
    onFilterChange?: (filter: string) => void;
    defaultFilter?: string;
}

export function SearchFilter({
    placeholder = 'Search...',
    filterOptions,
    filterLabel = 'Filter',
    onSearchChange,
    onFilterChange,
    defaultFilter = 'all',
}: SearchFilterProps) {
    const [search, setSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, onSearchChange]);

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 bg-white dark:bg-zinc-950 border-border/50 focus-visible:ring-primary/20"
                />
                {search && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setSearch('')}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
            {filterOptions && onFilterChange && (
                <Select defaultValue={defaultFilter} onValueChange={onFilterChange}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-zinc-950 border-border/50">
                        <SelectValue placeholder={filterLabel} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All {filterLabel}</SelectItem>
                        {filterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
