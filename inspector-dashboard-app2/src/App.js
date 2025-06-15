import React, { useState, useEffect } from 'react';
import { User, Briefcase, FileText, Clipboard, Loader2, Wand2, CheckCircle, AlertTriangle, UploadCloud, Trash2, ChevronDown, Sparkles, HelpCircle, X, ClipboardList } from 'lucide-react';

// Modal Component for new AI features
const AIFeatureModal = ({ title, content, isLoading, onClose, onCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Sparkles className="h-6 w-6 mr-2 text-indigo-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-3 min-h-[200px]">
                            <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
                            <p className="text-gray-600">Generating content...</p>
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{content}</pre>
                    )}
                </div>
                <div className="flex justify-end items-center p-4 border-t space-x-3">
                    <button 
                        onClick={handleCopy} 
                        disabled={isLoading || !content}
                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                    >
                        {copied ? <CheckCircle className="mr-2 h-5 w-5 text-green-400" /> : <Clipboard className="mr-2 h-5 w-5" />}
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// Main App Component
export default function App() {
  // State variables
  const [userName, setUserName] = useState('');
  const [userContact, setUserContact] = useState('');
  const [jobDescription, setJobDescription] = useState(''); // New state for job description
  
  const inspectorRoles = [
    "Field Inspector", "Property Inspector", "Home Inspector", "Building Inspector", 
    "Commercial Inspector", "Appraiser", "Vehicle Inspector", "Compliance Inspector", 
    "Quality Control Inspector", "Safety Inspector", "Insurance Inspector", 
    "Construction Inspector", "Environmental Inspector", "Other (Specify)" 
  ];
  const [targetRole, setTargetRole] = useState(inspectorRoles[0]);
  const [customTargetRole, setCustomTargetRole] = useState('');

  const [uploadedResumeText, setUploadedResumeText] = useState('');
  const [fileName, setFileName] = useState('');

  const [transferableSkills, setTransferableSkills] = useState([]);
  const [generatedResume, setGeneratedResume] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [generatedInterviewQuestions, setGeneratedInterviewQuestions] = useState('');


  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isLoadingAiFeature, setIsLoadingAiFeature] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [modalContent, setModalContent] = useState(null); // 'coverLetter' or 'interviewQuestions'

  const [currentView, setCurrentView] = useState('form'); // 'form', 'generating', 'display'

  const getEffectiveTargetRole = () => {
    return targetRole === "Other (Specify)" ? customTargetRole.trim() : targetRole;
  };

  // Helper function to call Gemini API
  const callGeminiAPI = async (prompt, schema = null) => {
    // *** IMPORTANT: Use the Environment Variable for the API Key ***
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    if (!apiKey) {
        setError("API Key is missing. Please ensure it's configured in the deployment environment.");
        throw new Error("Missing API Key");
    }

    let payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (schema) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: schema,
      };
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        return schema ? JSON.parse(text) : text;
      } else {
        console.error("Unexpected API response structure:", result);
        throw new Error("Failed to get valid content from API response.");
      }
    } catch (e) {
      console.error("Error calling Gemini API:", e);
      if (!error) {
        setError(`An error occurred while communicating with the AI: ${e.message}. Please try again.`);
      }
      throw e; 
    }
  };

  // --- Core Resume Generation Functions ---
  const identifyTransferableSkills = async () => {
    setIsLoadingSkills(true);
    setError('');
    setTransferableSkills([]);
    const effectiveRole = getEffectiveTargetRole();

    // Dynamically build the prompt based on whether a job description is provided
    let jobDescriptionContext = "";
    if (jobDescription.trim()) {
        jobDescriptionContext = `
        **Target Job Description (for context):**
        ---
        ${jobDescription.trim()}
        ---
        Your primary goal is to find skills in the resume that directly match the requirements in this job description.
        `;
    }

    const prompt = `
      You are an expert resume analyst. Analyze the following resume.
      ${jobDescriptionContext}
      Identify 5-7 key transferable skills from the resume that are most relevant for an '${effectiveRole}' role.
      Focus on skills like attention to detail, compliance, report writing, technical aptitude, and problem-solving. If a job description is provided, prioritize skills mentioned there.

      **Original Resume Text:**
      ---
      ${uploadedResumeText}
      ---
    `;
    const schema = { type: "ARRAY", items: { type: "STRING" } };
    try {
        const skills = await callGeminiAPI(prompt, schema);
        setTransferableSkills(skills || []); 
        return skills || [];
    } catch (e) { return null; } finally { setIsLoadingSkills(false); }
  };

  const generateNewResume = async (skills) => {
    setIsLoadingResume(true);
    setError(''); 
    setGeneratedResume('');
    const effectiveRole = getEffectiveTargetRole();
    const transferableSkillsText = skills.map(skill => `* ${skill}`).join('\n');
    
    // Dynamically build the prompt based on whether a job description is provided
    let jobDescriptionContext = "";
    if (jobDescription.trim()) {
        jobDescriptionContext = `
        **Crucial Context: Target Job Description**
        ---
        ${jobDescription.trim()}
        ---
        **VERY IMPORTANT**: You MUST tailor the resume to match the keywords, skills, and requirements found in this job description. Rephrase experience bullet points to reflect the language of the job description.
        `;
    }

    const prompt = `
      You are a professional resume writer specializing in creating compelling resumes for Inspector roles, including '${effectiveRole}'.
      ${jobDescriptionContext}
      Generate a tailored resume based on the provided user details, their original resume, and a list of key skills. The goal is a resume that is highly engaging for a recruiter and optimized to pass applicant tracking systems (ATS) for this specific role.

      **Instructions:**
      1.  **Structure:** The resume MUST include these sections: Full Name, Contact Information, Target Role Statement, Summary, Transferable Skills, Professional Experience, and Education/Certifications.
      2.  **Content Focus & Tone:**
          * Rewrite the **Summary** and **Professional Experience** bullet points to directly incorporate keywords and required skills from the job description if provided.
          * Use strong, quantifiable action verbs relevant to an inspector (e.g., Inspected, Verified, Documented, Assessed, Audited).
          * Ensure the final resume is professional, concise, and impactful.
      
      **User Details:**
      * Name: ${userName.trim() || 'Inspector Candidate'}
      * Contact: ${userContact.trim() || 'Contact details available upon request'}
      * Target Inspector Role: ${effectiveRole}

      **Original Resume Text (for context and experience extraction):**
      ---
      ${uploadedResumeText}
      ---

      **Key Transferable Skills to Highlight:**
      ---
      ${transferableSkillsText}
      ---

      Generate the tailored resume now.
    `;
    try {
        const resume = await callGeminiAPI(prompt);
        setGeneratedResume(resume);
        setCurrentView('display');
    } catch (e) { setCurrentView('form'); } finally { setIsLoadingResume(false); }
  };
  
  // --- Other Functions (Shortened for brevity) ---
  const handleGenerateCoverLetter = async () => { /* ... existing code ... */ };
  const handleGenerateInterviewQuestions = async () => { /* ... existing code ... */ };
  const validateForm = () => { /* ... existing code ... */ };
  const handleSubmit = async (e) => { /* ... existing code ... */ };
  const handleFileUpload = (event) => { /* ... existing code ... */ };
  const removeUploadedFile = () => { /* ... existing code ... */ };
  const handleCopyToClipboard = (textToCopy) => { /* ... existing code ... */ };

  // --- Main Render Function ---
  const renderContent = () => {
    const isLoading = currentView === 'generating' || isLoadingSkills || isLoadingResume;
    if (isLoading && currentView !== 'display') { 
        return <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg shadow-xl min-h-[400px]"><Loader2 className="animate-spin h-12 w-12 text-indigo-600" /></div>; 
    }

    if (currentView === 'display' && generatedResume) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 text-center">Your Tailored Inspector Resume</h2>
          {jobDescription.trim() && <p className="text-sm text-center text-gray-500 mb-6">Optimized for: {getEffectiveTargetRole()}</p>}
          <div className="mb-6 p-4 border border-gray-300 rounded-md bg-gray-50 max-h-[60vh] overflow-y-auto"><pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{generatedResume}</pre></div>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
            <button onClick={() => { if(handleCopyToClipboard(generatedResume)) { setCopied(true); setTimeout(()=>setCopied(false), 2000)} } }
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out">
              {copied ? <CheckCircle className="mr-2 h-5 w-5 text-green-400" /> : <Clipboard className=