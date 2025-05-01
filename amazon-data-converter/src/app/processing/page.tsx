
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProcessingStatus from "@/components/ProcessingStatus";

export default function ProcessingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">処理中...</CardTitle>
            <CardDescription>
              ファイルを処理しています。しばらくお待ちください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <ProcessingStatus />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
