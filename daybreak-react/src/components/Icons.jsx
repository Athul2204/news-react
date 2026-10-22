/* Inline SVG icons (24x24 grid, stroke = currentColor). Pass size / strokeWidth / className as needed. */
function Svg({ size = 18, strokeWidth = 2, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const LogoIcon = (p) => <Svg size={22} {...p}><path d="M6 17a6 6 0 0 1 12 0" /><path d="M2 17h20M12 5v3M5 9l2 2M19 9l-2 2" /></Svg>;
export const HomeIcon = (p) => <Svg size={22} {...p}><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Svg>;
export const BookmarkIcon = (p) => <Svg size={22} {...p}><path d="M6 4h12v17l-6-4-6 4z" /></Svg>;
export const ThemeIcon = (p) => <Svg size={22} {...p}><circle cx="12" cy="12" r="8" /><path d="M12 4v16a8 8 0 0 0 0-16z" fill="currentColor" /></Svg>;
export const SearchIcon = (p) => <Svg size={22} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>;
export const CloseIcon = (p) => <Svg strokeWidth={2.5} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const PlusIcon = (p) => <Svg strokeWidth={2.5} {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const ChevronLeftIcon = (p) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;
export const ChevronRightIcon = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
export const EyeIcon = (p) => <Svg size={22} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>;

/* Sidebar */
export const ResearchIcon = (p) => <Svg {...p}><path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3" /><path d="M7.5 15h9" /></Svg>;
export const DatabaseIcon = (p) => <Svg {...p}><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></Svg>;
export const UsersIcon = (p) => <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></Svg>;
export const PenIcon = (p) => <Svg {...p}><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z" /><path d="M14 7l3 3" /></Svg>;
export const SlidersIcon = (p) => <Svg {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Svg>;
export const LogoutIcon = (p) => <Svg {...p}><path d="M10 7l5 5-5 5M15 12H4M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" /></Svg>;

/* Source cards (24px) */
export const NewspaperIcon = (p) => <Svg size={24} {...p}><path d="M5 4h11a1 1 0 0 1 1 1v15H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z" /><path d="M17 9h3v9a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h5" /></Svg>;
export const GitIcon = (p) => <Svg size={24} {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="9" r="2.5" /><path d="M6 8.5v7M18 11.5c0 3-3 4-6 4H8.5" /></Svg>;
export const PaperIcon = (p) => <Svg size={24} {...p}><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v4h4M10 12h6M10 16h6" /></Svg>;
export const BankIcon = (p) => <Svg size={24} {...p}><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" /></Svg>;
export const ChatIcon = (p) => <Svg size={24} {...p}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></Svg>;

/* Brand logos (filled, multi-colour) */
export const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.8V6.5H1.4a12 12 0 0 0 0 11l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
  </svg>
);
export const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);
export const ChartIcon = (p) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>;
