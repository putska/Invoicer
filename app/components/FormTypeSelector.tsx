// components/FormTypeSelector.tsx
import { useRouter } from "next/navigation";

interface FormTypeSelectorProps {
  onClose: () => void;
}

export default function FormTypeSelector({ onClose }: FormTypeSelectorProps) {
  const router = useRouter();

  const handleSelect = (formType: string) => {
    // Navigate to the "new" form page for the chosen form type
    router.push(`/modules/safety/${formType}/new`);
    onClose();
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-lg">
      <h2 className="text-xl font-bold mb-4">Select a Form Type to Create</h2>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleSelect("fall-protection")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Fall Protection
        </button>
        <button
          onClick={() => handleSelect("jha")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Job Hazard Aanalysis
        </button>
        <button
          onClick={() => handleSelect("tha")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Task Hazard Analysis
        </button>
        <button
          onClick={() => handleSelect("mewp")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          MEWP
        </button>
        <button
          onClick={() => handleSelect("witness-statement")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Witness Statement
        </button>
        <button
          onClick={() => handleSelect("telehandler")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Telehandler
        </button>
        <button
          onClick={() => handleSelect("swing-stage")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Swing Stage Inspection
        </button>
        <button
          onClick={() => handleSelect("lanyard-inspection")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Lanyard Inspection
        </button>
        <button
          onClick={() => handleSelect("accident-incident-report")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Accident Incedent Report
        </button>
        <button
          onClick={() => handleSelect("jobsite-safety")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Jobsite Safety Inspection
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
