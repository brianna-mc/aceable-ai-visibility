'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/upload', label: 'Upload Data', icon: '↑' },
  { href: '/mentions', label: 'Mention Tracker', icon: '◎' },
  { href: '/gaps', label: 'Content Gaps', icon: '◈' },
  { href: '/recommendations', label: 'Page Recs', icon: '◆' },
  { href: '/briefs', label: 'Content Briefs', icon: '◇' },
  { href: '/analyze', label: 'Page Analyzer', icon: '⊕' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-[#213351] text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-[#DB306A] font-bold text-sm tracking-wide uppercase">Aceable</div>
        <div className="text-white/60 text-xs mt-0.5">LLM Visibility</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs">Powered by Claude AI</p>
      </div>
    </aside>
  );
}
