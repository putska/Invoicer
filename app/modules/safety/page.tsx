import { getAllFormSubmissions } from "../../db/actions";
import SafetyFormListPage from "./SafetyFormListPage";
import { FormSubmission } from "../../types";

export default async function SafetyPage() {
  try {
    // Fetch initial data server-side
    const initialForms = await getAllFormSubmissions();

    // Map and prepare the data with explicit type casting
    const preparedForms: FormSubmission[] = initialForms.map((form) => ({
      ...form,
      dateCreated: form.dateCreated || "",
      // Explicitly cast formData to the expected type
      formData: form.formData as Record<string, any>,
    }));

    // Pass the typed data to your client component
    return <SafetyFormListPage initialForms={preparedForms} />;
  } catch (error) {
    // Handle errors gracefully
    console.error("Error loading initial forms:", error);
    // Pass empty array if there's an error, the client component will handle loading
    return <SafetyFormListPage initialForms={[]} />;
  }
}
