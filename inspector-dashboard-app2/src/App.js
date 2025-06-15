import React, { useState } from 'react';
import { User, Briefcase, FileText, Clipboard, Loader2, CheckCircle, AlertTriangle, UploadCloud, Trash2, ChevronDown, Sparkles, HelpCircle, X } from 'lucide-react';

// Modal Component for AI features
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
  const [jobDescription, setJobDescription] = useState('');
  
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
  
  const [modalContent, setModalContent] = useState(null);
  const [currentView, setCurrentView] = useState('form');

  const getEffectiveTargetRole = () => {
    return targetRole === "Other (Specify)" ? customTargetRole.trim() : targetRole;
  };

  // Helper function to call Gemini API
  const callGeminiAPI = async (prompt, schema = null) => {
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

  // Core Resume Generation Functions
  const identifyTransferableSkills = async () => {
    setIsLoadingSkills(true);
    setError('');
    setTransferableSkills([]);
    const effectiveRole = getEffectiveTargetRole();

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
    } catch (e) { 
        return null; 
    } finally { 
        setIsLoadingSkills(false); 
    }
  };

  const generateNewResume = async (skills) => {
    setIsLoadingResume(true);
    setError(''); 
    setGeneratedResume('');
    const effectiveRole = getEffectiveTargetRole();
    const transferableSkillsText = skills.map(skill => `* ${skill}`).join('\n');
    
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
    } catch (e) { 
        setCurrentView('form'); 
    } finally { 
        setIsLoadingResume(false); 
    }
  };
  
  // Cover Letter Generation
  const handleGenerateCoverLetter = async () => {
    setIsLoadingAiFeature(true);
    setError('');
    const effectiveRole = getEffectiveTargetRole();
    
    let jobDescriptionContext = "";
    if (jobDescription.trim()) {
        jobDescriptionContext = `
        **Target Job Description:**
        ---
        ${jobDescription.trim()}
        ---
        Use this job description to customize the cover letter with specific requirements and company details.
        `;
    }

    const prompt = `
      You are a professional career coach specializing in inspector roles. Generate a compelling cover letter for a '${effectiveRole}' position.
      ${jobDescriptionContext}
      
      **User Details:**
      * Name: ${userName.trim() || 'Inspector Candidate'}
      * Target Role: ${effectiveRole}
      
      **Key Skills to Highlight:**
      ${transferableSkills.map(skill => `* ${skill}`).join('\n')}
      
      **Instructions:**
      1. Write a professional, engaging cover letter that highlights relevant experience
      2. Focus on transferable skills that apply to inspection work
      3. Include specific examples of attention to detail, compliance, and problem-solving
      4. Keep it concise (3-4 paragraphs)
      5. Use a professional but personable tone
      
      Generate the cover letter now.
    `;
    
    try {
        const coverLetter = await callGeminiAPI(prompt);
        setGeneratedCoverLetter(coverLetter);
    } catch (e) {
        console.error('Error generating cover letter:', e);
    } finally {
        setIsLoadingAiFeature(false);
    }
  };

  // Interview Questions Generation
  const handleGenerateInterviewQuestions = async () => {
    setIsLoadingAiFeature(true);
    setError('');
    const effectiveRole = getEffectiveTargetRole();
    
    const prompt = `
      You are an expert interview coach specializing in inspector roles. Generate 8-10 likely interview questions for a '${effectiveRole}' position, along with guidance on how to answer them.
      
      **Target Role:** ${effectiveRole}
      **Key Skills:** ${transferableSkills.join(', ')}
      
      **Instructions:**
      1. Include a mix of behavioral, technical, and situational questions
      2. Focus on inspection-specific scenarios (quality control, compliance, documentation)
      3. Provide brief guidance on how to structure good answers
      4. Include questions about attention to detail, problem-solving, and communication
      
      Format as:
      **Question:** [Question text]
      **How to Answer:** [Brief guidance]
      
      Generate the interview preparation guide now.
    `;
    
    try {
        const questions = await callGeminiAPI(prompt);
        setGeneratedInterviewQuestions(questions);
    } catch (e) {
        console.error('Error generating interview questions:', e);
    } finally {
        setIsLoadingAiFeature(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    if (!userName.trim()) {
      setError('Please enter your name.');
      return false;
    }
    if (!userContact.trim()) {
      setError('Please enter your contact information.');
      return false;
    }
    if (!uploadedResumeText.trim()) {
      setError('Please upload your current resume.');
      return false;
    }
    if (targetRole === "Other (Specify)" && !customTargetRole.trim()) {
      setError('Please specify your target inspector role.');
      return false;
    }
    return true;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setCurrentView('generating');
    
    try {
      const skills = await identifyTransferableSkills();
      if (skills) {
        await generateNewResume(skills);
      } else {
        setError('Failed to analyze your resume. Please try again.');
        setCurrentView('form');
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setError('An error occurred while processing your resume. Please try again.');
      setCurrentView('form');
    }
  };

  // File Upload Handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setUploadedResumeText(text);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setFileName('');
    };
    reader.readAsText(file);
  };

  // Remove Uploaded File
  const removeUploadedFile = () => {
    setUploadedResumeText('');
    setFileName('');
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  // Copy to Clipboard
  const handleCopyToClipboard = (textToCopy) => {
    if (!textToCopy) return false;
    
    try {
      navigator.clipboard.writeText(textToCopy);
      return true;
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  };

  // Main Render Function
  const renderContent = () => {
    const isLoading = currentView === 'generating' || isLoadingSkills || isLoadingResume;
    
    if (isLoading && currentView !== 'display') { 
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg shadow-xl min-h-[400px]">
            <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
            <p className="text-gray-600 text-lg">Analyzing your resume and generating content...</p>
          </div>
        ); 
    }

    if (currentView === 'display' && generatedResume) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 text-center">Your Tailored Inspector Resume</h2>
          {jobDescription.trim() && <p className="text-sm text-center text-gray-500 mb-6">Optimized for: {getEffectiveTargetRole()}</p>}
          
          <div className="mb-6 p-4 border border-gray-300 rounded-md bg-gray-50 max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{generatedResume}</pre>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
            <button 
              onClick={() => { 
                if(handleCopyToClipboard(generatedResume)) { 
                  setCopied(true); 
                  setTimeout(()=>setCopied(false), 2000)
                } 
              }}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out">
              {copied ? (
                <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
              ) : (
                <Clipboard className="mr-2 h-5 w-5" />
              )}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button onClick={() => setCurrentView('form')} className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-md shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-150 ease-in-out">
              Generate New Resume
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                setIsLoadingAiFeature(true);
                setModalContent('coverLetter');
                handleGenerateCoverLetter();
              }}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
            >
              <FileText className="mr-2 h-5 w-5" />
              Generate Cover Letter
            </button>
            <button
              onClick={() => {
                setIsLoadingAiFeature(true);
                setModalContent('interviewQuestions');
                handleGenerateInterviewQuestions();
              }}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-150 ease-in-out"
            >
              <HelpCircle className="mr-2 h-5 w-5" />
              Generate Interview Questions
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Briefcase className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inspector Resume Builder</h1>
            <p className="text-gray-600">Transform your experience into an inspector-focused resume</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="userContact" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information *
                </label>
                <textarea
                  id="userContact"
                  value={userContact}
                  onChange={(e) => setUserContact(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Email, phone number, LinkedIn, address"
                  required
                />
              </div>
            </div>

            {/* Target Role Selection */}
            <div>
              <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Target Inspector Role *
              </label>
              <select
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {inspectorRoles.map((role, index) => (
                  <option key={index} value={role}>{role}</option>
                ))}
              </select>
              
              {targetRole === "Other (Specify)" && (
                <input
                  type="text"
                  value={customTargetRole}
                  onChange={(e) => setCustomTargetRole(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Specify your target inspector role"
                  required
                />
              )}
            </div>

            {/* Job Description (Optional) */}
            <div>
              <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Job Description (Optional)
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Paste the job description here to tailor your resume for specific requirements..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Including a job description will help tailor your resume with relevant keywords and requirements.
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UploadCloud className="inline h-4 w-4 mr-1" />
                Upload Current Resume *
              </label>
              
              {!fileName ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          accept=".txt,.doc,.docx"
                          onChange={handleFileUpload}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">TXT, DOC, DOCX up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm text-green-700">File uploaded: {fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeUploadedFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Generating Resume...
                </>
              ) : (
                <>
                  <Briefcase className="-ml-1 mr-3 h-5 w-5" />
                  Generate Inspector Resume
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderContent()}
      {modalContent && (
        <AIFeatureModal
          title={modalContent === 'coverLetter' ? 'Generated Cover Letter' : 'Interview Preparation Questions'}
          content={modalContent === 'coverLetter' ? generatedCoverLetter : generatedInterviewQuestions}
          isLoading={isLoadingAiFeature}
          onClose={() => {
            setModalContent(null);
            setIsLoadingAiFeature(false);
          }}
          onCopy={handleCopyToClipboard}
        />
      )}
    </div>
  );
}