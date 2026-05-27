import React, { useState } from 'react'
import Navbar from './components/Navbar'
import CampaignForm from './components/CampaignForm'
import TemplateForm from './components/TemplateForm'
import AnalyticsDashboard from './components/AnalyticsDashboard'

const App = () => {
  const [activeView, setActiveView] = useState("templates");

  const tabs = [
    {
      id: "templates",
      label: "Templates"
    },
    {
      id: "campaigns",
      label: "Campaigns"
    },
    {
      id: "analytics",
      label: "Analytics"
    }
  ];

  return (
    <>
    <Navbar />
    <main className="min-h-screen overflow-x-hidden bg-slate-100 p-3 md:p-5">
      <div className="mx-auto w-full max-w-[1500px] min-w-0">
        <div className="mb-6 flex max-w-full flex-wrap rounded-lg border border-slate-300 bg-white p-1 shadow-sm sm:inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                activeView === tab.id
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeView === "templates" && <TemplateForm />}

        {activeView === "campaigns" && (
          <div className="mx-auto max-w-6xl">
            <CampaignForm />
          </div>
        )}

        {activeView === "analytics" && (
          <AnalyticsDashboard />
        )}
      </div>
    </main>
    </>
    
    
  )
}

export default App
