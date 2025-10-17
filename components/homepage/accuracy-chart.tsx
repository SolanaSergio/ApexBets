
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#10B981', '#EF4444'];

export function AccuracyChart({ accuracy }: { accuracy: number }) {
  const data = [
    { name: 'Correct', value: accuracy },
    { name: 'Incorrect', value: 100 - accuracy },
  ];

  return (
    <div style={{ width: '100px', height: '100px' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={40}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
