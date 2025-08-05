"use client";
import { useEffect, useState } from "react";
import TopAlert from "../reuseables/TopAlert";
import {
  Button,
  Step,
  StepLabel,
  Stepper,
  CircularProgress,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";
import {
  FaCodeBranch,
  FaArrowLeft,
  FaArrowRight,
  FaCode,
  FaFolder,
  FaCheck,
} from "react-icons/fa";
import { GoXCircleFill } from "react-icons/go";
import { LuCopy, LuFileCode2 } from "react-icons/lu";
import { MdEdit } from "react-icons/md";
import { SiTicktick } from "react-icons/si";
import { IoIosGitBranch } from "react-icons/io";
import { styled, keyframes } from "@mui/material/styles";
import {
  extractCodeBlocks,
  getMarkdownBlocks,
} from "../utils/reusableFunction";

export const TestGenerationBody = ({
  projectId,
  isPanelCollapsed,
  selectedProject,
  setSelectedBranch,
  setSelectedPathToOpen
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [branchListData, setBranchListData] = useState([]);
  const [branchListDataFetching, setBranchListDataFetching] = useState(false);
  const [selectedSubBranch, setSelectedSubBranch] = useState(null);
  const [uploadBranchFetching, setUploadBranchFetching] = useState(false);
  const [generateTestCasesFetching, setGenerateTestCasesFetching] =
    useState(false);
  const [changedBranchData, setChangedBranchData] = useState({});
  const [testCasesData, setTestCasesData] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localCodes, setLocalCodes] = useState([]);
  const [commitChangesFetching, setCommitChangesFetching] = useState(false);
  const [committedChanges, setCommittedChanges] = useState({});
  const [alert, setAlert] = useState({
    open: false,
    typeOfPopup: "",
    message: "",
  });

  const steps = [
    "Select Branch",
    "Choose Files",
    "Generated Tests",
    "Git Actions",
  ];

  useEffect(() => {
    if (projectId) {
      fetchProjectBranchList(projectId);
    }
  }, [projectId]);

  // Initialize when testCasesData changes
  useEffect(() => {
    setLocalCodes(testCasesData.map((tc) => tc.unit_test));
  }, [testCasesData]);

  const handleCodeChange = (index, newCode) => {
    setLocalCodes((prev) =>
      prev.map((code, i) => (i === index ? newCode : code))
    );
  };

  const handleSave = (idx) => {
    setTestCasesData((prev) =>
      prev.map((tc, i) =>
        i === idx ? { ...tc, unit_test: localCodes[idx] } : tc
      )
    );
    setIsEditing(false);
  };

  const fetchProjectBranchList = async (projId) => {
    setBranchListDataFetching(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/list-feature-branches?project_id=${projId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setBranchListData(data);
    } catch (err) {
      console.error(err);
      setAlert({
        open: true,
        typeOfPopup: "error",
        message: "Failed to get branch list. Please try again!!",
      });
    } finally {
      setBranchListDataFetching(false);
    }
  };

  const uploadFeatureBranch = async () => {
    setUploadBranchFetching(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/upload-feature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          feature_branch: selectedSubBranch,
        }),
      });

      const data = await response.json();

      if (data.detail) {
        setAlert({
          open: true,
          typeOfPopup: "warning",
          message: `${data.detail}`,
        });
      } else if (data.status === "success") {
        // setSelectedBranch(selectedSubBranch);
        setChangedBranchData(data);
        setActiveStep((prev) => prev + 1);
        setAlert({
          open: true,
          typeOfPopup: "success",
          message: "Found File changes!!!",
        });
      } else {
        setAlert({
          open: true,
          typeOfPopup: "error",
          message: "Failed to uploading. Please try again!!",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        open: true,
        typeOfPopup: "error",
        message: "Failed to uploading. Please try again!!",
      });
    } finally {
      setUploadBranchFetching(false);
    }
  };

  const generateTestCases = async () => {
    setGenerateTestCasesFetching(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/generate-unit-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: changedBranchData?.feature_id,
          file_name: selectedFile,
        }),
      });

      const data = await response.json();

      if (data.detail) {
        setAlert({
          open: true,
          typeOfPopup: "warning",
          message: `${data?.detail}`,
        });
      } else if (data.status === "success") {
        setTestCasesData(data?.tests);
        setActiveStep((prev) => prev + 1);
        setAlert({
          open: true,
          typeOfPopup: "success",
          message: "Testcases generated successfully!!",
        });
      } else {
        setAlert({
          open: true,
          typeOfPopup: "error",
          message:
            "Failed to generate Testcases. Please try again or Select another file!!",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        open: true,
        typeOfPopup: "error",
        message: "Failed Generating. Please try again!!",
      });
    } finally {
      setGenerateTestCasesFetching(false);
    }
  };

  const commitChanges = async () => {
    setCommitChangesFetching(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/create-unit-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          test_file_name: selectedFile?.replace(/\.(java|js|jsx|tsx)$/i, ""),
          branch_name: selectedSubBranch,
          unit_test: extractCodeBlocks(testCasesData[0]?.unit_test),
        }),
      });
      const data = await response.json();
      if (data.detail) {
        setAlert({
          open: true,
          typeOfPopup: "warning",
          message: `${data?.detail}`,
        });
      } else if (data.success) {
        setSelectedPathToOpen(data?.data?.test_file_path);
        setSelectedBranch(data?.data?.branch_name);
        setCommittedChanges(data?.data);
        setActiveStep((prev) => prev + 1);
        setAlert({
          open: true,
          typeOfPopup: "success",
          message: "Test files committed successfully!!",
        });
      } else {
        setAlert({
          open: true,
          typeOfPopup: "error",
          message: "Failed to Commit File. Please try again!!",
        });
      }
      // console.log("<<OO>>", data.data);
    } catch (err) {
      console.error(err);
      setAlert({
        open: true,
        typeOfPopup: "error",
        message: "Failed to commit changes. Please try again!!",
      });
    } finally {
      setCommitChangesFetching(false);
    }
  };

  const handleNext = () => {
    if (!selectedSubBranch) {
      return;
    }
    if (activeStep === 0) {
      uploadFeatureBranch();
    }
    if (activeStep === 1) {
      generateTestCases();
    }
    if (activeStep < steps.length) {
    }
  };

  const handleSubBranchSelection = (newVal) => {
    setSelectedSubBranch(newVal);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredBranches = Array.isArray(branchListData)
    ? branchListData.filter((branch) => branch !== selectedProject.main_branch)
    : [];

  return (
    <section className="flex-1 mr-6 flex flex-col min-h-0">
      <TopAlert
        open={alert.open}
        typeOfPopup={alert.typeOfPopup}
        message={alert.message}
        onClose={() => setAlert({ open: false, typeOfPopup: "", message: "" })}
      />
      <div className="shadow-xl border border-gray-300 flex flex-col flex-1 min-h-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6 flex flex-col flex-1 min-h-0">
          <Stepper activeStep={activeStep} alternativeLabel={false}>
            {steps.map((label, index) => (
              <Step key={index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Loader */}
          {(uploadBranchFetching ||
            generateTestCasesFetching ||
            commitChangesFetching) && (
            <div className="flex items-center justify-center h-full">
              <div
                className="flex flex-col items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 rounded-2xl shadow-xl border border-slate-200"
                style={{ maxHeight: 320, maxWidth: 320 }}
              >
                <h2 className="text-xl font-semibold text-gray-800 tracking-wide mb-2">
                  Processing Data
                </h2>

                <p className="text-gray-600 text-center text-sm mb-6">
                  Please wait while we process your request. This may take a few
                  moments.
                </p>

                <Box sx={{ width: "100%", maxWidth: 280 }}>
                  <AnimatedProgress />
                </Box>
              </div>
            </div>
          )}

          {/* Step 0*/}
          {!uploadBranchFetching && activeStep === 0 && (
            <div className="flex flex-col item-center flex-1 mt-10">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-light text-gray-900">
                  Branch Selection
                </h2>
                <p className="text-gray-600">
                  Select a branch to continue with the analysis
                </p>
              </div>
              <div className="flex justify-center item-center">
                <Autocomplete
                  options={filteredBranches}
                  value={selectedSubBranch}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <Box
                        component="li"
                        key={key}
                        {...rest}
                        className="flex items-center gap-2 px-4 py-2"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <FaCodeBranch className="w-4 h-4 text-gray-600" />
                        <span>{option}</span>
                      </Box>
                    );
                  }}
                  onChange={(e, newValue) =>
                    handleSubBranchSelection(newValue || "")
                  }
                  loading={branchListDataFetching}
                  loadingText={
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress sx={{ color: "#5c5c5cff" }} />
                    </Box>
                  }
                  noOptionsText="No results found"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select A branch"
                      fullWidth
                      sx={{ width: 450, backgroundColor: "#fff" }}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 1*/}
          {!generateTestCasesFetching && activeStep === 1 && (
            <div className="flex-1 mt-4">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Choose Files
                </h2>
                <p className="text-gray-600">
                  Select files that need test cases generated
                </p>
              </div>

              <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-100">
                <div className="mb-6 text-gray-700">
                  <h3 className="text-lg font-semibold uppercase flex items-center gap-2">
                    Available Files
                    <span>
                      <FaFolder className="w-6 h-6 text-purple-500" />
                    </span>
                  </h3>
                  <p>{`Total Files where code changes are found : ${changedBranchData.files_changed} `}</p>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {changedBranchData?.file_names?.map((file, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                        selectedFile === file
                          ? "bg-blue-50 border border-blue-200 shadow-sm"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setSelectedFile(selectedFile === file ? null : file)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <FaCode className="w-5 h-5 text-orange-400" />
                        <span className="font-medium text-gray-800">
                          {file}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-red-500">
                        <GoXCircleFill className="w-4 h-4" />
                        <span className="text-sm">Test Not Found</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {selectedFile ? (
                      <>
                        Selected:{" "}
                        <span className="text-blue-600 underline font-medium">
                          {selectedFile}
                        </span>
                      </>
                    ) : (
                      "Select a file to create test generation"
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {activeStep === 2 && (
            <div className="mt-6 flex-1 min-h-0 max-h-full">
              <div
                className="p-4 flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0"
                style={{
                  maxHeight: "600px",
                  scrollBehavior: "smooth",
                }}
              >
                {testCasesData?.map((testCase, idx) => {
                  const blocks = getMarkdownBlocks(
                    localCodes[idx],
                    isEditing,
                    (val) => handleCodeChange(idx, val)
                  );
                  return (
                    <div
                      key={idx}
                      className="mb-6 bg-white rounded-lg shadow-md border border-gray-100"
                    >
                      <div className="bg-white p-4 border-b flex items-center justify-between ">
                        <div className="flex items-center gap-2">
                          <FaCode className="w-5 h-5 text-orange-400" />
                          <span className="font-mono text-lg font-semibold text-gray-800">
                            {testCase?.file}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(testCase?.unit_test)}
                            className="flex items-center gap-2 bg-transparent"
                          >
                            {copied ? (
                              <>
                                <FaCheck className="w-4 h-4" />
                                {"Copied"}
                              </>
                            ) : (
                              <>
                                <LuCopy className="w-4 h-4" />
                                {"Copy Code"}
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsEditing(false);
                                }}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "0.5rem 1rem",
                                  gap: "0.5rem",
                                  backgroundColor: "#ef4444",
                                  color: "white",
                                  border: "1px solid #dc2626",
                                  "&:hover": {
                                    backgroundColor: "#dc2626",
                                  },
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleSave(idx)}
                                sx={{
                                  backgroundColor: "#16a34a",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  padding: "0.5rem 1rem",
                                  "&:hover": {
                                    backgroundColor: "#15803d",
                                  },
                                }}
                              >
                                Save Changes
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                disabled={true}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "0.5rem 1rem",
                                  gap: "0.5rem",
                                  backgroundColor: "#fb923c",
                                  color: "white",
                                  border: "1px solid #f97316",
                                  "&:hover": {
                                    backgroundColor: "#f97316",
                                  },
                                }}
                              >
                                <MdEdit className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => {
                                  commitChanges();
                                }}
                                variant="success"
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                sx={{
                                  backgroundColor: "#16a34a",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  padding: "0.5rem 1rem",
                                  "&:hover": {
                                    backgroundColor: "#15803d",
                                  },
                                }}
                              >
                                <FaCheck className="w-4 h-4" />
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="p-6">{blocks}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {!commitChangesFetching && activeStep === 3 && (
            <div className="mt-8 flex-1 min-h-0 max-h-full">
              <div className="max-w-lg w-full shadow-lg border-0 p-6 bg-white rounded-lg mx-auto">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                    <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                      <SiTicktick className="w-5 h-5 text-white" />
                    </span>
                    Commit Successful
                  </h1>
                  <p className="text-gray-600 mb-8 text-center">
                    Your test file has been committed successfully
                  </p>

                  {/* Details */}
                  <div className="space-y-4 text-left mb-8">
                    <div className="flex items-center gap-3">
                      <FaFolder className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Project:</span>
                      <span className="font-semibold">
                        {committedChanges?.project_id}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {committedChanges?.project_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <IoIosGitBranch className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Branch:</span>
                      <span className="font-mono font-semibold">
                        {committedChanges?.branch_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <LuFileCode2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">File:</span>
                      <span className="font-mono text-sm truncate max-w-xs overflow-hidden text-ellipsis">
                        {committedChanges?.test_file_path}
                      </span>
                    </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between mt-8 border-t border-gray-100">
            <Button
              disabled={
                activeStep === 0 ||
                uploadBranchFetching ||
                generateTestCasesFetching ||
                commitChangesFetching
              }
              onClick={() => setActiveStep((prev) => prev - 1)}
              variant="outlined"
              className="flex items-center p-6 "
              sx={{ backgroundColor: "#fff" }}
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                uploadBranchFetching ||
                generateTestCasesFetching ||
                commitChangesFetching
              }
              loading={
                uploadBranchFetching ||
                generateTestCasesFetching ||
                commitChangesFetching
              }
              loadingPosition="start"
              className="flex items-center p-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              sx={{ color: "#fff" }}
            >
              Continue
              <FaArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const progressMove = keyframes`
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const AnimatedProgress = styled(Box)({
  position: "relative",
  width: "100%",
  height: 4,
  backgroundColor: "#e0e0e0",
  borderRadius: 2,
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "33%",
    height: "100%",
    background: "linear-gradient(90deg, #2196f3, #21cbf3)",
    borderRadius: 2,
    animation: `${progressMove} 2s ease-in-out infinite`,
  },
});
