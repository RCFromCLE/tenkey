# LLM Implementation Commands for TenKey AI Enhancement

This document provides a complete set of commands to guide an LLM through implementing the entire TenKey AI enhancement plan. Copy and paste these commands sequentially to your LLM assistant.

## Phase 1: PostgreSQL Enhancement (Week 1-2)

### Command 1: Setup PostgreSQL Extensions
```
I need you to help me enhance my PostgreSQL database for vector search capabilities. Please:

1. Create SQL commands to install the required PostgreSQL extensions:
   - pgvector for vector operations
   - pg_trgm for full-text search
   - uuid-ossp for UUID generation

2. Show me how to run these commands on my local PostgreSQL database named 'tenkeyai'

3. Create a verification script to confirm the extensions are properly installed
```

### Command 2: Install Dependencies
```
I need to install the required npm packages for this enhancement. Please create the exact npm install commands for:

- langchain and related packages (@langchain/openai, @langchain/community)
- @prisma/extension-accelerate for enhanced Prisma functionality
- pgvector for Node.js vector operations
- bull and redis for job queues
- winston for logging
- zod for validation

Provide the complete npm install command with specific versions.
```

### Command 3: Enhanced Prisma Schema
```
I need you to create an enhanced Prisma schema that extends my existing TenKey AI schema. Based on my current schema.prisma file, please:

1. Add new models for:
   - FilingDocument (with company info, filing details, processing status)
   - FinancialMetric (structured financial data)
   - BusinessSegment (business unit information)
   - RiskFactor (risk analysis data)
   - DocumentEmbedding (vector embeddings for RAG)

2. Maintain relationships with existing User and Chat models

3. Include proper indexes and constraints

4. Add comments explaining each model's purpose

Please create the complete enhanced schema.prisma file.
```

### Command 4: Database Migration
```
Now I need to create and run the database migration. Please:

1. Provide the exact command to generate a Prisma migration for the new schema
2. Create the SQL for the vector search function that will work with pgvector
3. Show me how to run the migration and generate the Prisma client
4. Create a verification script to test that the new tables were created correctly
```

### Command 5: Enhanced Prisma Client
```
I need you to create an enhanced Prisma client with vector search capabilities. Please create:

1. A new file `src/lib/db/enhanced-client.ts` that:
   - Extends the base Prisma client with accelerate
   - Includes a VectorSearchClient class with methods for:
     - Adding embeddings to the database
     - Searching for similar documents using vector similarity
     - Batch operations for embeddings

2. Update my existing `src/lib/db.ts` to export the enhanced client

3. Create a test script to verify the vector search functionality works

Provide the complete code for all files.
```

## Phase 2: ETL Pipeline Implementation (Week 3-5)

### Command 6: Job Queue Setup
```
I need to set up a job queue system for background processing. Please create:

1. A Redis-based job queue using Bull
2. Queue manager in `src/lib/etl/queue-manager.ts` with:
   - ETL job processing
   - Error handling and retries
   - Job status monitoring

3. Environment configuration for Redis connection

4. A simple test to verify the queue system works

Provide all the necessary code and configuration.
```

### Command 7: Data Source Classes
```
I need to create data source classes for extracting information from multiple sources. Please create:

1. `src/lib/etl/data-sources/sec-source.ts` - Enhanced SEC data extraction
2. `src/lib/etl/data-sources/yahoo-source.ts` - Yahoo Finance integration
3. `src/lib/etl/data-sources/base-source.ts` - Abstract base class
4. `src/lib/etl/data-source-manager.ts` - Orchestrates multiple sources

Each should include:
- Error handling
- Rate limiting
- Data validation
- TypeScript interfaces

Provide the complete implementation for all files.
```

### Command 8: Document Processor
```
I need an intelligent document processor that uses LLMs to extract structured data. Please create:

1. `src/lib/etl/document-processor.ts` with methods to:
   - Extract financial metrics from SEC filings
   - Identify business segments and KPIs
   - Extract risk factors and compliance information
   - Generate embeddings for RAG

2. Include prompts for each extraction type

3. Add error handling and validation

4. Create interfaces for the extracted data structures

Provide the complete implementation with all prompts and data structures.
```

