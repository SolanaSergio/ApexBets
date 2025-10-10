/**
 * OpenAPI 3.0 Specification for ApexBets API
 * Comprehensive API documentation with examples
 */

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ApexBets Sports Analytics API',
    description: 'Advanced sports betting analytics platform with ML predictions and value betting detection',
    version: '1.0.0',
    contact: {
      name: 'ApexBets Team',
      email: 'support@apexbets.com',
      url: 'https://apexbets.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://apexbets.com/api',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status endpoints'
    },
    {
      name: 'Sports',
      description: 'Sport configuration and metadata'
    },
    {
      name: 'Database-First',
      description: 'Database-only endpoints (no external API calls)'
    },
    {
      name: 'Hybrid',
      description: 'Database-first with external API fallback'
    },
    {
      name: 'Analytics',
      description: 'Analytics and performance metrics'
    },
    {
      name: 'Predictions',
      description: 'ML predictions and forecasting'
    },
    {
      name: 'Value Betting',
      description: 'Value betting opportunities and analysis'
    },
    {
      name: 'Live Data',
      description: 'Real-time updates and live scores'
    },
    {
      name: 'Admin',
      description: 'Administrative and monitoring endpoints'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health Check',
        description: 'Returns the current health status of the API',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                },
                example: {
                  success: true,
                  status: 'healthy',
                  timestamp: '2024-01-01T12:00:00Z',
                  uptime: 3600,
                  version: '1.0.0'
                }
              }
            }
          },
          '500': {
            description: 'API is unhealthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/health/status': {
      get: {
        tags: ['Health'],
        summary: 'Detailed Health Status',
        description: 'Returns detailed health information including database and external API status',
        responses: {
          '200': {
            description: 'Detailed health status',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DetailedHealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/sports': {
      get: {
        tags: ['Sports'],
        summary: 'Get Supported Sports',
        description: 'Returns list of all supported sports with their configurations',
        parameters: [
          {
            name: 'active',
            in: 'query',
            description: 'Filter by active status',
            schema: {
              type: 'boolean'
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of supported sports',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Sport'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/database-first/teams': {
      get: {
        tags: ['Database-First'],
        summary: 'Get Teams from Database',
        description: 'Returns teams data exclusively from database (no external API calls)',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            required: true,
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'league',
            in: 'query',
            description: 'League to filter by',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 50
            }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            }
          }
        ],
        responses: {
          '200': {
            description: 'Teams data from database',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Team'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/database-first/games': {
      get: {
        tags: ['Database-First'],
        summary: 'Get Games from Database',
        description: 'Returns games data exclusively from database',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            required: true,
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Game status filter',
            schema: {
              type: 'string',
              enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled']
            }
          },
          {
            name: 'date',
            in: 'query',
            description: 'Date filter (YYYY-MM-DD)',
            schema: {
              type: 'string',
              format: 'date'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 50
            }
          }
        ],
        responses: {
          '200': {
            description: 'Games data from database',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Game'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/database-first/games/today': {
      get: {
        tags: ['Database-First'],
        summary: 'Get Today\'s Games',
        description: 'Returns all games scheduled for today',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Today\'s games',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Game'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/database-first/odds': {
      get: {
        tags: ['Database-First'],
        summary: 'Get Odds from Database',
        description: 'Returns betting odds exclusively from database',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            required: true,
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'betType',
            in: 'query',
            description: 'Type of bet',
            schema: {
              type: 'string',
              enum: ['h2h', 'spread', 'totals']
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 50
            }
          }
        ],
        responses: {
          '200': {
            description: 'Odds data from database',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/GameOdds'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/database-first/standings': {
      get: {
        tags: ['Database-First'],
        summary: 'Get Standings from Database',
        description: 'Returns league standings exclusively from database',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            required: true,
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'league',
            in: 'query',
            description: 'League to filter by',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'season',
            in: 'query',
            description: 'Season to filter by',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Standings data from database',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Standing'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/database-first/predictions': {
      get: {
        tags: ['Database-First'],
        summary: 'Get Predictions from Database',
        description: 'Returns ML predictions exclusively from database',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            required: true,
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'predictionType',
            in: 'query',
            description: 'Type of prediction',
            schema: {
              type: 'string',
              enum: ['winner', 'spread', 'total']
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 50
            }
          }
        ],
        responses: {
          '200': {
            description: 'Predictions data from database',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Prediction'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get General Analytics',
        description: 'Returns general analytics and metrics',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'timeRange',
            in: 'query',
            description: 'Time range for analytics',
            schema: {
              type: 'string',
              enum: ['7d', '30d', '90d', '1y'],
              default: '30d'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      $ref: '#/components/schemas/AnalyticsData'
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/analytics/team-performance': {
      get: {
        tags: ['Analytics'],
        summary: 'Get Team Performance Analytics',
        description: 'Returns team performance metrics and statistics',
        parameters: [
          {
            name: 'team',
            in: 'query',
            description: 'Team name or ID',
            required: true,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            required: true,
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'league',
            in: 'query',
            description: 'League to filter by',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'timeRange',
            in: 'query',
            description: 'Time range for analysis',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 365,
              default: 30
            }
          }
        ],
        responses: {
          '200': {
            description: 'Team performance data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    team: {
                      $ref: '#/components/schemas/Team'
                    },
                    performance: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/PerformanceMetric'
                      }
                    },
                    stats: {
                      $ref: '#/components/schemas/TeamStats'
                    },
                    timeRange: {
                      type: 'integer'
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Team not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/analytics/trends': {
      get: {
        tags: ['Analytics'],
        summary: 'Get Analytics Trends',
        description: 'Returns trend analysis with timeout handling and caching',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to analyze',
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball'],
              default: 'all'
            }
          },
          {
            name: 'league',
            in: 'query',
            description: 'League to filter by',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'season',
            in: 'query',
            description: 'Season to analyze',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Trend analysis data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    sport: { type: 'string' },
                    league: { type: 'string' },
                    season: { type: 'string' },
                    trends: {
                      $ref: '#/components/schemas/TrendData'
                    },
                    meta: {
                      $ref: '#/components/schemas/TrendMeta'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Failed to fetch trend data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/predictions/generate': {
      post: {
        tags: ['Predictions'],
        summary: 'Generate ML Predictions',
        description: 'Generates new ML predictions for upcoming games',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sport: {
                    type: 'string',
                    enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball'],
                    description: 'Sport to generate predictions for'
                  },
                  league: {
                    type: 'string',
                    description: 'League to filter by'
                  },
                  days: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 30,
                    default: 7,
                    description: 'Number of days ahead to predict'
                  }
                },
                required: ['sport']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Predictions generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    predictions: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Prediction'
                      }
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        sport: { type: 'string' },
                        league: { type: 'string' },
                        days: { type: 'integer' },
                        generatedAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/predictions/upcoming': {
      get: {
        tags: ['Predictions'],
        summary: 'Get Upcoming Predictions',
        description: 'Returns predictions for upcoming games',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'league',
            in: 'query',
            description: 'League to filter by',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            }
          }
        ],
        responses: {
          '200': {
            description: 'Upcoming predictions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Prediction'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/value-bets': {
      get: {
        tags: ['Value Betting'],
        summary: 'Get Value Betting Opportunities',
        description: 'Returns value betting opportunities from database with ML analysis',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball'],
              default: 'all'
            }
          },
          {
            name: 'league',
            in: 'query',
            description: 'League to filter by',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'betType',
            in: 'query',
            description: 'Type of bet',
            schema: {
              type: 'string',
              enum: ['h2h', 'spread', 'totals']
            }
          },
          {
            name: 'recommendation',
            in: 'query',
            description: 'Recommendation level',
            schema: {
              type: 'string',
              enum: ['high', 'medium', 'low']
            }
          },
          {
            name: 'minValue',
            in: 'query',
            description: 'Minimum value threshold',
            schema: {
              type: 'number',
              minimum: 0,
              maximum: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50
            }
          },
          {
            name: 'activeOnly',
            in: 'query',
            description: 'Only return active opportunities',
            schema: {
              type: 'boolean',
              default: true
            }
          }
        ],
        responses: {
          '200': {
            description: 'Value betting opportunities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ValueBet'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/ValueBetMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/live-updates': {
      get: {
        tags: ['Live Data'],
        summary: 'Get Live Updates',
        description: 'Returns live updates with polling-based approach',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          },
          {
            name: 'league',
            in: 'query',
            description: 'League to filter by',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Live updates data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    live: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/LiveGame'
                      }
                    },
                    recent: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/RecentGame'
                      }
                    },
                    upcoming: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/UpcomingGame'
                      }
                    },
                    summary: {
                      $ref: '#/components/schemas/LiveSummary'
                    },
                    meta: {
                      $ref: '#/components/schemas/ResponseMeta'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/live-stream': {
      get: {
        tags: ['Live Data'],
        summary: 'Live Data Stream',
        description: 'Server-Sent Events stream for real-time updates',
        parameters: [
          {
            name: 'sport',
            in: 'query',
            description: 'Sport to filter by',
            schema: {
              type: 'string',
              enum: ['basketball', 'football', 'soccer', 'hockey', 'baseball']
            }
          }
        ],
        responses: {
          '200': {
            description: 'SSE stream of live updates',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  description: 'Server-Sent Events stream'
                }
              }
            }
          }
        }
      }
    },
    '/admin/api-status': {
      get: {
        tags: ['Admin'],
        summary: 'Get API Status',
        description: 'Returns comprehensive API health and status information',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'API status information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      $ref: '#/components/schemas/ApiStatus'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/admin/database-audit': {
      get: {
        tags: ['Admin'],
        summary: 'Database Audit',
        description: 'Performs comprehensive database audit and health check',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Database audit results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      $ref: '#/components/schemas/DatabaseAudit'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          status: { type: 'string', enum: ['healthy', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
          version: { type: 'string' }
        },
        required: ['success', 'status', 'timestamp']
      },
      DetailedHealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              database: { type: 'object' },
              externalApis: { type: 'object' },
              cache: { type: 'object' },
              memory: { type: 'object' }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        },
        required: ['success', 'error']
      },
      ResponseMeta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          count: { type: 'integer' },
          source: { type: 'string', enum: ['database', 'external', 'cache'] },
          refreshed: { type: 'boolean' }
        }
      },
      Sport: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          displayName: { type: 'string' },
          icon: { type: 'string' },
          color: { type: 'string' },
          isActive: { type: 'boolean' },
          dataSource: { type: 'string' },
          positions: {
            type: 'array',
            items: { type: 'string' }
          },
          scoringFields: {
            type: 'array',
            items: { type: 'string' }
          },
          bettingMarkets: {
            type: 'array',
            items: { type: 'string' }
          },
          seasonConfig: {
            type: 'object',
            properties: {
              startMonth: { type: 'integer' },
              endMonth: { type: 'integer' },
              currentSeason: { type: 'string' }
            }
          },
          rateLimits: {
            type: 'object',
            properties: {
              requests: { type: 'integer' },
              interval: { type: 'string' }
            }
          }
        }
      },
      Team: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          abbreviation: { type: 'string' },
          sport: { type: 'string' },
          league_name: { type: 'string' },
          city: { type: 'string' },
          logo_url: { type: 'string' },
          primary_color: { type: 'string' },
          secondary_color: { type: 'string' },
          founded_year: { type: 'integer' },
          venue: { type: 'string' },
          capacity: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Game: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          external_id: { type: 'string' },
          sport: { type: 'string' },
          league_id: { type: 'string' },
          league_name: { type: 'string' },
          season: { type: 'string' },
          home_team_id: { type: 'string' },
          away_team_id: { type: 'string' },
          home_team_name: { type: 'string' },
          away_team_name: { type: 'string' },
          home_team_score: { type: 'integer' },
          away_team_score: { type: 'integer' },
          game_date: { type: 'string', format: 'date-time' },
          game_time_local: { type: 'string', format: 'time' },
          status: { type: 'string', enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'] },
          game_type: { type: 'string' },
          venue: { type: 'string' },
          attendance: { type: 'integer' },
          weather_conditions: { type: 'string' },
          referee_info: { type: 'string' },
          broadcast_info: { type: 'string' },
          betting_odds: { type: 'object' },
          last_updated: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      GameOdds: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          game_id: { type: 'string' },
          sport: { type: 'string' },
          league: { type: 'string' },
          bet_type: { type: 'string', enum: ['h2h', 'spread', 'totals'] },
          home_odds: { type: 'number' },
          away_odds: { type: 'number' },
          draw_odds: { type: 'number' },
          spread: { type: 'number' },
          total: { type: 'number' },
          over_odds: { type: 'number' },
          under_odds: { type: 'number' },
          bookmaker: { type: 'string' },
          last_updated: { type: 'string', format: 'date-time' },
          expires_at: { type: 'string', format: 'date-time' }
        }
      },
      Standing: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          team_id: { type: 'string' },
          team_name: { type: 'string' },
          sport: { type: 'string' },
          league: { type: 'string' },
          season: { type: 'string' },
          conference: { type: 'string' },
          division: { type: 'string' },
          position: { type: 'integer' },
          wins: { type: 'integer' },
          losses: { type: 'integer' },
          ties: { type: 'integer' },
          win_percentage: { type: 'number' },
          games_behind: { type: 'number' },
          points_for: { type: 'integer' },
          points_against: { type: 'integer' },
          point_differential: { type: 'integer' },
          streak: { type: 'string' },
          last_updated: { type: 'string', format: 'date-time' }
        }
      },
      Prediction: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          game_id: { type: 'string' },
          sport: { type: 'string' },
          league: { type: 'string' },
          prediction_type: { type: 'string', enum: ['winner', 'spread', 'total'] },
          predicted_value: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          model_version: { type: 'string' },
          feature_importance: { type: 'object' },
          created_at: { type: 'string', format: 'date-time' },
          expires_at: { type: 'string', format: 'date-time' }
        }
      },
      AnalyticsData: {
        type: 'object',
        properties: {
          totalGames: { type: 'integer' },
          totalTeams: { type: 'integer' },
          totalPlayers: { type: 'integer' },
          predictionAccuracy: { type: 'number' },
          averageOdds: { type: 'number' },
          valueBetCount: { type: 'integer' },
          lastUpdated: { type: 'string', format: 'date-time' }
        }
      },
      PerformanceMetric: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date-time' },
          opponent: { type: 'string' },
          score: { type: 'string' },
          won: { type: 'boolean' },
          points: { type: 'integer' },
          opponentPoints: { type: 'integer' },
          margin: { type: 'integer' }
        }
      },
      TeamStats: {
        type: 'object',
        properties: {
          wins: { type: 'integer' },
          losses: { type: 'integer' },
          winPercentage: { type: 'number' },
          avgPoints: { type: 'number' },
          avgOpponentPoints: { type: 'number' },
          pointDifferential: { type: 'number' }
        }
      },
      TrendData: {
        type: 'object',
        properties: {
          volume: { type: 'integer' },
          percentage_change: { type: 'number' },
          trend_direction: { type: 'string', enum: ['up', 'down', 'stable'] },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          data_points: { type: 'object' },
          last_updated: { type: 'string', format: 'date-time' }
        }
      },
      TrendMeta: {
        type: 'object',
        properties: {
          games_analyzed: { type: 'integer' },
          teams_analyzed: { type: 'integer' },
          players_analyzed: { type: 'integer' },
          predictions_analyzed: { type: 'integer' },
          historical_games: { type: 'integer' },
          historical_teams: { type: 'integer' },
          season_active: { type: 'boolean' },
          previous_season: { type: 'string' },
          data_quality: { type: 'number' },
          timeout_used: { type: 'boolean' },
          fromCache: { type: 'boolean' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      ValueBet: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          game_id: { type: 'string' },
          sport: { type: 'string' },
          league: { type: 'string' },
          bet_type: { type: 'string', enum: ['h2h', 'spread', 'totals'] },
          side: { type: 'string', enum: ['home', 'away', 'over', 'under'] },
          odds: { type: 'number' },
          predicted_probability: { type: 'number' },
          value: { type: 'number' },
          expected_value: { type: 'number' },
          kelly_percentage: { type: 'number' },
          confidence_score: { type: 'number' },
          recommendation: { type: 'string', enum: ['high', 'medium', 'low'] },
          expires_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      ValueBetMeta: {
        type: 'object',
        properties: {
          source: { type: 'string', enum: ['database'] },
          count: { type: 'integer' },
          sport: { type: 'string' },
          league: { type: 'string' },
          betType: { type: 'string' },
          recommendation: { type: 'string' },
          minValue: { type: 'number' },
          activeOnly: { type: 'boolean' },
          refreshed: { type: 'boolean' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      LiveGame: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          home_team_name: { type: 'string' },
          away_team_name: { type: 'string' },
          home_score: { type: 'integer' },
          away_score: { type: 'integer' },
          status: { type: 'string', enum: ['live'] },
          quarter: { type: 'string' },
          time_remaining: { type: 'string' },
          last_updated: { type: 'string', format: 'date-time' }
        }
      },
      RecentGame: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          home_team_name: { type: 'string' },
          away_team_name: { type: 'string' },
          home_score: { type: 'integer' },
          away_score: { type: 'integer' },
          status: { type: 'string', enum: ['completed'] },
          final_score: { type: 'string' },
          completed_at: { type: 'string', format: 'date-time' }
        }
      },
      UpcomingGame: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          home_team_name: { type: 'string' },
          away_team_name: { type: 'string' },
          status: { type: 'string', enum: ['scheduled'] },
          game_date: { type: 'string', format: 'date-time' },
          venue: { type: 'string' }
        }
      },
      LiveSummary: {
        type: 'object',
        properties: {
          totalLive: { type: 'integer' },
          totalRecent: { type: 'integer' },
          totalUpcoming: { type: 'integer' },
          lastUpdated: { type: 'string', format: 'date-time' }
        }
      },
      ApiStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          uptime: { type: 'number' },
          version: { type: 'string' },
          environment: { type: 'string' },
          database: { type: 'object' },
          externalApis: { type: 'object' },
          cache: { type: 'object' },
          rateLimits: { type: 'object' },
          lastChecked: { type: 'string', format: 'date-time' }
        }
      },
      DatabaseAudit: {
        type: 'object',
        properties: {
          connectionStatus: { type: 'string', enum: ['connected', 'disconnected', 'error'] },
          totalTables: { type: 'integer' },
          totalRows: { type: 'integer' },
          databaseSize: { type: 'string' },
          lastBackup: { type: 'string' },
          schemaIntegrity: { type: 'boolean' },
          dataIntegrity: { type: 'boolean' },
          performanceMetrics: { type: 'object' },
          lastAudit: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}

export default openApiSpec
