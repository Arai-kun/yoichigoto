import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Amazon商品データコンバーター</CardTitle>
            <CardDescription>
              商品データをアップロードして、Amazon形式に変換します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload />
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            <p>
              PDF, Excel, 画像など様々な形式の商品データをAmazon形式に変換します
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
