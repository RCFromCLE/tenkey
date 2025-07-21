// src/app/api/yahoo/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const mode = searchParams.get('mode') || 'search'; // 'search' or 'quote'

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    if (mode === 'search') {
      // Company search functionality
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=6&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter for relevant equity results and include more exchanges
      const quotes = data.quotes?.filter((quote: any) => 
        quote.quoteType === 'EQUITY'
      ).map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchDisp || quote.exchange || 'N/A'
      })).slice(0, 10) || []; // Limit to 10 results

      return NextResponse.json({ quotes });

    } else {
      // Comprehensive quote data for a specific symbol
      // First, get basic chart data
      const chartResponse = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!chartResponse.ok) {
        console.error(`Yahoo Finance API error for ${symbol}: ${chartResponse.status} ${chartResponse.statusText}`);
        // Return mock data for development/testing
        return NextResponse.json({
          symbol: symbol.toUpperCase(),
          price: '0.00',
          change: '0.00',
          changePercent: '0.00%',
          companyName: '',
          exchange: '',
          dayRange: 'N/A',
          volume: 'N/A',
          marketCap: 'N/A',
          error: 'Unable to fetch real-time data'
        });
      }

      const chartData = await chartResponse.json();
      const result = chartData?.chart?.result?.[0];
      const quote = result?.meta;
      const indicators = result?.indicators?.quote?.[0];
      const lastIndex = (indicators?.close?.length || 1) - 1;
      const previousClose = quote?.chartPreviousClose || quote?.previousClose;
      const currentPrice = quote?.regularMarketPrice;
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? ((change / previousClose) * 100) : 0;
      
      // Get additional quote data - try multiple endpoints for better data coverage
      let additionalData: any = {};
      
      try {
        // First try the quoteSummary endpoint
        const quoteResponse = await fetch(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics,financialData`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Accept': '*/*'
            }
          }
        );

        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          const modules = quoteData?.quoteSummary?.result?.[0] || {};
          const price = modules.price || {};
          const summaryDetail = modules.summaryDetail || {};
          const keyStats = modules.defaultKeyStatistics || {};
          const financialData = modules.financialData || {};

          // Extract data with multiple fallbacks
          additionalData = {
            dayRange: price.regularMarketDayRange?.fmt || 
                     `${price.regularMarketDayLow?.fmt || quote.regularMarketDayLow?.toFixed(2) || 'N/A'} - ${price.regularMarketDayHigh?.fmt || quote.regularMarketDayHigh?.toFixed(2) || 'N/A'}`,
            volume: price.regularMarketVolume?.fmt || 
                   summaryDetail.volume?.fmt || 
                   (quote.regularMarketVolume ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(quote.regularMarketVolume) : 'N/A'),
            marketCap: price.marketCap?.fmt || 
                      summaryDetail.marketCap?.fmt || 
                      (quote.marketCap ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(quote.marketCap) : 'N/A'),
            previousClose: summaryDetail.previousClose?.fmt || previousClose.toFixed(2),
            open: summaryDetail.open?.fmt || 
                 price.regularMarketOpen?.fmt || 
                 (quote.regularMarketOpen ? quote.regularMarketOpen.toFixed(2) : 'N/A'),
            bid: summaryDetail.bid?.fmt || 'N/A',
            ask: summaryDetail.ask?.fmt || 'N/A',
            yearRange: summaryDetail.fiftyTwoWeekRange?.fmt || 
                      `${summaryDetail.fiftyTwoWeekLow?.fmt || quote.fiftyTwoWeekLow?.toFixed(2) || 'N/A'} - ${summaryDetail.fiftyTwoWeekHigh?.fmt || quote.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}`,
            eps: keyStats.trailingEps?.fmt || financialData.trailingEps?.fmt || 'N/A',
            pe: summaryDetail.trailingPE?.fmt || 
               keyStats.trailingPE?.fmt || 
               (quote.trailingPE ? quote.trailingPE.toFixed(2) : 'N/A'),
            dividend: summaryDetail.dividendRate && summaryDetail.dividendYield 
                     ? `${summaryDetail.dividendRate.fmt} (${summaryDetail.dividendYield.fmt})` 
                     : 'N/A',
            beta: summaryDetail.beta?.fmt || keyStats.beta?.fmt || 'N/A'
          };
        }
      } catch (error) {
        console.error('Error fetching additional quote data:', error);
      }

      // If we still don't have some data, try to get it from the chart response
      if (additionalData.dayRange === 'N/A' && indicators) {
        const highs = indicators.high || [];
        const lows = indicators.low || [];
        if (highs.length > 0 && lows.length > 0) {
          const dayHigh = Math.max(...highs.filter((h: number) => h != null));
          const dayLow = Math.min(...lows.filter((l: number) => l != null));
          if (dayHigh && dayLow && isFinite(dayHigh) && isFinite(dayLow)) {
            additionalData.dayRange = `${dayLow.toFixed(2)} - ${dayHigh.toFixed(2)}`;
          }
        }
      }

      // Try to get volume from chart data if not available
      if (additionalData.volume === 'N/A' && indicators?.volume) {
        const volumes = indicators.volume.filter((v: number) => v != null);
        if (volumes.length > 0) {
          const totalVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0);
          additionalData.volume = new Intl.NumberFormat('en-US', { 
            notation: 'compact', 
            maximumFractionDigits: 1 
          }).format(totalVolume);
        }
      }
      
      return NextResponse.json({
        symbol,
        price: Number(currentPrice || 0).toFixed(2),
        change: change >= 0 ? `+${Number(change).toFixed(2)}` : Number(change).toFixed(2),
        changePercent: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
        companyName: quote?.instrumentInfo?.shortName || '',
        exchange: quote?.exchangeName || '',
        ...additionalData
      });
    }

  } catch (error: any) {
    console.error('Yahoo Finance API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
