import React from "react";

const Navbar = ({ pages, activePage, onNavigate }) => {
  const navPages = pages.filter((page) => page.id !== "home");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1540px] flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#08111f] text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)]">
            AC
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0f766e]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black tracking-normal text-slate-950 group-hover:text-[#0f766e]">
              Acolyte Campaign Suite
            </span>
            <span className="block truncate text-xs font-bold text-slate-500">
              Studio - Delivery - Intelligence
            </span>
          </span>
        </button>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <nav className="premium-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100/80 p-1">
            {navPages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => onNavigate(page.id)}
                className={`relative min-h-10 shrink-0 rounded-md px-3 py-2 text-sm font-black transition sm:px-4 ${
                  activePage === page.id
                    ? "bg-white text-[#0f766e] shadow-sm"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-950"
                }`}
              >
                {page.label}
                {activePage === page.id && (
                  <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[#0f766e]" />
                )}
              </button>
            ))}
          </nav>

          <div className="hidden min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 shadow-sm xl:flex">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
            Live Workspace
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
