import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "../lib/storage";

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button type="button" className="btn-secondary" onClick={onToggle} aria-label="切换主题">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === "dark" ? "日间模式" : "夜间模式"}
    </button>
  );
}
