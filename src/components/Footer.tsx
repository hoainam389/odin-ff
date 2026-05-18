export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-8 w-full max-w-container-max mx-auto gap-4">
        <div className="text-label-caps font-label-caps text-on-surface-variant tracking-widest uppercase">
          ODIN CHAMPION LEAGUE v2.4.0
        </div>
        <div className="text-body-sm font-body-sm text-on-surface-variant opacity-60">
          ODIN CHAMPION LEAGUE · NITECO · SEASON 2026
        </div>
      </div>
    </footer>
  );
}