### Command 9: ETL Pipeline
```
I need a complete ETL pipeline that orchestrates the entire process. Please create:

1. `src/lib/etl/pipeline.ts` with:
   - Job scheduling and prioritization
   - Processing workflow coordination
   - Status tracking and updates
   - Error recovery mechanisms

2. API endpoint `src/app/api/etl/process/route.ts` to trigger processing

3. Monitoring and logging throughout the pipeline

4. A test script to verify the entire pipeline works

Provide all the code and show me how to test it.
```

## Phase 3: RAG Implementation (Week 6-8)

### Command 10: Vector Store Implementation
```
I need to implement a custom vector store that works with my PostgreSQL database. Please create:

1. `src/lib/rag/vector-store.ts` that extends LangChain's VectorStore class
2. Integration with my enhanced Prisma client for vector operations
3. Methods for:
   - Adding documents with embeddings
   - Similarity search with filtering
   - Batch operations
   - Metadata handling

4. Include proper TypeScript types and error handling

5. Create a test script to verify the vector store works with LangChain

Provide the complete implementation.
```

### Command 11: RAG Chain Development
```
I need to create a financial RAG chain for intelligent document retrieval and analysis. Please create:

1. `src/lib/rag/rag-chain.ts` with:
   - Financial-specific prompts
   - Context-aware retrieval
   - Source citation
   - Confidence scoring

2. `src/lib/rag/financial-prompts.ts` with specialized prompts for:
   - Financial analysis
   - Risk assessment
   - Business strategy analysis

3. Integration with my vector store

4. API endpoint `src/app/api/rag/query/route.ts`

Provide all the code with comprehensive prompts and examples.
```

### Command 12: Multi-Agent RAG System
```
I need a multi-agent system with specialized agents for different types of analysis. Please create:

1. `src/lib/rag/agents/financial-agent.ts` - Financial metrics analysis
2. `src/lib/rag/agents/risk-agent.ts` - Risk factor analysis  
3. `src/lib/rag/agents/business-agent.ts` - Business strategy analysis
4. `src/lib/rag/agents/market-agent.ts` - Market analysis
5. `src/lib/rag/multi-agent-rag.ts` - Orchestrates all agents

Each agent should have:
- Specialized prompts and context
- Domain-specific retrieval strategies
- Result synthesis capabilities

Provide the complete multi-agent implementation.
```

## Phase 4: UI Generation (Week 9-12)

### Command 13: Component Generator
```
I need an LLM-powered component generator for creating dynamic React components. Please create:

1. `src/lib/ui-generation/component-generator.ts` with:
   - Dashboard component generation
   - Chart component creation
   - Form generation
   - Code validation and sanitization

2. Prompts for generating:
   - TypeScript React components
   - Tailwind CSS styling
   - Proper error handling
   - Responsive design

3. API endpoint `src/app/api/ui-generation/component/route.ts`

4. Safety measures to prevent code injection

Provide the complete implementation with example prompts.
```

### Command 14: Adaptive Chart Components
```
I need adaptive chart components that optimize based on data and user queries. Please create:

1. `src/components/adaptive/AdaptiveChart.tsx` that:
   - Analyzes data to determine optimal chart type
   - Generates chart configurations using LLM
   - Handles loading and error states
   - Supports multiple chart libraries (Recharts, Chart.js)

2. `src/lib/ui-generation/chart-optimizer.ts` for chart optimization logic

3. API endpoint `src/app/api/ui-generation/chart/route.ts`

4. Example usage in existing filing components

Provide all the code with integration examples.
```

