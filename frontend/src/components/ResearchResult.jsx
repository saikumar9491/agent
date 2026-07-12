import React, { useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Info, ExternalLink, Download, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';

const getLogoUrl = (domain, shortName = '', symbol = '') => {
  let finalDomain = domain;
  const nameLower = (shortName || '').toLowerCase();
  const symbolLower = (symbol || '').toLowerCase();
  
  if (nameLower.includes('state bank of india') || symbolLower.includes('sbin') || symbolLower.includes('sbidl')) {
    finalDomain = 'bank.sbi';
  } else if (nameLower.includes('tata consultancy') || symbolLower.includes('tcs')) {
    finalDomain = 'tcs.com';
  } else if (nameLower.includes('tata technologies') || symbolLower.includes('tatatech')) {
    finalDomain = 'tatatechnologies.com';
  }

  if (finalDomain) {
    const cleanDomain = finalDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=128`;
  }
  
  const avatarName = shortName || symbol || 'Company';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random&color=fff&size=128&rounded=true&font-size=0.4`;
};

export function ResearchResult({ data }) {
  const reportRef = useRef(null);
  const [hoveredPrice, setHoveredPrice] = useState(null);
  const [timeRange, setTimeRange] = useState('6M');

  if (!data) return null;

  const isInvest = data.decision === "Invest";

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 space-y-6">
      
      {/* Action Bar */}
      <div className="flex justify-end animate-fade-in print:hidden">
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 btn-ios-accent px-4 py-2 rounded-lg font-medium transition-all cursor-pointer"
        >
          <Download size={18} /> Export PDF Report
        </button>
      </div>

      <div ref={reportRef} className="space-y-6 p-6 glass-panel text-slate-800 bg-white">
        
        {/* Main Decision Panel */}
        <div className="glass-panel overflow-hidden animate-slide-up relative border border-slate-200 bg-white">
          
          {/* Real Photo Background Banner */}
          {data.companyImage ? (
            <div className="w-full h-64 relative z-0">
              <img src={data.companyImage} referrerPolicy="no-referrer" alt="Company Cover" className="w-full h-full object-cover rounded-t-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>
          ) : (
            <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-slate-200 relative z-0" />
          )}

          <div className="p-8 relative z-10 -mt-24">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
              <div className="flex items-end gap-5">
                <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm overflow-hidden border border-slate-200 shrink-0">
                  <img 
                    src={getLogoUrl(data.websiteDomain, data.financials?.shortName, data.financials?.symbol)} 
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${data.financials?.shortName || 'Company'}&background=random&color=fff&size=128&rounded=true&font-size=0.4`;
                    }}
                    alt="Company Logo" 
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="mb-2">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 bg-slate-50/90 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    {data.financials?.shortName || 'AI Analysis'}
                    {data.financials?.symbol && <span className="text-xl font-medium text-slate-500 border border-slate-200 bg-slate-100 px-3 py-1 rounded-md">{data.financials.symbol}</span>}
                  </h2>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-2">
                {/* Sentiment Gauge */}
                <div className="flex items-center gap-3 bg-slate-50/90 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeDasharray="100, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        stroke="currentColor" strokeWidth="4" fill="none"
                      />
                      <path
                        className={data.sentimentScore > 50 ? "text-green-500" : "text-red-500"}
                        strokeDasharray={`${data.sentimentScore || 0}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-black text-slate-800">{data.sentimentScore || 0}</span>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">AI Sentiment</p>
                    <p className="font-bold text-slate-800">{data.sentimentScore > 75 ? 'Very Bullish' : data.sentimentScore > 50 ? 'Bullish' : data.sentimentScore > 25 ? 'Bearish' : 'Very Bearish'}</p>
                  </div>
                </div>

                <div className={`px-8 py-4 rounded-xl font-black text-2xl flex items-center gap-3 shadow-sm ${isInvest ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {isInvest ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                  {data.decision}
                </div>
              </div>
            </div>

            </div>

            <div className="glass-panel rounded-2xl p-8 relative z-10 border border-slate-200 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full icon-badge-green flex items-center justify-center shrink-0 shadow-sm">
                  <Info size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest text-sm">
                  Investment Thesis
                </h3>
              </div>
            <div className="text-slate-750 leading-relaxed space-y-5 text-justify text-lg font-medium">
              {data.reasoning.split('\n').map((paragraph, i) => (
                paragraph.trim() && <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
          
          {/* Chart Section */}
          {data.historicalData && data.historicalData.length > 0 && (() => {
            const getFilteredData = (allData) => {
              if (!allData || allData.length === 0) return [];
              const now = new Date(allData[allData.length - 1].date).getTime();
              const day = 24 * 60 * 60 * 1000;
              let daysToKeep = 180;
              switch(timeRange) {
                case '1W': daysToKeep = 7; break;
                case '1M': daysToKeep = 30; break;
                case '3M': daysToKeep = 90; break;
                case '6M': daysToKeep = 180; break;
                case '1Y': daysToKeep = 365; break;
                case '3Y': daysToKeep = 365 * 3; break;
                case '5Y': daysToKeep = 365 * 5; break;
                case 'All': daysToKeep = 365 * 10; break;
                default: daysToKeep = 180; break;
              }
              const cutoff = now - (daysToKeep * day);
              const filtered = allData.filter((d) => new Date(d.date).getTime() >= cutoff);
              return filtered.length > 0 ? filtered : allData;
            };
            
            const chartData = getFilteredData(data.historicalData);
            
            return (
            <div className="glass-panel-white p-6 w-full flex flex-col relative z-10 h-fit">
              <div className="mb-6 flex flex-col gap-1">
                <div className="text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                  {data.financials?.symbol ? `${data.financials.symbol} · ` : ''}{data.financials?.exchange || 'EQ'}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full icon-badge-pink flex items-center justify-center shrink-0 shadow-lg">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {data.financials?.shortName || data.financials?.symbol || 'Unknown Asset'}
                  </h3>
                </div>
                
                {(() => {
                  const firstPrice = chartData[0]?.price || 0;
                  const lastPrice = chartData[chartData.length - 1]?.price || 0;
                  const currentDisplayPrice = hoveredPrice || data.financials?.regularMarketPrice || lastPrice;
                  const priceChange = currentDisplayPrice - firstPrice;
                  const priceChangePercent = (priceChange / firstPrice) * 100;
                  const isPositive = priceChange >= 0;
                  const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
                  
                  const currencyStr = data.financials?.currency === 'INR' ? '₹' : (data.financials?.currency === 'EUR' ? '€' : (data.financials?.currency === 'GBP' ? '£' : '$'));

                  return (
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-3xl font-black text-slate-900">
                        {currencyStr}{currentDisplayPrice.toFixed(2)}
                      </span>
                      <span className={`text-sm font-bold ${colorClass}`}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%) <span className="text-slate-500 font-medium ml-1">{timeRange}</span>
                      </span>
                    </div>
                  );
                })()}
              </div>

              {(() => {
                  const firstPrice = chartData[0]?.price || 0;
                  const lastPrice = chartData[chartData.length - 1]?.price || 0;
                  const currentDisplayPrice = hoveredPrice || data.financials?.regularMarketPrice || lastPrice;
                  const isPositive = (currentDisplayPrice - firstPrice) >= 0;
                  const lineColor = isPositive ? '#22C55E' : '#EF4444';

                  const minPrice = Math.min(...chartData.map((d) => d.price));
                  const maxPrice = Math.max(...chartData.map((d) => d.price));
                  const padding = (maxPrice - minPrice) * 0.1;

                  return (
                    <div className="w-full h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={chartData} 
                          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                          onMouseMove={(e) => {
                            if (e?.activePayload?.[0]?.value) {
                              setHoveredPrice(e.activePayload[0].value);
                            }
                          }}
                          onMouseLeave={() => setHoveredPrice(null)}
                        >
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={lineColor} stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" hide={true} />
                          <YAxis hide={true} domain={[minPrice - padding, maxPrice + padding]} />
                          <ReferenceLine y={firstPrice} stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                            formatter={(value) => [`${data.financials?.currency === 'INR' ? '₹' : '$'}${value.toFixed(2)}`, 'Price']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                          />
                          <Area type="monotone" dataKey="price" stroke={lineColor} strokeWidth={2.5} fillOpacity={1} fill="url(#chartGradient)" dot={false} activeDot={{ r: 6, fill: lineColor, stroke: "#fff", strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  );
              })()}

              <div className="flex items-center gap-2 mt-6 justify-center">
                {['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'All'].map(range => {
                  return (
                  <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${range === timeRange ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:text-[#2563EB]'}`}
                  >
                    {range}
                  </button>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {/* Stats & News Dynamic Wrapper */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* Financial Highlights */}
            {data.financials && (
              <div className="glass-panel p-6 flex flex-col h-full border border-slate-200 bg-white">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full icon-badge-orange flex items-center justify-center shrink-0 shadow-sm">
                    <Activity size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                    Key Metrics
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-grow">
                  <div className="glass-card p-4 flex flex-col justify-center hover:bg-slate-50 transition-colors cursor-default">
                    <span className="text-slate-550 font-bold text-[10px] uppercase tracking-wider mb-1">Current Price</span>
                    <span className="font-black text-2xl text-slate-900">${hoveredPrice ? hoveredPrice.toFixed(2) : data.financials.regularMarketPrice?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="glass-card p-4 flex flex-col justify-center hover:bg-slate-50 transition-colors cursor-default">
                    <span className="text-slate-550 font-bold text-[10px] uppercase tracking-wider mb-1">Market Cap</span>
                    <span className="font-bold text-lg text-orange-600">{data.financials.marketCap ? `$${(data.financials.marketCap / 1e9).toFixed(2)}B` : 'N/A'}</span>
                  </div>
                  <div className="glass-card p-4 flex flex-col justify-center hover:bg-slate-50 transition-colors cursor-default">
                    <span className="text-slate-550 font-bold text-[10px] uppercase tracking-wider mb-1">P/E Ratio</span>
                    <span className="font-bold text-lg text-orange-600">{data.financials.trailingPE?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="glass-card p-4 flex flex-col justify-center hover:bg-slate-50 transition-colors cursor-default">
                    <span className="text-slate-550 font-bold text-[10px] uppercase tracking-wider mb-1">Dividend</span>
                    <span className="font-bold text-lg text-orange-600">{data.financials.dividendYield ? `${(data.financials.dividendYield * 100).toFixed(2)}%` : 'N/A'}</span>
                  </div>
                  <div className="glass-card p-4 flex flex-col justify-center col-span-2 hover:bg-slate-50 transition-colors cursor-default">
                    <span className="text-slate-550 font-bold text-[10px] uppercase tracking-wider mb-1">52 Week Range</span>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="font-bold text-red-500">${data.financials.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}</span>
                      <div className="flex-grow mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-full opacity-50"></div>
                      </div>
                      <span className="font-bold text-green-600">${data.financials.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent News */}
            {data.news && data.news.length > 0 && (
              <div className="glass-panel p-6 flex flex-col h-full border border-slate-200 bg-white">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full icon-badge-blue flex items-center justify-center shrink-0 shadow-sm">
                    <ExternalLink size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                    Latest Catalysts
                  </h3>
                </div>
                <ul className="space-y-3 flex-grow flex flex-col justify-between">
                  {data.news.slice(0, 3).map((item, idx) => {
                    const thumbUrl = item.thumbnail?.resolutions?.[item.thumbnail.resolutions.length - 1]?.url;
                    return (
                      <li key={idx} className="group h-full">
                        <a href={item.link} target="_blank" rel="noreferrer" className="glass-card flex gap-4 items-center h-full p-3 hover:bg-slate-50 transition-all duration-300 hover:border-slate-300">
                          {thumbUrl && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 hidden sm:block border border-slate-100">
                              <img src={thumbUrl} referrerPolicy="no-referrer" alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                          )}
                          <div className="flex-grow">
                            <p className="font-semibold text-slate-700 group-hover:text-[#2563EB] transition-colors line-clamp-2 text-sm leading-snug mb-2">{item.title}</p>
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <span className="text-orange-600">{item.publisher}</span>
                              <span className="text-slate-400">{new Date(item.providerPublishTime).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
