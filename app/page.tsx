import HomeClient from "./home-client";
import { createPageMetadata } from "@/lib/seo";
import dbConnect from "@/lib/mongodb";
import SiteSetting from "@/models/siteSetting";

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: "Zero Error Esports | India-First Pro Gaming Community",
  description:
    "Zero Error Esports is an India-first esports organization delivering competitive events, ZE Club progression, and pro-level opportunities for players and creators.",
  path: "/",
});

async function getHeroMedia() {
  try {
    await dbConnect();
    const settings = (await SiteSetting.findOne({}, { heroVideoUrl: 1, heroPosterUrl: 1, _id: 0 }).lean()) as
      | { heroVideoUrl?: string; heroPosterUrl?: string }
      | null;

    return {
      videoUrl: settings?.heroVideoUrl ?? "",
      posterUrl: settings?.heroPosterUrl ?? "",
    };
  } catch {
    return {
      videoUrl: "",
      posterUrl: "",
    };
  }
}

export default async function Home() {
  const heroMedia = await getHeroMedia();

  return <HomeClient initialHeroMedia={heroMedia} />;
}