### Command 15: Layout Generator
```
I need an intelligent layout generator for creating optimal dashboard layouts. Please create:

1. `src/lib/ui-generation/layout-generator.ts` with:
   - Grid layout optimization
   - Widget relationship analysis
   - Responsive design generation
   - User preference learning

2. `src/components/adaptive/AdaptiveDashboard.tsx` for dynamic dashboards

3. Layout templates and optimization algorithms

4. Integration with existing TenKey components

Provide the complete layout generation system.
```

## Phase 5: Integration (Week 13-14)

### Command 16: Enhance Existing Components
```
I need to enhance my existing filing chat components to use the new RAG system. Please:

1. Update `src/components/filing/FilingChatRefactored.tsx` to:
   - Integrate with the RAG chain
   - Add toggle for RAG vs traditional responses
   - Include source citations
   - Show confidence scores

2. Add RAG integration to other relevant components

3. Maintain backward compatibility

4. Include feature flags for gradual rollout

Show me exactly what changes to make to each file.
```

### Command 17: Real-time Data Streaming
```
I need a real-time data streaming system for live updates. Please create:

1. `src/lib/streaming/data-stream.ts` with:
   - PostgreSQL change detection (polling-based)
   - Event emission for new filings
   - WebSocket integration for client updates
   - Efficient change detection

2. Client-side hooks for real-time updates

3. Integration with existing components

4. Performance optimization strategies

Provide the complete streaming implementation.
```

### Command 18: Caching and Performance
```
I need to implement caching and performance optimizations. Please create:

1. `src/lib/cache/redis-cache.ts` for Redis-based caching
2. Query result caching for expensive operations
3. Embedding cache for vector operations
4. API response caching middleware
5. Performance monitoring and metrics

Include cache invalidation strategies and monitoring.
```

## Phase 6: Testing & Deployment (Week 15-16)

### Command 19: Comprehensive Testing
```
I need a complete testing suite for all the new functionality. Please create:

1. Unit tests for:
   - Vector search operations
   - RAG chain functionality
   - ETL pipeline components
   - UI generation

2. Integration tests for:
   - End-to-end RAG queries
   - ETL pipeline processing
   - Component generation

3. Performance tests for:
   - Vector search speed
   - RAG response times
   - Database query optimization

Use Jest and React Testing Library. Provide all test files.
```

### Command 20: Health Checks and Monitoring
```
I need comprehensive health checks and monitoring. Please create:

1. `src/app/api/health/route.ts` with checks for:
   - Database connectivity
   - Redis connection
   - Vector search functionality
   - LLM API availability

2. Performance monitoring dashboard

3. Error tracking and alerting

4. Usage analytics and metrics

Provide the complete monitoring implementation.
```

## Final Integration Commands

### Command 21: Environment Configuration
```
I need the complete environment configuration for production deployment. Please provide:

1. All required environment variables with descriptions
2. Docker configuration if needed
3. Production deployment checklist
4. Security considerations and best practices
5. Backup and recovery procedures

Include example .env files for development and production.
```

### Command 22: Documentation and User Guide
```
I need comprehensive documentation for the enhanced system. Please create:

1. API documentation for all new endpoints
2. User guide for new features
3. Developer documentation for extending the system
4. Troubleshooting guide for common issues
5. Performance tuning guide

Include examples and code snippets throughout.
```

### Command 23: Migration and Rollback Plan
```
I need a safe migration plan and rollback strategy. Please create:

1. Step-by-step migration procedure
2. Data backup and verification scripts
3. Rollback procedures if issues occur
4. Feature flag configuration for gradual rollout
5. User communication plan

Include timing estimates and risk assessments.
```

## Usage Instructions

1. **Sequential Execution**: Run these commands in order, as each builds on the previous ones
2. **Verification**: Test each phase before moving to the next
3. **Customization**: Modify prompts based on your specific requirements
4. **Error Handling**: If any command fails, ask the LLM to debug and provide fixes
5. **Documentation**: Ask the LLM to explain any code it generates

## Example Usage Pattern

```
Copy Command 1 → Paste to LLM → Review Output → Test → Move to Command 2
```

Each command is designed to be self-contained while building on previous work. The LLM should provide complete, working code for each request.
