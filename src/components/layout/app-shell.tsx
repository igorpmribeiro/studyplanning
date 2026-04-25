import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { getOrCreatePlanning } from "@/actions/planning";
import { getDueReviewsCount } from "@/actions/revisoes";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const planning = await getOrCreatePlanning();
  const dueReviews = await getDueReviewsCount(planning.id);
  const badges = { revisoes: dueReviews };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar badges={badges} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header badges={badges} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
