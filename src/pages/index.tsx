import Head from "next/head";
import { Calendar } from "~/components/Calendar";

export default function Home() {
  return (
    <>
      <Head>
        <title>Meal Planner</title>
        <meta name="description" content="Plan your meals in advance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <Calendar />
      </main>
    </>
  );
}
