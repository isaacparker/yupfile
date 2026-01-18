import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consent Records</h1>
        <p className="text-gray-600">
          Manage your UGC consent records in one place
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No records yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Create your first consent request to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
