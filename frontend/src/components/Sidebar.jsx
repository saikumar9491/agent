import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';



export function Sidebar({ history, activeId, onSelect, onNewSearch, onDelete, isOpen, setIsOpen }) {
  const { currentUser, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed md:sticky top-0 left-0 h-screen z-50 bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-full'}`}
      >
        {isOpen && (
          <div className="flex flex-col h-full w-72 p-4">
            
            {/* New Search Button */}
            <button 
               onClick={() => {
                 onNewSearch();
                 if (window.innerWidth < 768) setIsOpen(false);
               }}
               className="flex items-center gap-3 w-full p-3 mb-6 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-slate-700 font-medium cursor-pointer"
             >
              <Plus size={18} />
              New Research
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Previous Research</h3>
              
              {!currentUser ? (
                <div className="px-2 py-4 text-center space-y-3">
                  <p className="text-sm text-slate-500">Log in to save and view your research history.</p>
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400 px-2 italic">No history yet.</p>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${activeId === item.id ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
                    onClick={() => {
                      onSelect(item);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare size={16} className={`shrink-0 ${activeId === item.id ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{item.companyName}</p>
                        <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-all shrink-0 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {currentUser ? (
              <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-800 truncate">{currentUser.username}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="mt-auto pt-4 border-t border-slate-200">
                <button 
                  onClick={() => document.getElementById('trigger-login')?.click()}
                  className="w-full py-3 btn-ios-primary rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  Log In / Sign Up
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-6 left-4 z-50 p-3 rounded-full glass-panel border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
          title="Open History"
        >
          <ChevronRight size={20} />
        </button>
      )}
      
      {/* Close button inside when open on mobile */}
      {isOpen && (
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed top-6 right-4 z-50 p-3 rounded-full glass-panel border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
      )}
    </>
  );
}
