# TenKey AI Enhancement Implementation Checklist

## Quick Start Guide for Engineers

This checklist provides step-by-step instructions to implement the advanced data pipeline and RAG integration outlined in the main enhancement plan.

## Prerequisites

### Required Tools & Accounts
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ running locally
- [ ] Redis server for job queues
- [ ] Supabase account created
- [ ] OpenAI API key
- [ ] Git repository access

### Environment Setup
```bash
# Clone and setup
git clone <repository>
cd tenkey-ai
npm install

# Copy environment template
cp .env.example .env
# Fill in required environment variables
```

## Phase 1: PostgreSQL Enhancement (Week 1-2)

### Day 1-2: PostgreSQL Extensions Setup

#### Step 1: Install pgvector Extension
```bash
# For Ubuntu/Debian
sudo apt install postgresql-14-pgvector

# For macOS with Homebrew
brew install pgvector

# Connect to your database and enable extensions
psql -d tenkeyai -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d tenkeyai -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -d tenkeyai -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

#### Step 2: Install Dependencies
```bash
npm install langchain@^0.1.0
npm install @langchain/openai@^0.0.14
npm install @langchain/community@^0.0.20
npm install @prisma/extension-accelerate@^1.0.0
npm install pgvector@^0.1.8
```

#### Step 3: Environment Configuration
Add to `.env`:
```env
# Enhanced PostgreSQL Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/tenkeyai?schema=public"
VECTOR_DIMENSIONS=1536
EMBEDDING_MODEL=text-embedding-3-small
```

### Day 3-5: Database Schema Enhancement

#### Step 4: Update Prisma Schema
```bash
# Update prisma/schema.prisma with enhanced models
# Copy the enhanced schema from TENKEY_AI_ENHANCEMENT_PLAN.md
```

#### Step 5: Create Migration
```bash
# Generate migration for new schema
npx prisma migrate dev --name enhanced_filing_schema
```

#### Step 6: Create Vector Search Functions
```sql
-- Run this SQL directly in your PostgreSQL database
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding text,
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id text,
  chunk_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_embeddings.id,
    document_embeddings.chunk_text,
    1 - (document_embeddings.embedding::vector <=> query_embedding::vector) AS similarity
  FROM document_embeddings
  WHERE 1 - (document_embeddings.embedding::vector <=> query_embedding::vector) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

#### Step 7: Run Migration and Generate Client
```bash
npx prisma db push
npx prisma generate
```

### Day 6-7: Enhanced Prisma Client Setup

#### Step 8: Create Enhanced Prisma Client
```typescript
// src/lib/db/enhanced-client.ts
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

// Enhanced Prisma client with vector search capabilities
export const prisma = new PrismaClient().$extends(withAccelerate())

// Vector search utilities
export class VectorSearchClient {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async searchSimilarDocuments(
    queryEmbedding: number[],
    threshold: number = 0.8,
    limit: number = 5
  ) {
    const embeddingString = JSON.stringify(queryEmbedding)
    
    return await this.prisma.$queryRaw`
      SELECT 
        id,
        chunk_text,
        chunk_type,
        filing_id,
        1 - (embedding::vector <=> ${embeddingString}::vector) AS similarity
      FROM document_embeddings
      WHERE 1 - (embedding::vector <=> ${embeddingString}::vector) > ${threshold}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `
  }

  async addEmbedding(
    filingId: string,
    chunkIndex: number,
    chunkText: string,
    chunkType: string,
    embedding: number[],
    metadata?: any
  ) {
    return await this.prisma.documentEmbedding.create({
      data: {
        filingId,
        chunkIndex,
        chunkText,
        chunkType,
        embedding: JSON.stringify(embedding),
        metadata
      }
    })
  }
}

export const vectorSearch = new VectorSearchClient()
```

#### Step 9: Update Existing Database Client
```typescript
// Update src/lib/db.ts to use enhanced client
export { prisma, vectorSearch } from './db/enhanced-client'
```

### Day 8-10: Data Migration and Testing

#### Step 10: Create Data Migration Script
```typescript
// scripts/migrate-existing-data.ts
import { prisma } from '../src/lib/db'

async function migrateExistingData() {
  // Migrate existing chat data to new filing_documents structure
  const chats = await prisma.chat.findMany({
    include: { user: true }
  })
  
  for (const chat of chats) {
    if (chat.filing && typeof chat.filing === 'object') {
      const filing = chat.filing as any
      
      try {
        await prisma.filingDocument.create({
          data: {
            companyCik: filing.cik || 'unknown',
            companyName: filing.companyName || 'Unknown Company',
            tickerSymbol: filing.symbol || 'UNKNOWN',
            filingType: filing.type || '10-K',
            accessionNumber: filing.accessionNumber || `chat-${chat.id}`,
            filingDate: new Date(filing.filingDate || chat.createdAt),
            reportDate: filing.reportDate ? new Date(filing.reportDate) : null,
            documentUrl: filing.textUrl || filing.htmlUrl || '',
            processingStatus: 'migrated'
          }
        })
      } catch (error) {
        console.error(`Failed to migrate chat ${chat.id}:`, error)
      }
    }
  }
}

migrateExistingData().catch(console.error)
```

