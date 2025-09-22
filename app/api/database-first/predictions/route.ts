/**
 * DATABASE-FIRST PREDICTIONS API
 * Always checks database first, only uses external APIs when database is stale/empty
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("game_id")
    const predictionType = searchParams.get("prediction_type")
    const modelName = searchParams.get("model_name")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    // STEP 1: Check database first
    let predictions = await productionSupabaseClient.getPredictions(gameId || undefined, predictionType || undefined, modelName || undefined, limit)
    let dataSource = 'database'
    let needsRefresh = false

    // STEP 2: Check if data is stale or empty
    if (predictions.length === 0 || forceRefresh) {
      needsRefresh = true
      structuredLogger.info('Database data is stale or empty, fetching from external API', {
        gameId,
        predictionType,
        modelName,
        predictionsCount: predictions.length,
        forceRefresh
      })
    } else {
      // Check if data is stale (older than 10 minutes for predictions)
      const oldestPrediction = predictions.reduce((oldest: any, prediction: any) => {
        const predictionTime = new Date(prediction.last_updated || prediction.updated_at || 0).getTime()
        const oldestTime = new Date(oldest.last_updated || oldest.updated_at || 0).getTime()
        return predictionTime < oldestTime ? prediction : oldest
      })

      const dataAge = Date.now() - new Date(oldestPrediction.last_updated || oldestPrediction.updated_at || 0).getTime()
      const maxAge = 10 * 60 * 1000 // 10 minutes for predictions

      if (dataAge > maxAge) {
        needsRefresh = true
        structuredLogger.info('Database data is stale, refreshing from external API', {
          gameId,
          predictionType,
          modelName,
          dataAgeMinutes: Math.round(dataAge / 60000),
          maxAgeMinutes: Math.round(maxAge / 60000)
        })
      }
    }

    // STEP 3: Fetch from external API if needed
    if (needsRefresh) {
      try {
        const externalPredictions = await cachedUnifiedApiClient.getPredictions('basketball' as any, { 
          limit: 100
        })

        if (externalPredictions && externalPredictions.length > 0) {
          // Update database with fresh data
          await updateDatabaseWithExternalData(externalPredictions)
          
          // Get updated data from database
          predictions = await productionSupabaseClient.getPredictions(gameId || undefined, predictionType || undefined, modelName || undefined, limit)
          dataSource = 'external_api_refreshed'
          
          structuredLogger.info('Successfully refreshed data from external API', {
            gameId,
            predictionType,
            modelName,
            predictionsCount: predictions.length
          })
        } else {
          structuredLogger.warn('External API returned no data, using database fallback', {
            gameId,
            predictionType,
            modelName
          })
          dataSource = 'database_fallback'
        }
      } catch (error) {
        structuredLogger.error('Failed to fetch from external API, using database fallback', {
          gameId,
          predictionType,
          modelName,
          error: error instanceof Error ? error.message : String(error)
        })
        dataSource = 'database_fallback'
      }
    }

    return NextResponse.json({
      success: true,
      data: predictions,
      meta: {
        source: dataSource,
        count: predictions.length,
        gameId,
        predictionType,
        modelName,
        refreshed: needsRefresh,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    structuredLogger.error('Database-first predictions API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Update database with external API data
 */
async function updateDatabaseWithExternalData(externalPredictions: any[]): Promise<void> {
  try {
    // Get existing predictions to avoid duplicates
    const existingPredictions = await productionSupabaseClient.getPredictions()
    const existingPredictionMap = new Map(existingPredictions.map((p: any) => [p.id, p]))

    const predictionsToUpsert = externalPredictions.map(externalPrediction => {
      const existingPrediction = existingPredictionMap.get(externalPrediction.id)
      
      return {
        id: (existingPrediction as any)?.id || externalPrediction.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        game_id: externalPrediction.gameId || null,
        prediction_type: externalPrediction.predictionType || externalPrediction.prediction_type || '',
        predicted_outcome: externalPrediction.predictedOutcome || externalPrediction.predicted_outcome || '',
        confidence: externalPrediction.confidence || 0,
        model_name: externalPrediction.modelName || externalPrediction.model_name || '',
        predicted_value: externalPrediction.predictedValue || externalPrediction.predicted_value || 0,
        is_correct: externalPrediction.isCorrect || externalPrediction.is_correct || null,
        last_updated: new Date().toISOString()
      }
    })

    // Upsert predictions
    await productionSupabaseClient.supabase
      .from('predictions')
      .upsert(predictionsToUpsert, { onConflict: 'id' })

    structuredLogger.info('Successfully updated database with external data', {
      predictionsCount: predictionsToUpsert.length
    })

  } catch (error) {
    structuredLogger.error('Failed to update database with external data', {
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
