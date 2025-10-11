'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface FilterProps {
  onFilterChange: (filters: any) => void
}

export function Filter({ onFilterChange }: FilterProps) {
  const [filters, setFilters] = React.useState({})

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="flex flex-wrap gap-4">
      <Input placeholder="Search..." onChange={e => handleFilterChange('search', e.target.value)} />
      <Select onValueChange={value => handleFilterChange('conference', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Conference" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="east">East</SelectItem>
          <SelectItem value="west">West</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
