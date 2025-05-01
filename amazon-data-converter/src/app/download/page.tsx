import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DownloadResult from "@/components/DownloadResult";

export default function DownloadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">処理完了！</CardTitle>
            <CardDescription>
              商品データの変換が完了しました
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DownloadResult />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/">
                新しいファイルを変換する
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
