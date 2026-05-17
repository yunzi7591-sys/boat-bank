export function HeaderShell({ children }: { children: React.ReactNode }) {
    return (
        <header
            className="bg-white text-[#061b31] z-50 border-b border-[#e5edf5] shrink-0"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
            {children}
        </header>
    );
}
