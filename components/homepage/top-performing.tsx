
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TopPerforming() {
  const items = [
    { rank: 1, name: 'Moneyline', value: '85%' },
    { rank: 2, name: 'Spread', value: '78%' },
    { rank: 3, name: 'Totals', value: '72%' },
  ];

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
      <CardHeader>
        <CardTitle>Top Performing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.rank} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg">{item.rank}</span>
                <p className="text-muted-foreground">{item.name}</p>
              </div>
              <p className="font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
