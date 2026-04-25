// src/app/components/Sidebar.tsx
import { useState } from "react";
import {
  X,
  Home,
  ShoppingBag,
  Heart,
  Mail,
  Info,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";
import { useCategories } from "../../hooks/useCategories";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon?: any;
  label: string;
  labelKey?: string;
  path?: string;
  children?: MenuItem[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { categoriesTree } = useCategories();

  const menuItems: MenuItem[] = [
    { icon: Home, labelKey: "menu.home", label: "Home", path: "/" },
    ...categoriesTree.map((category) => ({
      icon: category.name.toLowerCase().includes("handmade") ? Heart : ShoppingBag,
      label: category.name,
      path: `/category/${category.slug}`,
      children: category.children.map((child) => ({
        label: child.name,
        path: `/category/${category.slug}/${child.slug}`,
      })),
    })),
    { icon: Sparkles, labelKey: "menu.custom", label: "Custom Request", path: "/custom-request" },
    { icon: Search, label: "Track Order / Request", path: "/track" },
    { icon: Info, labelKey: "menu.about", label: "About Us", path: "/#about" },
    { icon: Mail, labelKey: "menu.contact", label: "Contact Us", path: "/#contact" },
  ];

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleLinkClick = (path?: string) => {
    onClose();
    if (!path) return;
    if (path.includes("#")) {
      const section = path.split("#")[1];
      setTimeout(() => {
        const element = document.getElementById(section);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0, index: number = 0) => {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.label);
    const Icon = item.icon;
    const displayLabel = item.labelKey ? t(item.labelKey) : item.label;

    return (
      <li key={item.label}>
        {hasChildren ? (
          <>
            {/* Expandable Section */}
            <button
              onClick={() => toggleSection(item.label)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-primary/10 transition-all duration-200 group ${
                level === 0 ? "animate-in fade-in slide-in-from-left" : ""
              }`}
              style={level === 0 ? { animationDelay: `${index * 50}ms` } : {}}
            >
              <div className="flex items-center gap-4">
                {Icon && (
                  <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                )}
                {!Icon && level > 0 && <div className="w-2" />}
                <span
                  className={`text-foreground group-hover:text-primary transition-colors ${
                    level > 0 ? "text-sm" : ""
                  }`}
                >
                  {displayLabel}
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* View All Link for Main Categories */}
            {level === 0 && item.path && isExpanded && (
              <Link
                to={item.path}
                onClick={() => handleLinkClick(item.path)}
                className="block ml-14 px-4 py-2 text-sm text-primary hover:text-accent transition-colors"
              >
                {t("menu.viewAll")}
              </Link>
            )}

            {/* Children */}
            {isExpanded && (
              <ul className={`space-y-1 mt-1 ${level === 0 ? "ml-14" : "ml-6"}`}>
                {Array.isArray(item.children)
                  ? item.children.map((child, childIndex) => renderMenuItem(child, level + 1, childIndex))
                  : null}
              </ul>
            )}
          </>
        ) : (
          /* Regular Link */
          <Link
            to={item.path ?? "#"}
            onClick={() => handleLinkClick(item.path)}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-primary/10 transition-all duration-200 group ${
              level === 0 ? "animate-in fade-in slide-in-from-left" : ""
            }`}
            style={level === 0 ? { animationDelay: `${index * 50}ms` } : {}}
          >
            {Icon && (
              <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Icon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              </div>
            )}
            {!Icon && level > 0 && <div className="w-2" />}
            <span
              className={`text-foreground group-hover:text-primary transition-colors ${
                level > 0 ? "text-sm" : ""
              }`}
            >
              {displayLabel}
            </span>
          </Link>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-card shadow-2xl z-50 transition-transform duration-300 overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 600 }}>
              {t("menu.title")}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-6 overflow-y-auto">
            <ul className="space-y-2">{menuItems.map((item, index) => renderMenuItem(item, 0, index))}</ul>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">{t("common.copyright")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