#### Step 11: Test Vector Search Setup
```typescript
// scripts/test-vector-search.ts
import { vectorSearch } from '../src/lib/db/enhanced-client'

async function testVectorSearch() {
  // Test embedding storage
  const testEmbedding = new Array(1536).fill(0).map(() => Math.random())
  
  await vectorSearch.addEmbedding(
    'test-filing-id',
    0,
    'This is a test document chunk for vector search.',
    'test',
    testEmbedding
  )
  
  // Test similarity search
  const results = await vectorSearch.searchSimilarDocuments(testEmbedding, 0.5, 5)
  console.log('Vector search test results:', results)
}

testVectorSearch().catch(console.error)
```

## Phase 2: ETL Pipeline Implementation (Week 3-5)

### Day 11-13: Job Queue Setup

#### Step 12: Install Queue Dependencies
```bash
npm install bull@^4.12.0 redis@^4.6.0
npm install @types/bull
```

#### Step 13: Redis Configuration
Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
```

#### Step 14: Create Queue Manager
```typescript
// src/lib/etl/queue-manager.ts
import Queue from 'bull'
import Redis from 'redis'

const redis = Redis.createClient({
  url: process.env.REDIS_URL
})

export const etlQueue = new Queue('ETL Processing', {
  redis: {
    port: 6379,
    host: 'localhost'
  }
})

// Add job processors
etlQueue.process('process-filing', async (job) => {
  const { filingId } = job.data
  // Process filing logic here
})
```

### Day 14-18: Data Source Integration

#### Step 15: Create Data Source Classes
```typescript
// src/lib/etl/data-sources/sec-source.ts
export class SECDataSource {
  async extract(ticker: string) {
    // Enhance existing SEC API integration
    const filings = await this.getFilings(ticker)
    return this.processFilings(filings)
  }
}

// src/lib/etl/data-sources/yahoo-source.ts
export class YahooFinanceSource {
  async extract(ticker: string) {
    // Implement Yahoo Finance integration
  }
}
```

#### Step 16: Create Document Processor
```typescript
// src/lib/etl/document-processor.ts
export class DocumentProcessor {
  async processFilingDocument(document: any) {
    // Extract structured data
    const financial = await this.extractFinancialData(document)
    const business = await this.extractBusinessData(document)
    const risks = await this.extractRiskData(document)
    
    // Store in Supabase
    await this.storeStructuredData({ financial, business, risks })
  }
}
```

### Day 19-21: ETL Pipeline Integration

#### Step 17: Create ETL Pipeline
```typescript
// src/lib/etl/pipeline.ts
export class ETLPipeline {
  async scheduleFilingProcessing(filingData: any) {
    await etlQueue.add('process-filing', {
      filingId: filingData.id,
      priority: this.calculatePriority(filingData)
    })
  }
}
```

#### Step 18: Create API Endpoint
```typescript
// src/app/api/etl/process/route.ts
export async function POST(request: Request) {
  const { filingId } = await request.json()
  
  const pipeline = new ETLPipeline()
  await pipeline.scheduleFilingProcessing({ filingId })
  
  return NextResponse.json({ status: 'scheduled' })
}
```

## Phase 3: RAG Implementation (Week 6-8)

### Day 22-24: LangChain Setup

#### Step 19: Install LangChain Dependencies
```bash
npm install langchain@^0.1.0
npm install @langchain/openai@^0.0.14
npm install @langchain/community@^0.0.20
npm install @langchain/supabase@^0.0.4
```

#### Step 20: Configure OpenAI
Add to `.env`:
```env
OPENAI_API_KEY=your_openai_key
```

### Day 25-28: Vector Store Implementation

#### Step 21: Create Vector Store
```typescript
// src/lib/rag/vector-store.ts
import { OpenAIEmbeddings } from '@langchain/openai'
import { Document } from 'langchain/document'
import { VectorStore } from '@langchain/core/vectorstores'
import { vectorSearch } from '../db/enhanced-client'

export class TenKeyVectorStore extends VectorStore {
  private embeddings: OpenAIEmbeddings

