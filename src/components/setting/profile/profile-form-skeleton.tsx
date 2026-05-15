import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileFormSkeleton() {
  return (
    <div className={"flex flex-col gap-5"}>
      <Card>
        <CardContent className={"flex flex-col gap-5"}>
          <div className={"flex gap-5"}>
            <Skeleton className={"h-25 w-25 rounded-full"} />
            <div className={"flex flex-1 flex-col gap-2"}>
              <Skeleton className={"h-4 w-2/3"} />
              <Skeleton className={"h-4 w-full"} />
              <Skeleton className={"mt-5 h-8"} />
            </div>
          </div>
          <Skeleton className={"h-10 w-full"} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className={"flex flex-col gap-5"}>
          <Skeleton className={"h-4 w-1/5"} />
          <Skeleton className={"h-4 w-1/10"} />
          <Skeleton className={"h-10 w-full"} />
          <div className={"flex gap-5"}>
            <Skeleton className={"h-8 flex-1"} />
            <Skeleton className={"h-8 flex-1"} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className={"flex flex-col gap-5"}>
          <Skeleton className={"h-4 w-1/5"} />
          <Skeleton className={"h-4 w-1/10"} />
          <Skeleton className={"h-10 w-full"} />
          <div className={"flex gap-5"}>
            <Skeleton className={"h-8 flex-1"} />
            <Skeleton className={"h-8 flex-1"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
