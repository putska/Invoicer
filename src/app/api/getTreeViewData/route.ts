import { NextApiRequest, NextApiResponse } from "next";
import { getTreeViewData } from "../../db/actions"; // Assuming this function fetches categories and activities by project

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { projectId } = req.query; // Get the projectId from query parameters

    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId parameter" });
    }

    // Call your function to fetch categories and activities for the project
    const treeData = await getTreeViewData(Number(projectId)); // Convert projectId to number if necessary

    return res.status(200).json(treeData);
  } catch (error) {
    console.error("Error fetching tree view data:", error);
    res.status(500).json({ error: "Failed to fetch tree view data" });
  }
}
