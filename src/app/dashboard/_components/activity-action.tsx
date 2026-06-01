import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { BarChart3, FileText, Pipette } from "lucide-react";
import moment from "moment-timezone";
import Link from "next/link";

const ActivityAction = async () => {
  const latestUsers = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
    select: {
      id: true,
      createdAt: true,
      first_name: true,
      last_name: true,
    },
  });

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {/* Recent Activity */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-primary">
              Recent Activity
            </h3>
          </div>
          <ul className="mt-4 space-y-3">
            {latestUsers.map(({ id, first_name, createdAt }) => (
              <li key={id} className="flex items-center gap-2 text-sm">
                <Pipette className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{first_name}</span>{" "}
                  registered a new account —{" "}
                  {moment(createdAt)
                    .tz("America/Tegucigalpa")
                    .format("MMMM D, YYYY [at] h:mm A")}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-primary">
              Quick Actions
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            <Button className="w-full bg-primary h-[40px] md:h-[45px]" asChild>
              <Link href="/dashboard/documents/new">Add new Document</Link>
            </Button>
            <Button className="w-full bg-primary h-[40px] md:h-[45px]" asChild>
              <Link href="/dashboard/users">Manage Users</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityAction;
