import Head from "next/head";
import { Calendar } from "~/components/Calendar";
import { Navigation } from "~/components/Navigation";
import { TooltipProvider } from "~/components/ui/tooltip";

export default function Home() {
  return (
    <>
    <TooltipProvider>
      <Head>
        <title>Meal Planner</title>
        <meta name="description" content="Plan your meals in advance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Navigation />
        <main className="flex-1 sm:pl-14"> {/* Add padding-left on larger screens */}
          <Calendar />
        </main>
      </div>
    </TooltipProvider>
    </>
  );
}