  constructor() {
    super(new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    }), {})
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    })
  }

  async addDocuments(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      const embedding = await this.embeddings.embedQuery(doc.pageContent)
      await vectorSearch.addEmbedding(
        doc.metadata.filingId,
        doc.metadata.chunkIndex,
        doc.pageContent,
        doc.metadata.chunkType,
        embedding,
        doc.metadata
      )
    }
  }

  async similaritySearch(query: string, k: number = 5, filter?: any): Promise<Document[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query)
    const results = await vectorSearch.searchSimilarDocuments(queryEmbedding, 0.8, k)
    
    return results.map((result: any) => new Document({
      pageContent: result.chunk_text,
      metadata: {
        id: result.id,
        filingId: result.filing_id,
        chunkType: result.chunk_type,
        similarity: result.similarity
      }
    }))
  }
}
```

#### Step 22: Test Vector Store Integration
```typescript
// scripts/test-vector-store.ts
import { TenKeyVectorStore } from '../src/lib/rag/vector-store'
import { Document } from 'langchain/document'

async function testVectorStore() {
  const vectorStore = new TenKeyVectorStore()
  
  // Test adding documents
  const testDocs = [
    new Document({
      pageContent: "Apple Inc. reported revenue of $394.3 billion for fiscal year 2022.",
      metadata: { filingId: 'test-filing', chunkIndex: 0, chunkType: 'financial' }
    })
  ]
  
  await vectorStore.addDocuments(testDocs)
  
  // Test similarity search
  const results = await vectorStore.similaritySearch("What was Apple's revenue?", 3)
  console.log('Vector store test results:', results)
}

testVectorStore().catch(console.error)
```

### Day 29-32: RAG Chain Development

#### Step 23: Create RAG Chain
```typescript
// src/lib/rag/rag-chain.ts
import { RetrievalQAChain } from 'langchain/chains'
import { ChatOpenAI } from '@langchain/openai'

export class FinancialRAGChain {
  private chain: RetrievalQAChain
  
  constructor() {
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.1
    })
    
    const vectorStore = new TenKeyVectorStore()
    
    this.chain = RetrievalQAChain.fromLLM(
      llm,
      vectorStore.asRetriever()
    )
  }
  
  async query(question: string) {
    return await this.chain.call({ query: question })
  }
}
```

#### Step 24: Create RAG API Endpoint
```typescript
// src/app/api/rag/query/route.ts
export async function POST(request: Request) {
  const { query, company } = await request.json()
  
  const ragChain = new FinancialRAGChain()
  const result = await ragChain.query(query)
  
  return NextResponse.json(result)
}
```

### Day 33-35: Multi-Agent System

#### Step 25: Create Specialized Agents
```typescript
// src/lib/rag/agents/financial-agent.ts
export class FinancialAnalysisAgent {
  async analyze(ticker: string) {
    // Specialized financial analysis
  }
}

// src/lib/rag/agents/risk-agent.ts
export class RiskAnalysisAgent {
  async analyze(ticker: string) {
    // Specialized risk analysis
  }
}
```

## Phase 4: UI Generation (Week 9-12)

### Day 36-40: Component Generator Setup

#### Step 26: Create Component Generator
```typescript
// src/lib/ui-generation/component-generator.ts
export class ComponentGenerator {
  private llm: ChatOpenAI
  
  async generateDashboardComponent(schema: any, requirements: string) {
    const prompt = `Generate a React component for: ${requirements}`
    const response = await this.llm.call([{ role: 'user', content: prompt }])
    return this.validateCode(response.content)
  }
}
```

#### Step 27: Create UI Generation API
```typescript
// src/app/api/ui-generation/component/route.ts
export async function POST(request: Request) {
  const { componentType, dataSchema, requirements } = await request.json()
  
  const generator = new ComponentGenerator()
  const component = await generator.generateDashboardComponent(dataSchema, requirements)
  
  return NextResponse.json({ component })
}
```

### Day 41-45: Adaptive Components

#### Step 28: Create Adaptive Chart Component
```typescript
// src/components/adaptive/AdaptiveChart.tsx
export function AdaptiveChart({ data, userQuery }: AdaptiveChartProps) {
  const [config, setConfig] = useState(null)
  
  useEffect(() => {
    generateOptimalChart()
  }, [data, userQuery])
  
  const generateOptimalChart = async () => {
    const response = await fetch('/api/ui-generation/chart', {
      method: 'POST',
      body: JSON.stringify({ data, query: userQuery })
    })
    const config = await response.json()
    setConfig(config)
  }
  
  return config ? <DynamicChart config={config} /> : <DefaultChart />
}
```

### Day 46-50: Layout Generation

#### Step 29: Create Layout Generator
```typescript
// src/lib/ui-generation/layout-generator.ts
export class LayoutGenerator {
  async generateDashboardLayout(widgets: Widget[]) {
    // Generate optimal layout based on widget types and relationships
  }
}
```

## Phase 5: Integration (Week 13-14)

### Day 51-56: System Integration

#### Step 30: Update Existing Components
Modify existing filing components to use new RAG system:

```typescript
// Update src/components/filing/FilingChatRefactored.tsx
import { FinancialRAGChain } from '../../lib/rag/rag-chain'

