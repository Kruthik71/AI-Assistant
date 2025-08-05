"use client";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { UploadCode } from "../components/UploadCode";
import { useVisualRegressionContext } from "../context/VisualRegressionContext";
import { usePathname } from "next/navigation";
import { Heading } from "../components/Heading";
import { PageChangeDropDown } from "../components/PageChangeDropDown";

export default function VisualRegression() {
  const {
    selectedProject,
    projectId,
    isPanelCollapsed,
    selectedBranch,
    setIsPanelCollapsed,
    setProjectId,
    setSelectedProject,
    setSelectedBranch,
  } = useVisualRegressionContext();

  const [branches, setBranches] = useState([]);
  const [defaultBranch, setDefaultBranch] = useState("");
  const [vrtResult, setVrtResult] = useState({});
  const [changedBranch, setChangedBranch] = useState("");
  const [vrtLoading, setVrtLoading] = useState(false);
  const pathname = usePathname();
  const [isLoadingVRT, setIsLoadingVRT] = useState("");

  useEffect(() => {
    const fetchProjectsAndSetBranch = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
  
        const data = await res.json();
        const allProjects = data.projects;
  
        const matchedProject = allProjects.find(
          (proj) => proj.git_url === selectedProject?.git_url
        );
  
        if (matchedProject) {
          setDefaultBranch(matchedProject.main_branch || "main");
  
          const branchesRes = await fetch(
            `http://localhost:8000/list-feature-branches?project_id=${projectId}`
          );
          if (!branchesRes.ok) throw new Error("Failed to fetch branches");
  
          const branchesData = await branchesRes.json();
          const filteredBranches = branchesData.filter(
            (branch) =>
              branch !== matchedProject.main_branch &&
              branch !== "main" &&
              branch !== "master"
          );
  
          setBranches(filteredBranches);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setDefaultBranch(null);
      }
    };
  
    if (selectedProject?.git_url) {
      fetchProjectsAndSetBranch();
    }
  }, [selectedProject]);
  

  const handleRunClick = async () => {
    if (!selectedProject?.git_url || !selectedBranch) {
      console.error("Missing project URL or branch");
      return;
    }
    setVrtLoading(true);
    const gitUrl = selectedProject.git_url;
    const branch = selectedBranch;
    const branchId = branch.replaceAll("/", "-");
    const projectIdPayload = `${selectedProject.project_id}-${branchId}`;

    try {
      setIsLoadingVRT("Cloning the feature branch");
      const cloneRes = await fetch(
        "http://localhost:8000/clone-feature-branch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ git_url: gitUrl, branch: changedBranch }),
        }
      );

      if (!cloneRes.ok) throw new Error("Clone branch failed");

      const cloneData = await cloneRes.json();
      setIsLoadingVRT("Starting the base project");
      const projectIdFromClone = cloneData.project_id;

      const reactRes2 = await fetch("http://localhost:8000/run-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!reactRes2.ok) throw new Error("Run React failed");
      const port2 = await reactRes2.json();
      const test_port = port2.url[0];
      setIsLoadingVRT("Launching the feature project");

      const reactRes = await fetch("http://localhost:8000/run-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectIdFromClone }),
      });

      if (!reactRes.ok) throw new Error("Run React failed");
      const port1 = await reactRes.json();
      const base_port = port1.url[0];

      setIsLoadingVRT("Generating snapshots and AI summary");
      const vrtRes = await fetch("http://localhost:8000/run-vrt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_url: test_port,
          test_url: base_port,
          open_browser: false,
        }),
      });

      if (!vrtRes.ok) throw new Error("Run VRT failed");
      const result = await vrtRes.json();
      setVrtLoading(false);
      setVrtResult(result);
    } catch (err) {
      console.error("Run pipeline failed:", err);
      setVrtLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between mb-6 pt-6 px-6 gap-2 flex-shrink-0">
          <Heading
            heading="Visual Regression"
            content="Identify unintended UI changes"
          />
          <UploadCode
            setProjectId={setProjectId}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            setSelectedBranch={setSelectedBranch}
            setIsPanelCollapsed={setIsPanelCollapsed}
          />
          <PageChangeDropDown pathname={pathname} />
        </div>

        {selectedProject && Object.keys(selectedProject).length > 0 && (
          <>
            <div className="px-10 py-10 shadow-md bg-white">
              <h2 className="text-lg font-semibold mb-4">Branch Selection</h2>

              <div className="flex flex-wrap items-end w-full gap-25">
                {/* Base Branch */}
                <div className="flex items-center w-half sm:w-1/3 min-w-[120px] gap-1.5">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Base Branch
                  </label>
                  <input
                    type="text"
                    value={defaultBranch}
                    disabled
                    className="border border-gray-300 px-4 py-2 rounded bg-gray-100 text-gray-500 w-full"
                  />
                </div>

                {/* Test Branch */}
                <div className="flex items-center w-half sm:w-1/3 min-w-[120px] gap-1.5">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Feature Branch
                  </label>
                  <select
                    value={changedBranch || ""}
                    onChange={(e) => setChangedBranch(e.target.value)}
                    className="border border-gray-300 px-4 py-2 rounded w-full"
                  >
                    <option value="" disabled hidden>
                      Select
                    </option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Run Button */}
                <div className="flex items-center">
                  <button
                    onClick={handleRunClick}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-6 py-2 rounded w-40"
                    disabled={!changedBranch || vrtLoading}
                  >
                    Run
                  </button>
                </div>
              </div>
            </div>

            {vrtLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <LoadingMessage message={isLoadingVRT} />
              </div>
            ) : (
              <>
                {vrtResult && Object.keys(vrtResult).length > 0 && (
                  <div className="text-center py-8 px-4">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                      {vrtResult.message}
                    </h3>

                    <a
                      href={vrtResult?.html_report}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 mb-6 inline-block"
                    >
                      View Full HTML Report
                    </a>

                    <div className="flex justify-center items-start gap-10 flex-wrap mt-6">
                      <ImageBlock
                        title="Base Snapshot"
                        src={vrtResult.base_image}
                      />
                      <ImageBlock
                        title="Test Snapshot"
                        src={vrtResult.test_image}
                      />
                      <ImageBlock
                        title="Diff Snapshot"
                        src={vrtResult.diff_image}
                      />
                    </div>
                  </div>
                )}

                {vrtResult?.llama_output?.changes?.some(
                  (change) => change.ai_suggestion
                ) && (
                  <div className="mt-10 px-6 py-8 bg-gray-50 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                      🧠 AI Suggestions
                    </h2>
                    {vrtResult.llama_output.changes
                      .filter((change) => change.ai_suggestion)
                      .map((change, index) => {
                        const suggestionLines = change.ai_suggestion
                          .split("\n")
                          .filter(Boolean);
                        return (
                          <div
                            key={index}
                            className="mb-6 border-b border-gray-200 pb-4"
                          >
                            <p className="text-lg font-medium text-blue-700 mb-2">
                              Selector:{" "}
                              <span className="font-mono text-gray-700">
                                {change.selector}
                              </span>
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm pl-4">
                              {suggestionLines.map((line, subIndex) => (
                                <li key={subIndex}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

function ImageBlock({ title, src }) {
  return (
    <div className="flex flex-col items-center w-72">
      {" "}
      {/* container width */}
      <h4 className="text-lg font-medium mb-2">{title}</h4>
      <div className="w-full h-60 border rounded shadow-md overflow-hidden flex items-center justify-center">
        <img
          src={`data:image/png;base64,${src}`}
          alt={title}
          className="max-w-full max-h-full object-contain"
          style={{ maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}

const LoadingMessage = ({ message }) => (
  <div className="flex items-center gap-2 text-blue-600 font-medium text-lg py-2 px-4">
    <span>{message}</span>
    <span className="ml-1 flex gap-0.5">
      <span className="animate-bounce">.</span>
      <span className="animate-bounce [animation-delay:0.2s]">.</span>
      <span className="animate-bounce [animation-delay:0.4s]">.</span>
    </span>
  </div>
);
