// app/api/grid/configurations/[configId]/load/route.ts - Load specific configuration

import { NextRequest, NextResponse } from "next/server";
import { loadGridConfiguration } from "../../../../../../db/actions";
import { authenticate, authorize } from "../../../../../admin/helpers";

// POST /api/grid/configurations/[configId]/load
export async function POST(
  req: NextRequest,
  { params }: { params: { configId: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const configId = parseInt(params.configId, 10);
  if (isNaN(configId)) {
    return NextResponse.json(
      { message: "Invalid configuration ID" },
      { status: 400 }
    );
  }

  try {
    const result = await loadGridConfiguration(configId);

    return NextResponse.json(
      {
        message: "Configuration loaded successfully!",
        opening: result.opening,
        mullions: result.mullions,
        glassPanels: result.glassPanels,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error loading configuration:", error);
    return NextResponse.json(
      { message: "Error loading configuration" },
      { status: 500 }
    );
  }
}
