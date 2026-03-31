import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VillaDetailFallback({ params }: Props) {
  const { id } = await params;
  redirect(`/en/villas/${id}`);
}
