import { Outlet, NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

const SideNavBar = () => {
  return (
    <nav className="fixed left-0 top-0 h-full w-16 md:w-20 bg-surface dark:bg-surface border-r border-border-subtle dark:border-outline-variant flex flex-col items-center py-6 z-50">
      <div className="mb-8 flex flex-col items-center justify-center cursor-pointer">
        <div className="w-10 h-10 bg-primary text-on-primary rounded flex items-center justify-center font-bold text-lg leading-none tracking-tighter">
          Lx
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full items-center">
        <NavLink 
          to="/chat" 
          className={({isActive}) => `flex flex-col items-center gap-1 w-full py-2 transition-transform active:scale-95 ${isActive ? 'text-primary dark:text-primary font-bold border-r-2 border-primary bg-surface-muted' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-muted dark:hover:bg-surface-container-high transition-colors'}`}
        >
          <span className="material-symbols-outlined text-[24px]">chat</span>
          <span className="font-label-caps text-label-caps mt-1 hidden md:block text-[10px]">Chat</span>
        </NavLink>
        <NavLink 
          to="/database" 
          className={({isActive}) => `flex flex-col items-center gap-1 w-full py-2 transition-transform active:scale-95 ${isActive ? 'text-primary dark:text-primary font-bold border-r-2 border-primary bg-surface-muted' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-muted dark:hover:bg-surface-container-high transition-colors'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: isActive ? "'FILL' 1" : ""}}>database</span>
          <span className="font-label-caps text-label-caps mt-1 hidden md:block text-[10px]">Database</span>
        </NavLink>
        <NavLink 
          to="/editor" 
          className={({isActive}) => `flex flex-col items-center gap-1 w-full py-2 transition-transform active:scale-95 ${isActive ? 'text-primary dark:text-primary font-bold border-r-2 border-primary bg-surface-muted' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-muted dark:hover:bg-surface-container-high transition-colors'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: isActive ? "'FILL' 1" : ""}}>edit_note</span>
          <span className="font-label-caps text-label-caps mt-1 hidden md:block text-[10px] text-center px-1">LaTeX</span>
        </NavLink>
        <NavLink 
          to="/library" 
          className={({isActive}) => `flex flex-col items-center gap-1 w-full py-2 transition-transform active:scale-95 ${isActive ? 'text-primary dark:text-primary font-bold border-r-2 border-primary bg-surface-muted' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-muted dark:hover:bg-surface-container-high transition-colors'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: isActive ? "'FILL' 1" : ""}}>library_books</span>
          <span className="font-label-caps text-label-caps mt-1 hidden md:block text-[10px]">Library</span>
        </NavLink>
      </div>
      <div className="mt-auto">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </nav>
  );
};

const TopNavBar = () => {
  return (
    <header className="fixed top-0 right-0 left-16 md:left-20 h-16 bg-surface dark:bg-surface border-b border-border-subtle dark:border-outline-variant flex justify-between items-center px-4 md:px-8 z-40">
      <div className="flex items-center gap-4 md:gap-8">
        <span className="font-headline-md text-headline-md text-primary dark:text-primary font-black tracking-tight">Lexis Legal</span>
        <nav className="hidden md:flex gap-6">
          <a href="#" className="font-body-md text-body-md text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-primary transition-colors">Drafts</a>
          <a href="#" className="font-body-md text-body-md text-primary dark:text-primary font-bold border-b-2 border-primary pb-1">Recent</a>
          <a href="#" className="font-body-md text-body-md text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-primary transition-colors">Starred</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
          <input type="text" placeholder="Search..." className="w-full bg-surface-muted border border-border-subtle rounded-full py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary transition-colors text-primary placeholder:text-secondary" />
        </div>
        <button className="px-4 py-1.5 bg-primary text-on-primary rounded font-label-caps text-label-caps hover:opacity-90 transition-opacity uppercase tracking-widest hidden md:block">New Document</button>
      </div>
    </header>
  );
};

export default function MainLayout() {
  return (
    <div className="bg-surface text-text-charcoal font-body-md h-screen w-full flex overflow-hidden selection:bg-border-subtle selection:text-primary antialiased">
      <SideNavBar />
      <TopNavBar />
      <main className="ml-16 md:ml-20 mt-16 flex-1 h-[calc(100vh-64px)] overflow-auto bg-background relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
