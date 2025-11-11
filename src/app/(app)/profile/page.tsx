import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-headline font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where your profile details will be displayed and can be edited. This feature is coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
