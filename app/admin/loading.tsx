import { PageContainer, SkeletonList } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <PageContainer>
      <div aria-busy="true" className="flex flex-col gap-5">
        <Skeleton className="h-9 w-56" />
        <SkeletonList className="h-20" />
      </div>
    </PageContainer>
  );
}
