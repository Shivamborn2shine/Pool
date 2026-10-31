import StoreOrderingView from "@/components/store/StoreOrderingView";

export default function StoreQrOrderingPage({
  params,
}: {
  params: { storeSlug: string };
}) {
  return <StoreOrderingView storeSlug={params.storeSlug} embedded={false} />;
}
