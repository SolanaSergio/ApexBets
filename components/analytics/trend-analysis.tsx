"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TrendAnalysisProps {
  team: string
  timeRange: string
}

const trends = [
  {
    category: "Home Performance",
    trend: "up",
    value: "+12.5%",
    description: "Home teams are covering spreads 12.5% more than expected",
    confidence: 0.85,
  },
  {
    category: "Over/Under Totals",
    trend: "down",
    value: "-8.2%",
    description: "Games are going under the total 8.2% more frequently",
    confidence: 0.72,
  },
  {
    category: "Back-to-Back Games",
    trend: "up",
    value: "+15.3%",
    description: "Teams on back-to-back games underperforming by 15.3%",
    confidence: 0.91,
  },
  {
    category: "Divisional Games",
    trend: "neutral",
    value: "±2.1%",
    description: "Divisional games showing normal variance patterns",
    confidence: 0.68,
  },
  {
    category: "Rest Advantage",
    trend: "up",
    value: "+9.7%",
    description: "Teams with 2+ days rest outperforming by 9.7%",
    confidence: 0.79,
  },
]

export function TrendAnalysis({ team, timeRange }: TrendAnalysisProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-500"
      case "down":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Market Trends & Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(trend.trend)}
                  <div>
                    <div className="font-semibold">{trend.category}</div>
                    <div className="text-sm text-muted-foreground">{trend.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getTrendColor(trend.trend)}`}>{trend.value}</div>
                  <Badge variant="outline" className="text-xs">
                    {(trend.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">73%</div>
            <div className="text-sm text-muted-foreground">Profitable Trends</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">+12.8%</div>
            <div className="text-sm text-muted-foreground">Average Edge</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">156</div>
            <div className="text-sm text-muted-foreground">Games Analyzed</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
