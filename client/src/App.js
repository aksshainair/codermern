import axios from "axios";
import "./App.css";
import stubs from "./stubs";
import React, { useState, useEffect } from "react";
import moment from "moment";
import CodeMirror from '@uiw/react-codemirror'
import { tokyoNight } from '@uiw/codemirror-themes-all';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
// import {EditorView} from "@codemirror/view"



function App() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  useEffect(() => {
    setCode(stubs[language]);
  }, [language]);

  useEffect(() => {
    const defaultLang = localStorage.getItem("default-language") || "cpp";
    setLanguage(defaultLang);
  }, []);

  let pollInterval;

  const handleSubmit = async () => {
    const payload = {
      language,
      code,
    };
    try {
      setOutput("");
      setStatus(null);
      setJobId(null);
      setJobDetails(null);
      const { data } = await axios.post("http://localhost:5001/run", payload);
      if (data.jobId) {
        setJobId(data.jobId);
        setStatus("Submitted.");

        // poll here
        pollInterval = setInterval(async () => {
          const { data: statusRes } = await axios.get(
            `http://localhost:5001/status`,
            {
              params: {
                id: data.jobId,
              },
            }
          );
          const { success, job, error } = statusRes;
          console.log(statusRes, job);
          if (success) {
            const { status: jobStatus, output: jobOutput } = job;
            setStatus(jobStatus);

            setJobDetails(job);
            if (jobStatus === "pending"){
              return;
            }
            setOutput(jobOutput);
            clearInterval(pollInterval);
          } else {
            console.error(error);
            setOutput(error);
            setStatus("Bad request");
            clearInterval(pollInterval);
          }
        }, 2000);
      } else {
        setOutput("Retry again.");
      }
    } catch ({ response }) {
      if (response) {
        const errMsg = response.data.err.stderr;
        setOutput(errMsg);
      } else {
        setOutput("Please retry submitting.");
      }
    }
  };

  const setDefaultLanguage = () => {
    localStorage.setItem("default-language", language);
    console.log(`${language} set as default!`);
  };

  const renderTimeDetails = () => {
    if (!jobDetails) {
      return "";
    }
    let { submittedAt, startedAt, completedAt } = jobDetails;
    let result = "";
    submittedAt = moment(submittedAt).toString();
    result += `Job Submitted At: ${submittedAt}  `;
    if (!startedAt || !completedAt) return result;
    const start = moment(startedAt);
    const end = moment(completedAt);
    const diff = end.diff(start, "seconds", true);
    result += `Execution Time: ${diff}s`;
    return result;
  };


  return (
    <div className="App">

      <h1>Online Code Compiler</h1>
      <div>
        <label>Language:</label>
        <select
          value={language}
          onChange={(e) => {
            const shouldSwitch = window.confirm(
              "Are you sure you want to change language? WARNING: Your current code will be lost."
            );
            if (shouldSwitch) {
              setLanguage(e.target.value);
            }
          }}
        >
          <option value="cpp">C++</option>
          <option value="py">Python</option>
        </select>
      </div>
      <br />
      <div>
        <button onClick={setDefaultLanguage}>Set Default</button>
      </div>
      <br />

      <div className="flex">
        <div className="code-and-submit">
          <div className="editor-gradient">
            <CodeMirror
              className="editor"
              value={code}
              height="60vh"
              width="60vw"
              theme={tokyoNight}
              extensions={[cpp({ jsx: false }), python({ jsx: false })]}
              // autoFocus = 'true'
              // bracketMatching='true'
              
              onChange={(value, event) => {
                setCode(value);
              }}
            />
          </div>
            <button className="submit" onClick={handleSubmit}>Submit</button>
        </div>

      <div className="result">
        <div className="info">
          <h2>Status</h2>
          <p className="status">{status}</p>
          {jobId ? `Job ID: ${jobId}` : ""} <br/>
          {renderTimeDetails()}
        </div>
        <div className="output"> 
          <h2>Output</h2>
          <p>{output}</p>
        </div>
      </div>
      </div>

      <br />
      
    </div>
  );
}

export default App;
