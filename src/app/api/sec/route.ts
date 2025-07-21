// src/app/api/sec/route.ts
import { NextResponse } from 'next/server';
import { truncateFilingContent } from '../../../lib/utils/filing-truncator';

const USER_AGENT = 'TenkeyFinance/1.0.0 contact@tenkey.io';
const DATA_SEC_URL = 'https://data.sec.gov';
const WWW_SEC_URL = 'https://www.sec.gov';

interface CompanyInfo {
  cik_str: number;
  ticker: string;
  title: string;
}

interface CompanyLookupData {
  [key: string]: CompanyInfo;
}

async function fetchWithHeaders(urlString: string, isSecGov: boolean = false) {
  const url = new URL(urlString);
  console.log('Fetching URL:', url.toString());

  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    'Accept': isSecGov ? 'text/html,application/xhtml+xml' : 'application/json',
    'Host': url.hostname
  };

  // Add a delay for SEC.gov requests to respect rate limits
  if (isSecGov) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return fetch(url, {
    headers,
    cache: 'no-store'
  });
}

async function getCIK(input: string): Promise<string> {
  // If the input is already a CIK number (10 digits with leading zeros)
  if (/^\d{10}$/.test(input)) {
    return input;
  }

  // If it's a CIK without leading zeros
  if (/^\d+$/.test(input)) {
    return input.padStart(10, '0');
  }

  console.log('Getting CIK for ticker:', input);
  const response = await fetchWithHeaders(`${WWW_SEC_URL}/files/company_tickers.json`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CIK data: ${response.status}`);
  }

  const data: CompanyLookupData = await response.json();
  const company = Object.values(data).find(
    (info: CompanyInfo) => info.ticker.toLowerCase() === input.toLowerCase()
  );

  if (!company) {
    throw new Error(`Company not found for ticker: ${input}`);
  }

  return company.cik_str.toString().padStart(10, '0');
}

async function getFilings(cik: string, ticker: string) {
  const url = `${DATA_SEC_URL}/submissions/CIK${cik}.json`;
  console.log('Fetching filings from:', url);
  
  const response = await fetchWithHeaders(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch filings: ${response.status}`);
  }

  const data = await response.json();
  const filings: any[] = [];
  
  const recent = data.filings.recent;
  for (let i = 0; i < recent.accessionNumber.length; i++) {
    if (recent.form[i] === '10-K' || recent.form[i] === '10-Q') {
      const accessionNumber = recent.accessionNumber[i].replace(/-/g, '');
      const primaryDocument = recent.primaryDocument[i];
      
      filings.push({
        accessionNumber: recent.accessionNumber[i],
        form: recent.form[i],
        type: recent.form[i],
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate[i],
        primaryDocument,
        textUrl: `${WWW_SEC_URL}/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`,
        htmlUrl: `${WWW_SEC_URL}/ix?doc=/Archives/edgar/data/${cik}/${accessionNumber}/${primaryDocument}`,
        symbol: ticker.toUpperCase()
      });
    }
  }

  return {
    cik,
    name: data.name,
    filings
  };
}

async function getFilingContent(url: string) {
  try {
    console.log('Fetching filing content from:', url);
    const response = await fetchWithHeaders(url, true);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }
    
    const rawContent = await response.text();
    
    return rawContent;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const docUrl = searchParams.get('docUrl');

    console.log('API Request params:', { ticker, docUrl });

    if (docUrl) {
      const content = await getFilingContent(docUrl);
      if (!content) {
        return NextResponse.json(
          { error: 'Failed to process filing content' },
          { status: 400 }
        );
      }
      return NextResponse.json({ content });
    }

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    const cik = await getCIK(ticker);
    console.log('Retrieved CIK:', cik);

    const data = await getFilings(cik, ticker);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
