import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-[140px]" />
        <Skeleton className="h-3 w-[100px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px]" />
      </CardContent>
    </Card>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <Skeleton className="h-8 w-[100px]" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}
