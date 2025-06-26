// app/api/activities/[id]/delete-impact/route.ts
// New route for getting activity delete impact
import { NextRequest, NextResponse } from "next/server";
import {
  getActivityById,
  getActivityDeleteImpact,
} from "../../../../db/actions";
import { authenticate } from "../../../../../app/api/admin/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const activityId = parseInt(params.id, 10);

  if (isNaN(activityId)) {
    return NextResponse.json(
      { message: "Invalid activity ID" },
      { status: 400 }
    );
  }

  try {
    const impact = await getActivityDeleteImpact(activityId);
    const activity = await getActivityById(activityId);

    if (!activity) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        type: "activity",
        id: activityId,
        name: activity.name,
        impact,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting activity delete impact:", error);
    return NextResponse.json(
      { message: "Error getting delete impact" },
      { status: 500 }
    );
  }
}
