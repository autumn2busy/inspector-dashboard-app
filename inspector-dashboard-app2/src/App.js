import React, { useState } from 'react';
import { User, Briefcase, FileText, Clipboard, Loader2, CheckCircle, AlertTriangle, UploadCloud, Trash2, Sparkles, HelpCircle, X, ArrowUp } from 'lucide-react';

// Scroll to Top Component
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  React.useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

// Modal Component for AI features
const AIFeatureModal = ({ title, content, isLoading, onClose, onCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Sparkles className="h-7 w-7 mr-3 text-teal-600" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                            <Loader2 className="animate-spin h-12 w-12 text-teal-600" />
                            <p className="text-gray-600 text-lg">Generating professional content...</p>
                            <div className="w-64 bg-gray-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-teal-500 to-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{content}</pre>
                        </div>
                    )}
                </div>
                <div className="flex justify-end items-center p-6 border-t border-gray-200 space-x-4">
                    <button 
                        onClick={handleCopy} 
                        disabled={isLoading || !content}
                        className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200"
                    >
                        {copied ? <CheckCircle className="mr-2 h-5 w-5 text-green-400" /> : <Clipboard className="mr-2 h-5 w-5" />}
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200">
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
          <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
              <div className="relative mb-8">
                <Loader2 className="animate-spin h-16 w-16 text-teal-600 mx-auto" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Creating Your Professional Resume</h3>
              <p className="text-gray-600 text-lg mb-6">Our AI is analyzing your experience and tailoring it for inspector roles...</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-teal-500 to-blue-600 h-3 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">This usually takes 30-60 seconds</p>
            </div>
          </div>
        ); 
    }

    if (currentView === 'display' && generatedResume) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-600 to-blue-600 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-3">Your Professional Inspector Resume</h2>
              {jobDescription.trim() && (
                <div className="inline-flex items-center bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimized for: {getEffectiveTargetRole()}
                </div>
              )}
            </div>
            
            {/* Resume Display */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-4">
                <h3 className="text-white text-xl font-semibold">Your Tailored Resume</h3>
              </div>
              <div className="p-8">
                <div className="bg-gray-50 rounded-xl p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{generatedResume}</pre>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button 
                onClick={() => { 
                  if(handleCopyToClipboard(generatedResume)) { 
                    setCopied(true); 
                    setTimeout(()=>setCopied(false), 2000)
                  } 
                }}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:from-teal-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200">
                {copied ? (
                  <>
                    <CheckCircle className="mr-3 h-5 w-5 text-green-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="mr-3 h-5 w-5" />
                    Copy Resume
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setCurrentView('form')} 
                className="flex items-center justify-center px-6 py-4 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transform hover:scale-105 transition-all duration-200">
                <Briefcase className="mr-3 h-5 w-5" />
                Create New
              </button>
              
              <button
                onClick={() => {
                  setIsLoadingAiFeature(true);
                  setModalContent('coverLetter');
                  handleGenerateCoverLetter();
                }}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200">
                <FileText className="mr-3 h-5 w-5" />
                Cover Letter
              </button>
              
              <button
                onClick={() => {
                  setIsLoadingAiFeature(true);
                  setModalContent('interviewQuestions');
                  handleGenerateInterviewQuestions();
                }}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200">
                <HelpCircle className="mr-3 h-5 w-5" />
                Interview Prep
              </button>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-green-800 mb-2">🎉 Resume Generated Successfully!</h4>
              <p className="text-green-700">Your resume has been optimized for inspector roles and is ready to help you land your next opportunity.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-teal-600 to-blue-600 rounded-full mb-6 shadow-xl">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Inspector Resume Builder</h1>
            <p className="text-xl text-gray-600 mb-2">Transform your experience into an inspector-focused resume</p>
            <p className="text-sm text-teal-600 font-medium">🚨 Get hired 10X faster with AI-optimized resumes</p>
          </div>

          {/* Main Form Container */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Build Your Professional Resume</h2>
              <p className="text-teal-100 mt-2">Fill out the form below to create a tailored resume for inspector roles</p>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 font-semibold">Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-teal-100 pb-2">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="inline h-4 w-4 mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="userName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-2">
                        <Briefcase className="inline h-4 w-4 mr-2" />
                        Target Inspector Role *
                      </label>
                      <select
                        id="targetRole"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        {inspectorRoles.map((role, index) => (
                          <option key={index} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {targetRole === "Other (Specify)" && (
                    <div>
                      <input
                        type="text"
                        value={customTargetRole}
                        onChange={(e) => setCustomTargetRole(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="Specify your target inspector role"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="userContact" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Information *
                    </label>
                    <textarea
                      id="userContact"
                      value={userContact}
                      onChange={(e) => setUserContact(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                      placeholder="Email, phone number, LinkedIn, address"
                      required
                    />
                  </div>
                </div>

                {/* Job Description Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-teal-100 pb-2">Job Targeting (Optional)</h3>
                  
                  <div>
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="inline h-4 w-4 mr-2" />
                      Job Description
                    </label>
                    <textarea
                      id="jobDescription"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                      placeholder="Paste the job description here to tailor your resume for specific requirements..."
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      💡 Including a job description will help tailor your resume with relevant keywords and requirements.
                    </p>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-teal-100 pb-2">Current Resume</h3>
                  
                  {!fileName ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-400 transition-colors">
                      <UploadCloud className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <div className="text-lg text-gray-600 mb-2">Upload your current resume</div>
                      <div className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</div>
                      <label htmlFor="file-upload" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg cursor-pointer hover:from-teal-700 hover:to-blue-700 transition-all duration-200">
                        <UploadCloud className="mr-2 h-5 w-5" />
                        Choose File
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
                      <p className="text-xs text-gray-500 mt-3">Supports TXT, DOC, DOCX up to 10MB</p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
                        <div>
                          <div className="font-semibold text-green-800">File uploaded successfully</div>
                          <div className="text-sm text-green-600">{fileName}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                      Generating Your Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="-ml-1 mr-3 h-6 w-6" />
                      Generate My Inspector Resume
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">Advanced AI analyzes your experience and optimizes for inspector roles</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">ATS Optimized</h3>
              <p className="text-sm text-gray-600">Passes applicant tracking systems with targeted keywords</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Complete Package</h3>
              <p className="text-sm text-gray-600">Get resume, cover letter, and interview prep in one tool</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderContent()}
      <ScrollToTop />
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
      
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #0d9488, #2563eb);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0f766e, #1d4ed8);
        }
      `}</style>
    </div>
  );
}