// Add RAG integration to chat responses
```

#### Step 31: Create Real-time Subscriptions
```typescript
// src/lib/streaming/data-stream.ts
export class DataStreamManager {
  setupRealtimeSubscriptions() {
    supabase
      .channel('filing-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'filing_documents' },
        (payload) => this.handleNewFiling(payload.new)
      )
      .subscribe()
  }
}
```

### Day 57-60: Performance Optimization

#### Step 32: Implement Caching
```typescript
// src/lib/cache/redis-cache.ts
export class CacheManager {
  async get(key: string) {
    return await redis.get(key)
  }
  
  async set(key: string, value: any, ttl: number = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value))
  }
}
```

#### Step 33: Add Monitoring
```bash
npm install winston@^3.11.0
```

```typescript
// src/lib/monitoring/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

## Phase 6: Testing & Deployment (Week 15-16)

### Day 61-65: Testing

#### Step 34: Unit Tests
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/rag-chain.test.ts
import { FinancialRAGChain } from '../src/lib/rag/rag-chain'

describe('FinancialRAGChain', () => {
  test('should return relevant financial data', async () => {
    const chain = new FinancialRAGChain()
    const result = await chain.query('What is Apple\'s revenue?')
    expect(result).toBeDefined()
  })
})
```

#### Step 35: Integration Tests
```typescript
// __tests__/etl-pipeline.test.ts
import { ETLPipeline } from '../src/lib/etl/pipeline'

describe('ETL Pipeline', () => {
  test('should process filing successfully', async () => {
    const pipeline = new ETLPipeline()
    const result = await pipeline.processFilingJob(mockJob)
    expect(result.status).toBe('completed')
  })
})
```

### Day 66-70: Deployment

#### Step 36: Environment Setup
```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
REDIS_URL=redis://your-redis-instance
```

#### Step 37: Build and Deploy
```bash
npm run build
npm run start
```

#### Step 38: Health Checks
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    supabase: await checkSupabase()
  }
  
  return NextResponse.json(checks)
}
```

## Verification Steps

### After Each Phase
- [ ] Run all tests: `npm test`
- [ ] Check build: `npm run build`
- [ ] Verify functionality in development
- [ ] Update documentation
- [ ] Commit changes with descriptive messages

### Final Verification
- [ ] End-to-end user flow testing
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation review

## Troubleshooting Guide

### Common Issues

#### PostgreSQL Connection Issues
```typescript
// Check connection
try {
  await prisma.$connect()
  console.log('PostgreSQL connected successfully')
} catch (error) {
  console.error('PostgreSQL connection failed:', error)
}
```

#### Vector Search Not Working
```sql
-- Verify vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check embeddings table
SELECT COUNT(*) FROM document_embeddings;

-- Test vector operations
SELECT embedding::vector FROM document_embeddings LIMIT 1;
```

#### Redis Queue Issues
```typescript
// Check Redis connection
redis.ping((err, result) => {
  if (err) console.error('Redis connection failed:', err)
  else console.log('Redis connected:', result)
})
```

#### LangChain Errors
```typescript
// Debug LangChain calls
try {
  const result = await chain.call({ query: 'test' })
} catch (error) {
  console.error('LangChain error:', error.message)
  // Check API keys and model availability
}
```

## Performance Benchmarks

### Target Metrics
- [ ] Filing processing: < 30 seconds per 10-K
- [ ] RAG query response: < 3 seconds
- [ ] Component generation: < 5 seconds
- [ ] Vector search: < 500ms
- [ ] Database queries: < 100ms

### Monitoring Commands
```bash
# Check Redis memory usage
redis-cli info memory

# Monitor PostgreSQL performance
psql -d tenkeyai -c "SELECT * FROM pg_stat_activity;"

# Check database size
psql -d tenkeyai -c "SELECT pg_size_pretty(pg_database_size('tenkeyai'));"

# Check Node.js memory
node --inspect app.js
```

## Next Steps After Implementation

1. **User Training**: Create user guides and tutorials
2. **Feedback Collection**: Implement user feedback system
3. **Iterative Improvements**: Based on user feedback
4. **Scaling**: Monitor usage and scale infrastructure
5. **Feature Expansion**: Add new data sources and analysis types

## Support Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **pgvector Docs**: https://github.com/pgvector/pgvector
- **LangChain Docs**: https://js.langchain.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Redis Docs**: https://redis.io/documentation
- **Next.js Docs**: https://nextjs.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

Remember to commit your progress regularly and document any deviations from this plan for future reference.
