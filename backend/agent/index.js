const { Annotation, StateGraph } = require("@langchain/langgraph");
const { ChatGroq } = require("@langchain/groq");
const { SystemMessage, HumanMessage } = require("@langchain/core/messages");
const YahooFinance = require("yahoo-finance2").default || require("yahoo-finance2");
const yf = new YahooFinance();
const { z } = require("zod");

// Define the State
const ResearchState = Annotation.Root({
  companyName: Annotation(),
  financials: Annotation(),
  news: Annotation(),
  historicalData: Annotation(),
  companyImage: Annotation(),
  websiteDomain: Annotation(),
  decision: Annotation(),
  reasoning: Annotation(),
  sentimentScore: Annotation(),
});

const gatherDataNode = async (state) => {
  const { companyName } = state;
  console.log(`[gatherDataNode] Gathering data for: "${companyName}"`);
  try {
    const searchResult = await yf.search(companyName, { newsCount: 0 });
    const quotes = searchResult.quotes;
    console.log(`[gatherDataNode] Found ${quotes.length} quotes for "${companyName}"`);
    
    let ticker = companyName; 
    let equity = null;
    if (quotes && quotes.length > 0) {
      equity = quotes.find((q) => q.quoteType === 'EQUITY') || quotes[0];
      ticker = equity.symbol;
    }

    // Fetch news specific to the resolved ticker symbol for absolute relevance
    let tickerNews = [];
    if (ticker) {
      try {
        const newsResult = await yf.search(ticker, { newsCount: 8 });
        tickerNews = newsResult.news || [];
        console.log(`[gatherDataNode] Retrieved ${tickerNews.length} news items specifically for ticker "${ticker}"`);
      } catch (e) {
        console.error(`Could not fetch news for ticker ${ticker}`, e);
      }
    }

    if (equity) {
      try {
        const llm = new ChatGroq({
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
        });
        
        const prompt = `
        You are an investment assistant. The user searched for a company named: "${companyName}".
        Yahoo Finance returned the following best match:
        - Name: "${equity.longname || equity.shortname}"
        - Ticker Symbol: "${equity.symbol}"
        - Sector/Industry: "${equity.sectorDisp || ''} / ${equity.industryDisp || ''}"
        - Exchange: "${equity.exchDisp || ''}"
        
        Is this resolved public stock actually the company the user searched for? 
        Note: 
        - If the user searched for a private company (like OpenAI, Stripe, SpaceX, ByteDance, Anthropic, etc.) and Yahoo Finance returned an unrelated or similarly-named public company, you MUST mark it as NOT a match.
        - If the user searched for a name that represents this exact public company (like "Apple" resolving to "Apple Inc." or "Google" to "Alphabet Inc."), mark it as a match.
        
        Respond in JSON format:
        {
          "isMatch": true or false,
          "explanation": "If false, explain why (e.g. OpenAI is a private company, and this resolved to a different public company OpenMove AI Berhad listed in Malaysia)."
        }
        `;
        const response = await llm.invoke(prompt);
        const text = response.content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(text);
        console.log("[gatherDataNode] Verification result:", parsed);
        
        if (parsed.isMatch === false || parsed.isMatch === 'false') {
          console.log(`[gatherDataNode] Mismatch detected! Ticker "${equity.symbol}" does not represent "${companyName}". Short-circuiting as private company.`);
          return {
            financials: { isPrivate: true, explanation: parsed.explanation },
            news: [],
            historicalData: [],
            companyImage: null,
            websiteDomain: null,
          };
        } else {
          console.log(`[gatherDataNode] Ticker "${equity.symbol}" verified as a match for "${companyName}".`);
        }
      } catch (e) {
        console.error("Verification failed, assuming match to avoid blocking:", e);
      }
    }

    let financials = null;
    let websiteDomain = null;
    try {
      financials = await yf.quote(ticker);
      const summary = await yf.quoteSummary(ticker, { modules: ['summaryProfile'] });
      if (summary?.summaryProfile?.website) {
        try {
          const url = new URL(summary.summaryProfile.website);
          websiteDomain = url.hostname.replace('www.', '');
        } catch (e) {}
      }
    } catch (e) {
      console.error(`Could not fetch quote for ${ticker}`, e);
      financials = { error: "No financial data available or symbol not found." };
    }

    let historicalData = [];
    try {
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const startDate = fiveYearsAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const chartResult = await yf.chart(ticker, { 
        period1: startDate, 
        period2: endDate, 
        interval: '1d' 
      });
      
      if (chartResult && chartResult.quotes) {
        historicalData = chartResult.quotes
          .map((d) => ({
            date: new Date(d.date).toISOString().split('T')[0],
            price: d.close || d.adjclose
          }))
          .filter((d) => d.price !== undefined);
      }
    } catch (e) {
      console.error(`Could not fetch historical data for ${ticker}`, e);
    }

    let companyImage = null;
    try {
      const resolvedName = financials?.longName || financials?.shortName || (equity ? (equity.longname || equity.shortname) : null) || companyName;
      console.log(`[gatherDataNode] Fetching Wikipedia image for resolved name: "${resolvedName}"`);
      const wikiSearchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(resolvedName)}&format=json&origin=*`);
      const wikiSearchData = await wikiSearchRes.json();
      if (wikiSearchData.query?.search?.[0]) {
        const pageTitle = wikiSearchData.query.search[0].title;
        const wikiImagesListRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=images&imlimit=50&format=json&titles=${encodeURIComponent(pageTitle)}&origin=*`);
        const wikiImagesListData = await wikiImagesListRes.json();
        const pages = wikiImagesListData.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const images = pages[pageId]?.images || [];
          const goodImages = images.filter(img => {
            const title = img.title.toLowerCase();
            return (title.endsWith('.jpg') || title.endsWith('.png')) 
                   && (title.includes('headquarters') || title.includes('campus') || title.includes('building') || title.includes('park') || title.includes('office') || title.includes('aerial') || title.includes('hq') || title.includes('store'))
                   && !title.includes('logo') && !title.includes('icon');
          });
          
          if (goodImages.length > 0) {
            const imgTitle = goodImages[0].title;
            const imgUrlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(imgTitle)}&format=json&origin=*`);
            const imgUrlData = await imgUrlRes.json();
            const imgPages = imgUrlData.query?.pages;
            if (imgPages) {
              const imgPageId = Object.keys(imgPages)[0];
              const url = imgPages[imgPageId]?.imageinfo?.[0]?.url;
              if (url) companyImage = url;
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch Wikipedia image", e);
    }

    // Fallback removed to ensure only high-quality company images are used.

    return {
      financials,
      news: tickerNews || [],
      historicalData,
      companyImage,
      websiteDomain,
    };
  } catch (error) {
    console.error("Error in gatherDataNode:", error);
    return {
      financials: { error: "Failed to gather data" },
      news: [],
      historicalData: [],
      companyImage: null,
      websiteDomain: null,
    };
  }
};

// Node 2: Analyze and Decide
const analyzeNode = async (state) => {
  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  const sysMsg = new SystemMessage(
    `You are an expert AI Investment Research Agent. Your job is to analyze a company's financial data and recent news, and make a definitive decision: 'Invest' or 'Pass'.
    You must output your reasoning clearly, outlining the pros, cons, and ultimate justification for your decision. 
    Format your response EXACTLY as a JSON object with two keys:
    {
      "decision": "Invest" | "Pass",
      "reasoning": "Your detailed reasoning here (can contain markdown like bolding or bullet points)."
    }
    DO NOT output anything other than the JSON object.`
  );

  const humanMsg = new HumanMessage(
    `Please analyze the following company: ${state.companyName}
    
    Financial Data:
    ${JSON.stringify(state.financials, null, 2)}
    
    Recent News:
    ${JSON.stringify(state.news.map(n => ({ title: n.title, publisher: n.publisher, link: n.link })), null, 2)}
    `
  );

  const responseSchema = z.object({
    decision: z.enum(["Invest", "Pass"]),
    sentimentScore: z.number().min(0).max(100).describe("An overall sentiment score from 0 to 100 based on news and financials."),
    reasoning: z.string().describe("Your detailed reasoning outlining pros and cons."),
  });

  const structuredLlm = llm.withStructuredOutput(responseSchema, { name: "invest_decision" });
  
  try {
    const response = await structuredLlm.invoke([sysMsg, humanMsg]);
    return {
      decision: response.decision,
      reasoning: response.reasoning,
      sentimentScore: response.sentimentScore,
    };
  } catch (e) {
    console.error("Failed to generate or parse LLM response:", e);
    return {
      decision: "Pass",
      reasoning: "Failed to generate a conclusive analysis due to an error.",
      sentimentScore: 50,
    };
  }
};

const builder = new StateGraph(ResearchState)
  .addNode("gatherData", gatherDataNode)
  .addNode("analyze", analyzeNode)
  .addEdge("__start__", "gatherData")
  .addEdge("gatherData", "analyze")
  .addEdge("analyze", "__end__");

const researchAgent = builder.compile();

module.exports = { researchAgent };
