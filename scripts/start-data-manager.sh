#!/bin/bash

# ApexBets Data Manager Startup Script
# Enhanced version with full functionality

echo "🚀 ApexBets Enhanced Data Manager"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "scripts/data-services/apex-data-manager.js" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Check for environment file
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found."
    echo "   Make sure your environment variables are configured."
    echo ""
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Parse command line arguments
COMMAND=${1:-start}
SPORT=${2:-}

echo "📋 Command: $COMMAND"
if [ -n "$SPORT" ]; then
    echo "🏀 Sport: $SPORT"
fi
echo ""

# Run the data manager
case $COMMAND in
    start)
        echo "🚀 Starting ApexBets Data Manager..."
        node scripts/data-services/apex-data-manager.js start
        ;;
    stop)
        echo "🛑 Stopping ApexBets Data Manager..."
        node scripts/data-services/apex-data-manager.js stop
        ;;
    status)
        echo "📊 Getting status..."
        node scripts/data-services/apex-data-manager.js status
        ;;
    refresh)
        echo "🔄 Refreshing data..."
        if [ -n "$SPORT" ]; then
            node scripts/data-services/apex-data-manager.js refresh "$SPORT"
        else
            node scripts/data-services/apex-data-manager.js refresh
        fi
        ;;
    validate)
        echo "🔍 Validating data integrity..."
        node scripts/data-services/apex-data-manager.js validate
        ;;
    optimize)
        echo "⚡ Optimizing performance..."
        node scripts/data-services/apex-data-manager.js optimize
        ;;
    emergency-stop)
        echo "🚨 Emergency stop..."
        node scripts/data-services/apex-data-manager.js emergency-stop
        ;;
    help|--help|-h)
        echo "ApexBets Data Manager - Enhanced Version"
        echo ""
        echo "Usage: ./scripts/start-data-manager.sh [command] [sport]"
        echo ""
        echo "Commands:"
        echo "  start           Start the data manager (default)"
        echo "  stop            Stop the data manager"
        echo "  status          Show current status and performance metrics"
        echo "  refresh [sport] Refresh data for all sports or specific sport"
        echo "  validate        Run data integrity validation"
        echo "  optimize        Run performance optimization"
        echo "  emergency-stop  Emergency stop with cleanup"
        echo "  help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./scripts/start-data-manager.sh start"
        echo "  ./scripts/start-data-manager.sh refresh basketball"
        echo "  ./scripts/start-data-manager.sh status"
        echo "  ./scripts/start-data-manager.sh validate"
        echo ""
        echo "Supported Sports:"
        echo "  basketball, football, baseball, hockey, soccer"
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "   Use 'help' to see available commands."
        exit 1
        ;;
esac

echo ""
echo "✅ Script completed."
