'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column {
  key: string
  label: string
  sortable?: boolean
  mobile?: boolean // Show on mobile
  render?: (value: any, row: any) => React.ReactNode
}

interface MobileDataTableProps {
  data: any[]
  columns: Column[]
  title?: string
  searchable?: boolean
  className?: string
}

export function MobileDataTable({
  data,
  columns,
  title,
  searchable = true,
  className,
}: MobileDataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Filter data based on search
  const filteredData = data.filter(row => {
    if (!searchTerm) return true
    return Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0

    const aVal = a[sortColumn]
    const bVal = b[sortColumn]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()

    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr)
    } else {
      return bStr.localeCompare(aStr)
    }
  })

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const mobileColumns = columns.filter(col => col.mobile !== false)
  const desktopOnlyColumns = columns.filter(col => col.mobile === false)

  return (
    <Card className={cn('glass-premium border-primary/20 shadow-xl', className)}>
      {(title || searchable) && (
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {title && <CardTitle className="premium-text-gradient">{title}</CardTitle>}
            {searchable && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {/* Mobile View */}
        <div className="lg:hidden space-y-3">
          {sortedData.map((row, index) => {
            const isExpanded = expandedRows.has(index)
            return (
              <Card key={index} className="glass border border-border/50">
                <CardContent className="p-4">
                  {/* Main mobile columns */}
                  <div className="space-y-2">
                    {mobileColumns.slice(0, 2).map(column => (
                      <div key={column.key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{column.label}</span>
                        <span className="text-sm font-medium">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Expandable section */}
                  {(mobileColumns.length > 2 || desktopOnlyColumns.length > 0) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(index)}
                        className="w-full mt-3 text-xs"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show More
                          </>
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                          {[...mobileColumns.slice(2), ...desktopOnlyColumns].map(column => (
                            <div key={column.key} className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{column.label}</span>
                              <span className="text-xs">
                                {column.render
                                  ? column.render(row[column.key], row)
                                  : row[column.key]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {columns.map(column => (
                    <th key={column.key} className="text-left p-3">
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column.key)}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                        >
                          {column.label}
                          {sortColumn === column.key &&
                            (sortDirection === 'asc' ? (
                              <TrendingUp className="ml-1 h-3 w-3" />
                            ) : (
                              <TrendingDown className="ml-1 h-3 w-3" />
                            ))}
                        </Button>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {column.label}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    {columns.map(column => (
                      <td key={column.key} className="p-3">
                        <div className="text-sm">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedData.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {searchTerm ? `No results found for "${searchTerm}"` : 'No data available'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
