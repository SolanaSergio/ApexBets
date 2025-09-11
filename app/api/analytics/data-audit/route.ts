import { type NextRequest, NextResponse } from "next/server"
import { dataValidationService } from "@/lib/services/data-validation-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const component = searchParams.get("component");
    const detailed = searchParams.get("detailed") === "true";

    if (component) {
      // Validate specific component
      const result = await dataValidationService.validateComponentDataAccess(component);
      return NextResponse.json({
        component,
        validation: result,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Validate all components
      const [componentResults, recommendations] = await Promise.all([
        dataValidationService.validateAllComponents(),
        dataValidationService.getDataPopulationRecommendations(),
      ]);

      const summary = {
        totalComponents: componentResults.length,
        componentsWithData: componentResults.filter(r => r.hasRequiredData).length,
        componentsMissingData: componentResults.filter(r => !r.hasRequiredData).length,
        dataQualityDistribution: {
          excellent: componentResults.filter(r => r.dataQuality === 'excellent').length,
          good: componentResults.filter(r => r.dataQuality === 'good').length,
          fair: componentResults.filter(r => r.dataQuality === 'fair').length,
          poor: componentResults.filter(r => r.dataQuality === 'poor').length
        },
        criticalIssues: componentResults
          .filter(r => !r.hasRequiredData)
          .map(r => ({
            component: r.component,
            missingData: r.missingData,
            recommendations: r.recommendations
          })),
        dataPopulationRecommendations: recommendations
      }

      if (detailed) {
        return NextResponse.json({
          summary,
          detailedResults: componentResults,
          timestamp: new Date().toISOString()
        })
      } else {
        return NextResponse.json({
          summary,
          timestamp: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error("Data audit error:", error)
    return NextResponse.json({ 
      error: "Failed to perform data audit",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}