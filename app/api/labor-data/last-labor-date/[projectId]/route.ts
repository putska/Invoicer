import { NextResponse } from "next/server";
import { getLastLaborDateForProject } from "../../../../db/actions";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  try {
    // Fetch the last labor date using the action
    const lastLaborDate = await getLastLaborDateForProject(projectId);

    // Return the response
    return NextResponse.json({ lastLaborDate });
  } catch (error) {
    console.error("Error fetching last labor date:", error);
    return NextResponse.json(
      { error: "Unable to retrieve last labor date" },
      { status: 500 }
    );
  }
}
