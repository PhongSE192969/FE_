import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

function NavItem({ item, config, sidebarOpen, location }) {
  const language = useLanguageStore((state) => state.language);
  const t = (translations[language] || translations.vi).sidebar || {};

  const hasChildren = item.children && item.children.length > 0;
  const isParentActive =
    hasChildren && item.children.some((c) => location.pathname === c.href);
  const isSelfActive = location.pathname === item.href;
  const isActive = isSelfActive || isParentActive;

  const [open, setOpen] = useState(isParentActive);
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={
            `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            ${isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`
          }
          style={isActive ?
            {
              background: `${config.accent}20`,
              color: config.accent,
              border: `1px solid ${config.accent}25`
            } : {}}
        >
          <Icon size={18} className="shrink-0" />
          {sidebarOpen && <span className="flex-1 text-left truncate">{t[item.label] || item.label}</span>}
          {sidebarOpen && (
            <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          )}
        </button>

        {open && sidebarOpen && (
          <div className="mt-1 ml-4 space-y-0.5 border-white/10">
            {item.children.map((child) => {
              const childActive = location.pathname === child.href;
              const ChildIcon = child.icon; // Lấy icon của con ở đây

              return (
                <Link
                  key={child.href}
                  to={child.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                  ${childActive ? "" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                  style={childActive ? { color: config.accent, background: `${config.accent}15` } : {}}
                >
                  {/* Thay thế chấm tròn bằng Icon */}
                  {ChildIcon && (
                    <ChildIcon
                      size={16}
                      className="shrink-0"
                      style={{ opacity: childActive ? 1 : 0.5 }}
                    />
                  )}
                  <span className="truncate">{t[child.label] || child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
        ${isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
      style={isActive ? { background: `${config.accent}25`, color: config.accent, border: `1px solid ${config.accent}30` } : {}}
    >
      <Icon size={18} className="shrink-0" />
      {sidebarOpen && <span className="flex-1 truncate">{t[item.label] || item.label}</span>}
      {sidebarOpen && isActive && <ChevronRight size={14} className="opacity-60" />}
    </Link>
  );
}

export default NavItem;