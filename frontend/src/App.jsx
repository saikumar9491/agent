"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ChevronLeft } from "lucide-react";
import { ResearchResult } from "./components/ResearchResult";
import { ProgressTerminal } from "./components/ProgressTerminal";
import { Sidebar } from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";
import { AuthPortal } from "./components/AuthPortal";

export default function Home() {
  const { currentUser, loading: authLoading } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  
  // History state
  const [history, setHistory] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize sidebar sizing and fetch history on login
  useEffect(() => {
    // Auto-collapse sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Fetch history from MongoDB whenever the user changes/logs in
  useEffect(() => {
    if (!currentUser) {
      setHistory([]);
      setResult(null);
      setActiveId(null);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/history`, {
          headers: { "x-user-id": currentUser.id }
        });
        const data = await res.json();
        if (res.ok) {
          setHistory(data.history || []);
        } else {
          console.error("Failed to load history:", data.error);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };

    fetchHistory();
  }, [currentUser]);

  const handleNewSearch = () => {
    setCompanyName("");
    setResult(null);
    setError("");
    setActiveId(null);
  };

  const handleSelectHistory = (item) => {
    setCompanyName(item.companyName);
    setResult(item.data);
    setError("");
    setActiveId(item.id);
  };

  const handleDeleteHistory = async (id) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/history?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id }
      });
      
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
        if (activeId === id) {
          handleNewSearch();
        }
      } else {
        const data = await res.json();
        console.error("Failed to delete from DB:", data.error);
      }
    } catch (err) {
      console.error("Failed to delete history:", err);
    }
  };

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !currentUser) return;

    setLoading(true);
    setError("");
    setResult(null);
    setActiveId(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to conduct research");
      }

      setResult(data);

      // Save to MongoDB History
      const saveRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/history`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": currentUser.id 
        },
        body: JSON.stringify({
          companyName: data.financials?.shortName || companyName,
          data: data
        })
      });

      const saveJson = await saveRes.json();
      
      if (saveRes.ok) {
        setHistory(prev => [saveJson.item, ...prev]);
        setActiveId(saveJson.item.id);
      } else {
        console.error("Failed to save history to DB:", saveJson.error);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Full-screen loading while authentication loads
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#22C55E]" size={40} />
      </div>
    );
  }

  // Render Login/Signup Portal if not authenticated
  if (!currentUser) {
    return <AuthPortal />;
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-white">
      
      {/* ChatGPT-style Sidebar */}
      <div className="print:hidden">
        <Sidebar 
          history={history}
          activeId={activeId}
          onSelect={handleSelectHistory}
          onNewSearch={handleNewSearch}
          onDelete={handleDeleteHistory}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 h-screen overflow-y-auto py-20 px-4 flex flex-col items-center relative`}>
        
        {/* Top Right Controls */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3 print:hidden">
          {/* Close Sidebar Button (Desktop) */}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="hidden md:flex p-3 rounded-full glass-panel border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in mt-8 md:mt-0 print:hidden">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              AI Investment Research
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Enter a company name to let our advanced AI agent analyze financials and recent news, providing a definitive investment decision.
            </p>
          </div>

          <form onSubmit={handleResearch} className="relative max-w-2xl mx-auto mt-8">
            <div className="relative flex items-center">
              <Search className="absolute left-6 text-slate-400" size={24} />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apple, Tesla, Nvidia..."
                className="w-full glass-panel border border-slate-200 rounded-full py-4 pl-16 pr-32 text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all shadow-md bg-white"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !companyName.trim()}
                className="absolute right-2 btn-ios-primary px-6 py-2.5 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Analyze"}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-6 p-4 glass-panel border border-red-500/30 rounded-xl text-red-400 text-center animate-slide-up">
              {error}
            </div>
          )}
        </div>

        {loading && <ProgressTerminal />}

        {result && !loading && (
          <div className="w-full">
            <ResearchResult data={result} />
          </div>
        )}
      </main>
    </div>
  );
}
